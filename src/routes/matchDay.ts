import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { getMatchDay, upsertMatchDay } from '../controllers/matchDayController';

const router = Router();
router.get('/', authenticate, getMatchDay);
router.post('/', authenticate, authorize(['manager']), upsertMatchDay);
router.put('/', authenticate, authorize(['manager']), upsertMatchDay);
export default router;
