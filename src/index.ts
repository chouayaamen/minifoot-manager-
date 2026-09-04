import path from 'path';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.NODE_ENV === 'development' ? '*' : 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

app.use('/api', routes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'minifoot-backend' });
});

const frontendDist = path.join(__dirname, '../frontend/dist');
const publicDir = path.join(__dirname, '../public');
app.use(express.static(frontendDist));
app.use(express.static(publicDir));
app.get('/', (_req: Request, res: Response) => {
  const p = require('fs').existsSync(path.join(frontendDist, 'index.html')) ? path.join(frontendDist, 'index.html') : path.join(publicDir, 'index.html');
  res.sendFile(p);
});
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  if (req.method !== 'GET') return next();
  const fs = require('fs');
  const idx = path.join(frontendDist, 'index.html');
  if (fs.existsSync(idx)) return res.sendFile(idx);
  if (fs.existsSync(path.join(publicDir, 'index.html'))) return res.sendFile(path.join(publicDir, 'index.html'));
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