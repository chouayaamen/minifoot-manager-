import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = (req.url || '').split('?')[0];
  if (url === '/api/health' || url === '/health' || url === '/api' || url.startsWith('/api/health')) {
    return res.status(200).json({ status: 'ok', service: 'minifoot-api', vercel: true, url: req.url });
  }
  try {
    const app = (await import('../src/index')).default;
    return (app as unknown as (r: unknown, s: unknown) => unknown)(req, res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : '';
    console.error('API import failed', msg, stack);
    return res.status(500).json({ error: 'FUNCTION_INIT_FAILED', message: msg, stack: stack?.slice(0, 1200) });
  }
}
