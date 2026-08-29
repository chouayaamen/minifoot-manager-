import { Express, Request, Response, NextFunction } from 'express';

export default function errorHandler(app: Express): void {
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });
}