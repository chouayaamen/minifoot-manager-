import { Request, Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

export async function sendFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  if (target.id === req.user.userId) { res.status(400).json({ error: 'Cannot friend yourself' }); return; }
  const existing = await prisma.friendRequest.findFirst({
    where: { OR: [{ requesterId: req.user.userId, addresseeId: target.id }, { requesterId: target.id, addresseeId: req.user.userId }] },
  });
  if (existing) { res.status(409).json({ error: 'Request already exists', request: existing }); return; }
  const req2 = await prisma.friendRequest.create({ data: { requesterId: req.user.userId, addresseeId: target.id, status: 'pending' } });
  res.status(201).json(req2);
}

export async function listFriends(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const uid = req.user.userId;
  const frs = await prisma.friendRequest.findMany({
    where: { OR: [{ requesterId: uid }, { addresseeId: uid }], status: 'accepted' },
    include: { requester: { select: { id: true, name: true, email: true } }, addressee: { select: { id: true, name: true, email: true } } },
  });
  const friends = frs.map((f) => ({ ...(f.requesterId === uid ? f.addressee : f.requester), requestId: f.id }));
  const pendingIn = await prisma.friendRequest.findMany({ where: { addresseeId: uid, status: 'pending' }, include: { requester: { select: { id: true, name: true, email: true } } } });
  const pendingOut = await prisma.friendRequest.findMany({ where: { requesterId: uid, status: 'pending' }, include: { addressee: { select: { id: true, name: true, email: true } } } });
  res.json({ friends, pendingIn, pendingOut });
}

export async function acceptFriend(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const fr = await prisma.friendRequest.findUnique({ where: { id } });
  if (!fr || fr.addresseeId !== req.user.userId) { res.status(404).json({ error: 'Request not found' }); return; }
  const upd = await prisma.friendRequest.update({ where: { id }, data: { status: 'accepted' } });
  res.json(upd);
}

export async function declineFriend(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const fr = await prisma.friendRequest.findUnique({ where: { id } });
  if (!fr || fr.addresseeId !== req.user.userId) { res.status(404).json({ error: 'Request not found' }); return; }
  const upd = await prisma.friendRequest.update({ where: { id }, data: { status: 'declined' } });
  res.json(upd);
}

export async function removeFriend(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const fr = await prisma.friendRequest.findUnique({ where: { id } });
  if (!fr) { res.status(404).json({ error: 'Not found' }); return; }
  if (fr.requesterId !== req.user.userId && fr.addresseeId !== req.user.userId) { res.status(403).json({ error: 'Forbidden' }); return; }
  await prisma.friendRequest.delete({ where: { id } });
  res.json({ ok: true });
}

export async function cancelRequest(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const id = req.params.id as string;
  const fr = await prisma.friendRequest.findUnique({ where: { id } });
  if (!fr || fr.requesterId !== req.user.userId) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.friendRequest.delete({ where: { id } });
  res.json({ ok: true });
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const q = (req.query.q as string) || '';
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {},
    select: { id: true, name: true, email: true, role: true },
    take: 20,
  });
  res.json(users);
}