import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['manager', 'player']).optional().default('player'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function calcRating(heightCm?: number | null, weightKg?: number | null, primaryPos?: string): number | null {
  if (!heightCm || !weightKg) return null;
  if (primaryPos === 'GK') return Math.round((heightCm * 0.6 + weightKg * 0.4) / 2 + 40);
  return Math.min(99, Math.max(40, Math.round(50 + (heightCm - 175) * 0.6 + (weightKg - 75) * 0.4)));
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const { name, email, password, role } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role as any },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const player = await prisma.player.findUnique({ where: { userId: user.id } });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      player: player || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const auth = req as unknown as { user?: { userId: string; email: string; role: string } };
  if (!auth.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}