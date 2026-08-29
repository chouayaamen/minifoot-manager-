import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

const profileSchema = z.object({
  photoUrl: z.string().min(1).optional().or(z.literal('')).nullable(),
  heightCm: z.coerce.number().int().min(100).max(250).optional().nullable(),
  weightKg: z.coerce.number().int().min(30).max(200).optional().nullable(),
  primaryPosition: z.enum(['GK', 'DEF', 'MID', 'PIVOT']),
  secondaryPosition: z.enum(['GK', 'DEF', 'MID', 'PIVOT']).optional().nullable(),
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional().nullable(),
  name: z.string().min(2).max(100).optional(),
  nickname: z.string().min(2).max(30).optional().or(z.literal('')).nullable(),
  bio: z.string().max(280).optional().or(z.literal('')).nullable(),
  phone: z.string().max(20).optional().or(z.literal('')).nullable(),
}).refine(
  (d) => !(d.secondaryPosition && d.secondaryPosition === d.primaryPosition),
  { message: 'Secondary position must differ from primary', path: ['secondaryPosition'] }
).refine(
  (d) => !(d.primaryPosition === 'GK' && d.secondaryPosition && ['MID', 'PIVOT'].includes(d.secondaryPosition)),
  { message: 'GK secondary must be GK or DEF only', path: ['secondaryPosition'] }
);

function calcOverall(heightCm?: number | null, weightKg?: number | null, pos?: string): number | null {
  if (!heightCm || !weightKg || !pos) return null;
  if (pos === 'GK') return Math.min(99, Math.max(40, Math.round(heightCm * 0.35 + weightKg * 0.2 + 15)));
  const base = 55;
  const hMod = (heightCm - 175) * 0.5;
  const wMod = (weightKg - 75) * 0.3;
  const pMod = pos === 'PIVOT' ? 5 : pos === 'MID' ? 3 : 0;
  return Math.min(99, Math.max(40, Math.round(base + hMod + wMod + pMod)));
}

export async function upsertProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const overallRating = calcOverall(data.heightCm ?? null, data.weightKg ?? null, data.primaryPosition);
    const existing = await prisma.player.findUnique({ where: { userId: user.id } });
    const playerName = data.name ?? user.name;

    let player;
    const baseData = {
      name: playerName,
      nickname: data.nickname || null,
      bio: data.bio || null,
      phone: data.phone || null,
      photoUrl: data.photoUrl || null,
      heightCm: data.heightCm ?? null,
      weightKg: data.weightKg ?? null,
      primaryPosition: data.primaryPosition as string,
      secondaryPosition: (data.secondaryPosition as string) || null,
      preferredFoot: data.preferredFoot as string,
      jerseyNumber: data.jerseyNumber ?? null,
      overallRating,
    };
    if (existing) {
      player = await prisma.player.update({ where: { userId: user.id }, data: baseData });
    } else {
      player = await prisma.player.create({ data: { userId: user.id, ...baseData } });
    }
    res.status(existing ? 200 : 201).json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const player = await prisma.player.findUnique({ where: { userId: req.user.userId }, include: { user: { select: { email: true, name: true, role: true } } } });
  if (!player) { res.status(404).json({ error: 'No profile yet' }); return; }
  res.json(player);
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) { res.status(400).json({ error: 'No file uploaded (field: avatar)' }); return; }
  const url = `/uploads/${file.filename}`;
  const player = await prisma.player.findUnique({ where: { userId: req.user.userId } });
  if (player) await prisma.player.update({ where: { userId: req.user.userId }, data: { photoUrl: url } });
  res.json({ url, filename: file.filename });
}

export async function getPlayerById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const player = await prisma.player.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!player) { res.status(404).json({ error: 'Player not found' }); return; }

    const events = await prisma.matchEvent.findMany({ where: { playerId: id } });
    const rsvps = await prisma.rsvp.findMany({ where: { playerId: id } });

    const goals = events.filter((e: unknown) => (e as {eventType:string}).eventType === 'goal').length;
    const assists = events.filter((e: unknown) => (e as {eventType:string}).eventType === 'assist').length;
    const appearances = new Set(events.map((e: unknown) => (e as {matchId:string}).matchId)).size;
    const rsvpCount = rsvps.length;

    const matchIds = [...new Set(events.map((e: unknown) => (e as {matchId:string}).matchId))];
    let wins = 0;
    if (matchIds.length > 0) {
      const matches = await prisma.match.findMany({ where: { id: { in: matchIds }, status: 'completed' } });
      wins = matches.filter((m: unknown) => (m as {scoreHome:number;scoreAway:number}).scoreHome > (m as {scoreHome:number;scoreAway:number}).scoreAway).length;
    }
    const winRate = appearances > 0 ? Math.round((wins / appearances) * 100) : 0;

    res.json({
      ...player,
      stats: { goals, assists, appearances, rsvpCount, wins, winRate, totalEvents: events.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listPlayers(_req: Request, res: Response): Promise<void> {
  try {
    const players = await prisma.player.findMany({
      where: { isActive: true, user: { role: { not: 'manager' } } },
      orderBy: { overallRating: 'desc' },
      include: { user: { select: { email: true, role: true } } },
    });

    const enriched = await Promise.all(
      players.map(async (p: unknown) => {
        const pl = p as {id:string};
        const events = await prisma.matchEvent.findMany({ where: { playerId: pl.id } });
        return {
          ...(p as object),
          stats: {
            goals: events.filter((e: unknown) => (e as {eventType:string}).eventType === 'goal').length,
            assists: events.filter((e: unknown) => (e as {eventType:string}).eventType === 'assist').length,
            appearances: new Set(events.map((e: unknown) => (e as {matchId:string}).matchId)).size,
          },
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}