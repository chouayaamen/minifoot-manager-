import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/authenticate';

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function getActiveSquadForUser(userId: string, role: string) {
  if (role === 'manager') {
    const squad = await prisma.squad.findFirst({ where: { managerId: userId } });
    return squad;
  }
  const player = await prisma.player.findUnique({ where: { userId } });
  if (player?.squadId) {
    const squad = await prisma.squad.findUnique({ where: { id: player.squadId } });
    return squad;
  }
  return null;
}

async function getOrCreateManagerSquad(userId: string, userName: string) {
  let squad = await prisma.squad.findFirst({ where: { managerId: userId } });
  if (!squad) {
    let code = generateCode();
    while (await prisma.squad.findUnique({ where: { code } })) code = generateCode();
    squad = await prisma.squad.create({
      data: { name: `${userName}'s Squad`, code, managerId: userId },
    });
  }
  return squad;
}

export async function getSquadRoster(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const squad = await getActiveSquadForUser(req.user.userId, req.user.role);
    if (!squad) { res.json({ squad: null, players: [] }); return; }

    const players = await prisma.player.findMany({
      where: { squadId: squad.id, isActive: true },
      orderBy: { overallRating: 'desc' },
      include: { user: { select: { email: true, role: true, name: true } } },
    });

    const enriched = await Promise.all(
      players.map(async (p) => {
        const events = await prisma.matchEvent.findMany({ where: { playerId: p.id } });
        return {
          ...p,
          stats: {
            goals: events.filter((e) => e.eventType === 'goal').length,
            assists: events.filter((e) => e.eventType === 'assist').length,
            appearances: new Set(events.map((e) => e.matchId)).size,
          },
        };
      })
    );

    res.json({ squad, players: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMySquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const squad = await getActiveSquadForUser(req.user.userId, req.user.role);
    res.json({ squad: squad || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
    const schema = z.object({ name: z.string().min(2).max(50).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
    const existing = await prisma.squad.findFirst({ where: { managerId: req.user.userId } });
    if (existing) { res.status(409).json({ error: 'Squad already exists', squad: existing }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    let code = generateCode();
    while (await prisma.squad.findUnique({ where: { code } })) code = generateCode();
    const squad = await prisma.squad.create({
      data: { name: parsed.data.name || `${user?.name || 'My'}'s Squad`, code, managerId: req.user.userId },
    });
    res.status(201).json(squad);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const addPlayerSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).optional(),
  playerId: z.string().optional(),
}).refine((d) => !!d.email || !!d.username || !!d.playerId, { message: 'Provide email, username or playerId' });

export async function addPlayerToSquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const parsed = addPlayerSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
    const inviter = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!inviter) { res.status(404).json({ error: 'User not found' }); return; }

    let squad = await getActiveSquadForUser(req.user.userId, req.user.role);
    if (!squad) {
      if (req.user.role === 'manager') {
        squad = await getOrCreateManagerSquad(req.user.userId, inviter.name);
      } else {
        res.status(400).json({ error: 'You must be in a squad to invite friends. Join a squad first.' });
        return;
      }
    }

    let targetPlayer: { id: string; squadId: string | null } | null = null;

    if (parsed.data.playerId) {
      targetPlayer = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
    } else if (parsed.data.email) {
      const targetUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (!targetUser) { res.status(404).json({ error: 'No registered user with that email' }); return; }
      targetPlayer = await prisma.player.findUnique({ where: { userId: targetUser.id } });
      if (!targetPlayer) { res.status(404).json({ error: 'User has no player profile yet' }); return; }
    } else if (parsed.data.username) {
      const targetUser = await prisma.user.findFirst({ where: { name: parsed.data.username } });
      if (!targetUser) { res.status(404).json({ error: 'No registered user with that username' }); return; }
      targetPlayer = await prisma.player.findUnique({ where: { userId: targetUser.id } });
      if (!targetPlayer) { res.status(404).json({ error: 'User has no player profile yet' }); return; }
    }

    if (!targetPlayer) { res.status(404).json({ error: 'Player not found' }); return; }
    if (targetPlayer.squadId === squad.id) { res.status(409).json({ error: 'Player already in squad' }); return; }

    if (req.user.role !== 'manager') {
      const targetUserId = (parsed.data.email || parsed.data.username)
        ? (await prisma.user.findFirst({ where: parsed.data.email ? { email: parsed.data.email } : { name: parsed.data.username! } }))?.id || (await prisma.player.findUnique({ where: { id: targetPlayer.id } }))?.userId
        : (await prisma.player.findUnique({ where: { id: targetPlayer.id } }))?.userId;
      if (targetUserId) {
        const isFriend = await prisma.friendRequest.findFirst({
          where: {
            status: 'accepted',
            OR: [
              { requesterId: req.user.userId, addresseeId: targetUserId },
              { requesterId: targetUserId, addresseeId: req.user.userId },
            ],
          },
        });
        if (!isFriend) { res.status(403).json({ error: 'Only friends can be invited to your squad. Add as friend first.' }); return; }
      }
    }

    const existingReq = await prisma.squadJoinRequest.findFirst({ where: { squadId: squad.id, playerId: targetPlayer.id, status: 'pending' } });
    if (existingReq) { res.status(409).json({ error: 'Player already in waiting list', request: existingReq }); return; }
    const request = await prisma.squadJoinRequest.create({ data: { squadId: squad.id, playerId: targetPlayer.id, status: 'pending' } });
    const withPlayer = await prisma.squadJoinRequest.findUnique({ where: { id: request.id }, include: { player: { include: { user: { select: { email: true, name: true } } } } } });
    res.status(201).json({ message: 'Player added to waiting list — awaiting manager approval', request: withPlayer, squad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getJoinRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const ownPlayer = await prisma.player.findUnique({ where: { userId: req.user.userId } });
    if (ownPlayer) {
      const mine = await prisma.squadJoinRequest.findMany({ where: { playerId: ownPlayer.id, status: 'pending' }, include: { squad: true, player: { include: { user: { select: { email: true, name: true } } } } } });
      if (mine.length > 0 && req.user.role !== 'manager') {
        res.json({ squad: mine[0].squad, requests: mine, isManager: false });
        return;
      }
      if (mine.length > 0 && req.user.role === 'manager' && !(await prisma.squad.findFirst({ where: { managerId: req.user.userId } }))) {
        res.json({ squad: mine[0].squad, requests: mine, isManager: false });
        return;
      }
    }
    const squad = await getActiveSquadForUser(req.user.userId, req.user.role);
    if (!squad) { res.json({ squad: null, requests: ownPlayer ? await prisma.squadJoinRequest.findMany({ where: { playerId: ownPlayer.id, status: 'pending' }, include: { squad: true, player: true } }) : [] }); return; }
    if (req.user.role !== 'manager' && !(await prisma.player.findFirst({ where: { userId: req.user.userId, squadId: squad.id } }))) {
      const own = ownPlayer || await prisma.player.findUnique({ where: { userId: req.user.userId } });
      if (own) {
        const mine = await prisma.squadJoinRequest.findMany({ where: { playerId: own.id, status: 'pending' }, include: { squad: true, player: true } });
        res.json({ squad, requests: mine, isManager: false });
        return;
      }
    }
    const requests = await prisma.squadJoinRequest.findMany({
      where: { squadId: squad.id, status: 'pending' },
      include: { player: { include: { user: { select: { email: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ squad, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acceptJoinRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
    const id = req.params.id as string;
    const reqEntry = await prisma.squadJoinRequest.findUnique({ where: { id }, include: { squad: true } });
    if (!reqEntry) { res.status(404).json({ error: 'Request not found' }); return; }
    const squad = await prisma.squad.findFirst({ where: { managerId: req.user.userId } });
    if (!squad || reqEntry.squadId !== squad.id) { res.status(403).json({ error: 'Not your squad request' }); return; }
    await prisma.player.update({ where: { id: reqEntry.playerId }, data: { squadId: squad.id } });
    await prisma.squadJoinRequest.update({ where: { id }, data: { status: 'approved' } });
    await prisma.squadJoinRequest.delete({ where: { id } });
    const player = await prisma.player.findUnique({ where: { id: reqEntry.playerId } });
    res.json({ message: 'Player approved and added to squad', player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rejectJoinRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
    const id = req.params.id as string;
    const reqEntry = await prisma.squadJoinRequest.findUnique({ where: { id } });
    if (!reqEntry) { res.status(404).json({ error: 'Request not found' }); return; }
    const squad = await prisma.squad.findFirst({ where: { managerId: req.user.userId } });
    if (!squad || reqEntry.squadId !== squad.id) { res.status(403).json({ error: 'Not your squad request' }); return; }
    await prisma.squadJoinRequest.delete({ where: { id } });
    res.json({ message: 'Request rejected and removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelJoinRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const id = req.params.id as string;
    const reqEntry = await prisma.squadJoinRequest.findUnique({ where: { id }, include: { player: true } });
    if (!reqEntry) { res.status(404).json({ error: 'Request not found' }); return; }
    const player = await prisma.player.findUnique({ where: { userId: req.user.userId } });
    if (!player || reqEntry.playerId !== player.id) { res.status(403).json({ error: 'Not your request' }); return; }
    await prisma.squadJoinRequest.delete({ where: { id } });
    res.json({ message: 'Request canceled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removePlayerFromSquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
    const playerId = req.params.playerId as string;
    if (!playerId) { res.status(400).json({ error: 'playerId required' }); return; }
    const squad = await getActiveSquadForUser(req.user.userId, req.user.role);
    if (!squad) { res.status(404).json({ error: 'No active squad' }); return; }
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) { res.status(404).json({ error: 'Player not found' }); return; }
    if (player.squadId !== squad.id) { res.status(403).json({ error: 'Player does not belong to your squad' }); return; }

    const updated = await prisma.player.update({ where: { id: playerId }, data: { squadId: null } });
    res.json({ message: 'Player removed from squad', player: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function leaveSquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const player = await prisma.player.findUnique({ where: { userId: req.user.userId } });
    if (!player || !player.squadId) { res.status(400).json({ error: 'Not in any squad' }); return; }
    await prisma.squadJoinRequest.deleteMany({ where: { playerId: player.id, status: 'pending' } });
    const updated = await prisma.player.update({ where: { id: player.id }, data: { squadId: null } });
    res.json({ message: 'Left squad ✓', player: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const joinSchema = z.object({ code: z.string().min(4).max(12) });

export async function joinSquad(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
    const code = parsed.data.code.trim().toUpperCase();
    const squad = await prisma.squad.findUnique({ where: { code } });
    if (!squad) { res.status(404).json({ error: 'Invalid join code' }); return; }

    const player = await prisma.player.findUnique({ where: { userId: req.user.userId } });
    if (!player) { res.status(404).json({ error: 'Create a player profile first (POST /api/players/profile)' }); return; }
    if (player.squadId === squad.id) { res.status(409).json({ error: 'Already in this squad', squad }); return; }
    const existingReq = await prisma.squadJoinRequest.findFirst({ where: { squadId: squad.id, playerId: player.id, status: 'pending' } });
    if (existingReq) { res.status(409).json({ error: 'Already in waiting list for this squad', request: existingReq }); return; }
    const request = await prisma.squadJoinRequest.create({ data: { squadId: squad.id, playerId: player.id, status: 'pending' } });
    res.status(201).json({ message: 'Request sent — awaiting manager approval', squad, request, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function regenerateCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.role !== 'manager') { res.status(403).json({ error: 'Managers only' }); return; }
    const squad = await prisma.squad.findFirst({ where: { managerId: req.user.userId } });
    if (!squad) { res.status(404).json({ error: 'No squad found' }); return; }
    let code = generateCode();
    while (await prisma.squad.findUnique({ where: { code } })) code = generateCode();
    const updated = await prisma.squad.update({ where: { id: squad.id }, data: { code } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
