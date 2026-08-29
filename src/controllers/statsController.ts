import { Request, Response } from 'express';
import prisma from '../utils/db';

function norm(t: string): string { return t.toLowerCase(); }

export async function leaderboard(_req: Request, res: Response): Promise<void> {
  const players = await prisma.player.findMany({ where: { isActive: true, user: { role: { not: 'manager' } } } });
  const events = await prisma.matchEvent.findMany();
  const matches = await prisma.match.findMany();
  const rsvps = await prisma.rsvp.findMany();

  const goalMap = new Map<string, number>();
  const assistMap = new Map<string, number>();
  const appsMap = new Map<string, Set<string>>();

  for (const e of events) {
    if (!e.playerId) continue;
    const t = norm(e.eventType);
    if (t === 'goal') goalMap.set(e.playerId, (goalMap.get(e.playerId) || 0) + 1);
    if (t === 'assist') assistMap.set(e.playerId, (assistMap.get(e.playerId) || 0) + 1);
    if (!appsMap.has(e.playerId)) appsMap.set(e.playerId, new Set());
    appsMap.get(e.playerId)!.add(e.matchId);
  }
  for (const r of rsvps) {
    const st = norm(r.status);
    if (st === 'attending' || st === 'available') {
      if (!appsMap.has(r.playerId)) appsMap.set(r.playerId, new Set());
      appsMap.get(r.playerId)!.add(r.matchId);
    }
  }

  const withStats = players.map((p) => ({
    ...p,
    goals: goalMap.get(p.id) || 0,
    assists: assistMap.get(p.id) || 0,
    appearances: appsMap.get(p.id)?.size || 0,
  }));

  const topScorers = [...withStats].sort((a,b)=> b.goals - a.goals || b.assists - a.assists).slice(0,10);
  const assistLeaders = [...withStats].sort((a,b)=> b.assists - a.assists || b.goals - a.goals).slice(0,10);
  const attendanceLeaders = [...withStats].sort((a,b)=> b.appearances - a.appearances).slice(0,10);

  const completed = matches.filter((m) => norm(m.status) === 'completed');
  const wins = completed.filter((m) => m.scoreHome > m.scoreAway).length;
  const draws = completed.filter((m) => m.scoreHome === m.scoreAway).length;
  const losses = completed.filter((m) => m.scoreHome < m.scoreAway).length;
  const totalGoalsScored = completed.reduce((s,m)=> s + m.scoreHome, 0) + events.filter((e)=> norm(e.eventType)==='goal').length;
  const totalConceded = completed.reduce((s,m)=> s + m.scoreAway, 0);
  const winRate = completed.length ? Math.round((wins / completed.length)*100) : 0;
  const form = completed.slice(-5).map((m)=> m.scoreHome > m.scoreAway ? 'W' : m.scoreHome === m.scoreAway ? 'D' : 'L');

  res.json({
    topScorers,
    assistLeaders,
    attendanceLeaders,
    teamOverview: {
      totalMatches: matches.length,
      completed: completed.length,
      wins, draws, losses,
      winRate,
      totalGoalsScored,
      totalConceded,
      goalDifference: totalGoalsScored - totalConceded,
      form,
    },
  });
}