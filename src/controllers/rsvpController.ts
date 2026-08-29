import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

const rsvpSchema = z.object({
  status: z.enum(['ATTENDING', 'UNAVAILABLE', 'INJURED', 'LATE', 'available', 'unavailable', 'maybe']),
  playerId: z.string().optional(),
});

function normalizeStatus(s: string): string {
  const map: Record<string, string> = { available: 'ATTENDING', unavailable: 'UNAVAILABLE', maybe: 'LATE' };
  return map[s] || s;
}

export async function setRsvp(req: AuthRequest, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const parsed = rsvpSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  let playerId: string | null = null;
  if (parsed.data.playerId) {
    const p = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
    if (!p) { res.status(404).json({ error: 'Player not found' }); return; }
    playerId = p.id;
  } else if (req.user) {
    const pl = await prisma.player.findUnique({ where: { userId: req.user.userId } });
    if (!pl) { res.status(404).json({ error: 'No player profile for authenticated user' }); return; }
    playerId = pl.id;
  } else {
    res.status(401).json({ error: 'Unauthorized: provide playerId or Bearer token' }); return;
  }
  const status = normalizeStatus(parsed.data.status);
  const existing = await prisma.rsvp.findUnique({ where: { matchId_playerId: { matchId, playerId } } });
  const rsvp = existing
    ? await prisma.rsvp.update({ where: { matchId_playerId: { matchId, playerId } }, data: { status, respondedAt: new Date() } })
    : await prisma.rsvp.create({ data: { matchId, playerId, status } });
  res.json(rsvp);
}

export async function getRsvps(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const rsvps = await prisma.rsvp.findMany({ where: { matchId }, include: { player: true } });
  const breakdown = {
    ATTENDING: rsvps.filter((r) => normalizeStatus(r.status) === 'ATTENDING'),
    UNAVAILABLE: rsvps.filter((r) => normalizeStatus(r.status) === 'UNAVAILABLE'),
    INJURED: rsvps.filter((r) => normalizeStatus(r.status) === 'INJURED'),
    LATE: rsvps.filter((r) => normalizeStatus(r.status) === 'LATE'),
  };
  res.json({
    matchId,
    total: rsvps.length,
    counts: {
      ATTENDING: breakdown.ATTENDING.length,
      UNAVAILABLE: breakdown.UNAVAILABLE.length,
      INJURED: breakdown.INJURED.length,
      LATE: breakdown.LATE.length,
    },
    rsvps,
    breakdown,
  });
}