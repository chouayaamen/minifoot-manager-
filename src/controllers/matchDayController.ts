import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

export async function getMatchDay(_req: AuthRequest, res: Response): Promise<void> {
  const md = await prisma.matchDay.findFirst({ orderBy: { date: 'desc' } });
  res.json({ matchDay: md });
}

export async function upsertMatchDay(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
  const parsed = z.object({ date: z.string().min(1), stadium: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const date = new Date(parsed.data.date);
  if (isNaN(date.getTime())) { res.status(400).json({ error: 'Invalid date' }); return; }
  const stadium = parsed.data.stadium.trim();
  const existing = await prisma.matchDay.findFirst({ orderBy: { date: 'desc' } });
  const md = existing
    ? await prisma.matchDay.update({ where: { id: existing.id }, data: { date, stadium, createdBy: req.user.userId } })
    : await prisma.matchDay.create({ data: { date, stadium, createdBy: req.user.userId } });
  res.json({ matchDay: md });
}
