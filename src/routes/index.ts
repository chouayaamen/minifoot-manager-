import { Router } from 'express';
import authRoutes from './auth';
import playerRoutes from './players';
import matchRoutes from './matches';
import statsRoutes from './stats';
import commentRoutes from './comments';
import friendRoutes from './friends';
import inviteRoutes from './invites';
import squadRoutes from './squad';
import matchDayRoutes from './matchDay';

const router = Router();

router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/stats', statsRoutes);
router.use('/comments', commentRoutes);
router.use('/friends', friendRoutes);
router.use('/invites', inviteRoutes);
router.use('/squad', squadRoutes);
router.use('/matchday', matchDayRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'minifoot-api' });
});

export default router;