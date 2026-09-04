import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

export async function listComments(_req: Request, res: Response): Promise<void> {
  const comments = await prisma.pitchComment.findMany({
    where: { parentId: null },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, role: true } }, replies: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } } },
  });
  res.json(comments);
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const parsed = z.object({ content: z.string().min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const comment = await prisma.pitchComment.create({
    data: { userId: req.user.userId, content: parsed.data.content.trim() },
    include: { user: { select: { name: true, role: true } } },
  });
  res.status(201).json(comment);
}

export async function replyComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (req.user.role !== 'manager') { res.status(403).json({ error: 'Only managers can reply' }); return; }
  const parentId = req.params.id as string;
  const parent = await prisma.pitchComment.findUnique({ where: { id: parentId } });
  if (!parent) { res.status(404).json({ error: 'Comment not found' }); return; }
  if (parent.parentId) { res.status(400).json({ error: 'Can only reply to top-level comments' }); return; }
  const parsed = z.object({ content: z.string().min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
  const reply = await prisma.pitchComment.create({
    data: { userId: req.user.userId, content: parsed.data.content.trim(), parentId },
    include: { user: { select: { name: true, role: true } } },
  });
  res.status(201).json(reply);
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const c = await prisma.pitchComment.findUnique({ where: { id } });
  if (!c) { res.status(404).json({ error: 'Not found' }); return; }
  if (c.userId !== req.user.userId && req.user.role !== 'manager') { res.status(403).json({ error: 'Forbidden' }); return; }
  await prisma.pitchComment.delete({ where: { id } });
  res.json({ ok: true });
}