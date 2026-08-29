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

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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