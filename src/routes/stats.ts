import { Router } from 'express';
import { leaderboard } from '../controllers/statsController';

const router = Router();
router.get('/leaderboard', leaderboard);
export default router;