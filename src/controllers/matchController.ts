import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { kitClashCheck } from '../utils/kitClash';

const createMatchSchema = z.object({
  opponent: z.string().min(1).max(100),
  matchDate: z.string().datetime().or(z.string().min(1)),
  venue: z.string().max(200).optional().nullable(),
  formatType: z.enum(['5v5', '6v6', '7v7', '8v8']),
  homeKitColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable().or(z.literal('').transform(() => null)),
  awayKitColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable().or(z.literal('').transform(() => null)),
  isHome: z.boolean().optional().default(true),
});

export async function listMatches(_req: Request, res: Response): Promise<void> {
  const matches = await prisma.match.findMany({ orderBy: { matchDate: 'asc' } });
  const enriched = await Promise.all(
    matches.map(async (m) => {
      const rsvps = await prisma.rsvp.findMany({ where: { matchId: m.id } });
      const counts = {
        ATTENDING: rsvps.filter((r) => r.status === 'ATTENDING' || r.status === 'available').length,
        UNAVAILABLE: rsvps.filter((r) => r.status === 'UNAVAILABLE' || r.status === 'unavailable').length,
        INJURED: rsvps.filter((r) => r.status === 'INJURED').length,
        LATE: rsvps.filter((r) => r.status === 'LATE').length,
        maybe: rsvps.filter((r) => r.status === 'maybe').length,
        total: rsvps.length,
      };
      const upcoming = new Date(m.matchDate) >= new Date();
      return { ...m, rsvpCounts: counts, upcoming, clash: kitClashCheck(m.homeKitColor, m.awayKitColor) };
    })
  );
  res.json(enriched);
}

export async function getMatch(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const rsvps = await prisma.rsvp.findMany({ where: { matchId: id } });
  res.json({ ...match, clash: kitClashCheck(match.homeKitColor, match.awayKitColor), rsvpCounts: { total: rsvps.length } });
}

export async function createMatch(req: Request, res: Response): Promise<void> {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const clash = kitClashCheck(d.homeKitColor || null, d.awayKitColor || null);
  const match = await prisma.match.create({
    data: {
      opponent: d.opponent,
      matchDate: new Date(d.matchDate),
      venue: d.venue || null,
      formatType: d.formatType,
      homeKitColor: d.homeKitColor || null,
      awayKitColor: d.awayKitColor || null,
      isHome: d.isHome ?? true,
    },
  });
  res.status(201).json({ ...match, clash });
}

export async function updateMatch(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parsed = createMatchSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  try {
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(d.opponent !== undefined && { opponent: d.opponent }),
        ...(d.matchDate !== undefined && { matchDate: new Date(d.matchDate as string) }),
        ...(d.venue !== undefined && { venue: d.venue }),
        ...(d.formatType !== undefined && { formatType: d.formatType }),
        ...(d.homeKitColor !== undefined && { homeKitColor: d.homeKitColor }),
        ...(d.awayKitColor !== undefined && { awayKitColor: d.awayKitColor }),
        ...(d.isHome !== undefined && { isHome: d.isHome }),
      },
    });
    res.json({ ...match, clash: kitClashCheck(match.homeKitColor, match.awayKitColor) });
  } catch {
    res.status(404).json({ error: 'Match not found' });
  }
}

export async function deleteMatch(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  try {
    await prisma.match.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Match not found' });
  }
}