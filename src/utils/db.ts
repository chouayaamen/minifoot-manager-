import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

if (process.env.VERCEL) {
  try {
    const d = '/tmp';
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    const up = '/tmp/uploads';
    if (!fs.existsSync(up)) fs.mkdirSync(up, { recursive: true });
  } catch {}
}

const g = globalThis as unknown as { __prisma?: PrismaClient };
export const prisma = g.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.__prisma = prisma;

let init: Promise<void> | null = null;
export async function ensureDb(): Promise<void> {
  if (init) return init;
  init = (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {}
    try {
      await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('no such table') || msg.includes('does not exist')) {
        const { execSync } = await import('child_process');
        try {
          execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'ignore', timeout: 15000 });
        } catch {}
      }
    }
  })();
  return init;
}

export default prisma;