import app from '../src/index';
import { ensureDb } from '../src/utils/db';

let ready: Promise<void> | null = null;
async function getApp() {
  if (!ready) ready = ensureDb().catch(() => {});
  await ready;
  return app;
}

export default async function handler(req: unknown, res: unknown) {
  const a = await getApp();
  return (a as unknown as (r: unknown, s: unknown) => unknown)(req, res);
}
