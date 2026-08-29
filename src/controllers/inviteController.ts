import { Request, Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';
import { z } from 'zod';

export async function createInvite(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (req.user.role !== 'manager') { res.status(403).json({ error: 'Only managers can invite' }); return; }
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const target = await prisma.user.findUnique({ where: { email } });
  const existing = await prisma.invite.findUnique({ where: { managerId_email: { managerId: req.user.userId, email } } });
  if (existing) { res.status(409).json({ error: 'Already invited', invite: existing }); return; }
  const invite = await prisma.invite.create({
    data: { managerId: req.user.userId, email, playerId: target?.id || null, status: 'pending' },
  });
  res.status(201).json(invite);
}

export async function myInvites(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const invites = await prisma.invite.findMany({
    where: { email: user.email },
    include: { manager: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const total = await prisma.invite.count({ where: { email: user.email } });
  const accepted = await prisma.invite.count({ where: { email: user.email, status: 'accepted' } });
  res.json({ invites, total, accepted, isInvited: accepted > 0 });
}

export async function inviteStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  if (user.role === 'manager') { res.json({ isInvited: true, role: 'manager' }); return; }
  const accepted = await prisma.invite.findFirst({ where: { email: user.email, status: 'accepted' } });
  res.json({ isInvited: !!accepted, acceptedInvite: accepted || null });
}

export async function acceptInvite(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const inv = await prisma.invite.findUnique({ where: { id } });
  if (!inv) { res.status(404).json({ error: 'Invite not found' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user || user.email !== inv.email) { res.status(403).json({ error: 'Not your invite' }); return; }
  const upd = await prisma.invite.update({ where: { id }, data: { status: 'accepted', playerId: user.id } });
  res.json(upd);
}

export async function declineInvite(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const inv = await prisma.invite.findUnique({ where: { id } });
  if (!inv) { res.status(404).json({ error: 'Not found' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user || user.email !== inv.email) { res.status(403).json({ error: 'Not your invite' }); return; }
  const upd = await prisma.invite.update({ where: { id }, data: { status: 'declined' } });
  res.json(upd);
}

export async function managerInvites(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== 'manager') { res.status(403).json({ error: 'Forbidden' }); return; }
  const invites = await prisma.invite.findMany({ where: { managerId: req.user.userId }, orderBy: { createdAt: 'desc' } });
  res.json(invites);
}