import path from 'path';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'tiny' : 'combined'));

app.use('/api', routes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'minifoot-backend' });
});

const frontendDist = path.resolve(__dirname, '../frontend/dist');
const publicDir = path.resolve(__dirname, '../public');
const frontendDistAlt = path.resolve(process.cwd(), 'frontend/dist');
const publicDirAlt = path.resolve(process.cwd(), 'public');
function resolveIndex(): string | null {
  const fs = require('fs');
  for (const d of [frontendDist, frontendDistAlt, publicDir, publicDirAlt]) {
    const p = path.join(d, 'index.html');
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function tryStatic(dir: string): void {
  const fs = require('fs');
  if (fs.existsSync(dir)) app.use(express.static(dir));
}
tryStatic(frontendDist);
tryStatic(frontendDistAlt);
tryStatic(publicDir);
tryStatic(publicDirAlt);
app.get('/', (_req: Request, res: Response, next) => {
  const p = resolveIndex();
  if (p) return res.sendFile(p);
  next();
});
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  if (req.method !== 'GET') return next();
  const p = resolveIndex();
  if (p) return res.sendFile(p);
  next();
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

errorHandler(app);

const PORT = env.PORT;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Min-Foot backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
  });
}

export default app;
export { app };