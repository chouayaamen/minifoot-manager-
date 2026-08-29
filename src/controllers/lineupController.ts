import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { getFormation, defaultFormation, FORMATIONS, FormatType } from '../utils/formations';
import { AuthRequest } from '../middleware/authenticate';

const slotSchema = z.object({
  playerId: z.string().nullable().optional(),
  guestId: z.string().nullable().optional(),
  positionName: z.string().min(1),
});

const lineupSchema = z.object({
  formationName: z.string().min(1),
  pitchPositionsJson: z.record(z.string(), slotSchema),
});

function validateFormation(matchFormat: string, formationName: string): boolean {
  const fmts = FORMATIONS[matchFormat as FormatType];
  if (!fmts) return false;
  return fmts.some((f) => f.name === formationName);
}

export async function getLineup(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const lineup = await prisma.lineup.findUnique({ where: { matchId } });
  if (!lineup) { res.status(404).json({ error: 'No lineup yet', match, formation: defaultFormation(match.formatType as FormatType) }); return; }
  let parsed: Record<string, { playerId?: string | null; guestId?: string | null; positionName: string }> = {};
  try { parsed = JSON.parse(lineup.pitchPositionsJson); } catch { parsed = {}; }
  const playerIds = Object.values(parsed).map((v) => v.playerId).filter(Boolean) as string[];
  const guestIds = Object.values(parsed).map((v) => v.guestId).filter(Boolean) as string[];
  const players = playerIds.length ? await prisma.player.findMany({ where: { id: { in: playerIds } } }) : [];
  const guests = guestIds.length ? await prisma.guestPlayer.findMany({ where: { id: { in: guestIds } } }) : [];
  res.json({ lineup, match, assignments: parsed, players, guests, formationDef: getFormation(match.formatType as FormatType, lineup.formationName) });
}

export async function upsertLineup(req: AuthRequest, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const parsed = lineupSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const { formationName, pitchPositionsJson } = parsed.data;
  if (!validateFormation(match.formatType, formationName)) {
    res.status(400).json({ error: `Formation ${formationName} invalid for ${match.formatType}`, allowed: FORMATIONS[match.formatType as FormatType].map((f) => f.name) });
    return;
  }
  const slotCount = Object.keys(pitchPositionsJson).length;
  const expected = (Number(match.formatType[0]) as number);
  if (slotCount !== expected && slotCount !== 0) {
    const formationDef = getFormation(match.formatType as FormatType, formationName);
    if (formationDef && slotCount !== formationDef.slots.length) {
      res.status(400).json({ error: `Slot count ${slotCount} != formation ${formationName} expects ${formationDef.slots.length}` });
      return;
    }
  }
  for (const [slotId, raw] of Object.entries(pitchPositionsJson)) {
    const v = raw as { playerId?: string | null; guestId?: string | null; positionName: string };
    if (v.playerId) {
      const p = await prisma.player.findUnique({ where: { id: v.playerId } });
      if (!p) { res.status(400).json({ error: `playerId ${v.playerId} not found at slot ${slotId}` }); return; }
    }
    if (v.guestId) {
      const g = await prisma.guestPlayer.findUnique({ where: { id: v.guestId } });
      if (!g) { res.status(400).json({ error: `guestId ${v.guestId} not found at slot ${slotId}` }); return; }
      if (g.matchId !== matchId) { res.status(400).json({ error: `guest ${v.guestId} belongs to different match` }); return; }
    }
  }
  const jsonStr = JSON.stringify(pitchPositionsJson);
  const existing = await prisma.lineup.findUnique({ where: { matchId } });
  const lineup = existing
    ? await prisma.lineup.update({ where: { matchId }, data: { formationName, pitchPositionsJson: jsonStr, createdBy: req.user?.userId || null } })
    : await prisma.lineup.create({ data: { matchId, formationName, pitchPositionsJson: jsonStr, createdBy: req.user?.userId || null } });
  res.status(existing ? 200 : 201).json(lineup);
}

const guestSchema = z.object({
  name: z.string().min(1).max(100),
  assignedPosition: z.enum(['GK', 'DEF', 'MID', 'PIVOT']).optional().nullable(),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional().nullable(),
});

export async function addGuest(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  const parsed = guestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const guest = await prisma.guestPlayer.create({
    data: {
      matchId,
      name: parsed.data.name,
      assignedPosition: parsed.data.assignedPosition || null,
      jerseyNumber: parsed.data.jerseyNumber ?? null,
    },
  });
  res.status(201).json(guest);
}

export async function listGuests(req: Request, res: Response): Promise<void> {
  const matchId = req.params.id as string;
  const guests = await prisma.guestPlayer.findMany({ where: { matchId }, orderBy: { createdAt: 'asc' } });
  res.json(guests);
}

export async function deleteGuest(req: Request, res: Response): Promise<void> {
  const guestId = req.params.guestId as string;
  try {
    await prisma.guestPlayer.delete({ where: { id: guestId } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Guest not found' });
  }
}