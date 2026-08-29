import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

const resultSchema = z.object({
  scoreHome: z.coerce.number().int().min(0).max(30),
  scoreAway: z.coerce.number().int().min(0).max(30),
  status: z.enum(['completed', 'COMPLETED', 'live', 'scheduled']).optional().default('COMPLETED'),
});

export async function setResult(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const updated = await prisma.match.update({
    where: { id },
    data: { scoreHome: parsed.data.scoreHome, scoreAway: parsed.data.scoreAway, status: 'completed' },
  });
  res.json(updated);
}

const eventSchema = z.object({
  playerId: z.string().min(1).nullable().optional(),
  guestPlayerId: z.string().min(1).nullable().optional(),
  eventType: z.enum(['GOAL','ASSIST','YELLOW_CARD','RED_CARD','goal','assist','yellow_card','red_card']),
  minute: z.coerce.number().int().min(0).max(90),
  description: z.string().max(200).optional().nullable(),
});

function normalizeType(t: string): string {
  const m: Record<string,string> = { GOAL:'goal', ASSIST:'assist', YELLOW_CARD:'yellow_card', RED_CARD:'red_card' };
  return m[t] || t;
}

export async function addEvents(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const body = Array.isArray(req.body) ? req.body : req.body.events;
  if (!Array.isArray(body)) { res.status(400).json({ error: 'Body must be array or { events: [] }' }); return; }
  const parsed = z.array(eventSchema).safeParse(body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  for (const e of parsed.data) {
    if (e.playerId) {
      const p = await prisma.player.findUnique({ where: { id: e.playerId } });
      if (!p) { res.status(400).json({ error: `playerId ${e.playerId} not found` }); return; }
    }
    if (e.guestPlayerId) {
      const g = await prisma.guestPlayer.findUnique({ where: { id: e.guestPlayerId } });
      if (!g) { res.status(400).json({ error: `guestPlayerId ${e.guestPlayerId} not found` }); return; }
    }
    if (!e.playerId && !e.guestPlayerId) { res.status(400).json({ error: 'Each event needs playerId or guestPlayerId' }); return; }
  }
  const created = await prisma.$transaction(
    parsed.data.map((e) => prisma.matchEvent.create({
      data: { matchId, playerId: e.playerId || null, guestPlayerId: e.guestPlayerId || null, eventType: normalizeType(e.eventType), minute: e.minute, description: e.description || null },
    }))
  );
  let home = match.scoreHome, away = match.scoreAway;
  const goals = created.filter((c) => c.eventType === 'goal').length;
  if (goals > 0 && match.status !== 'completed') {
    home = Math.max(home, goals);
  }
  res.status(201).json(created);
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const events = await prisma.matchEvent.findMany({ where: { matchId }, orderBy: { minute: 'asc' }, include: { player: true, guestPlayer: true } });
  res.json(events);
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const eventId = req.params.eventId as string;
  try {
    await prisma.matchEvent.delete({ where: { id: eventId } });
    res.json({ ok: true });
  } catch { res.status(404).json({ error: 'Event not found' }); }
}