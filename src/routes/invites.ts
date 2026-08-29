import { Router } from 'express';
import { createInvite, myInvites, inviteStatus, acceptInvite, declineInvite, managerInvites } from '../controllers/inviteController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.get('/me', authenticate, myInvites);
router.get('/status', authenticate, inviteStatus);
router.get('/manager', authenticate, managerInvites);
router.post('/', authenticate, createInvite);
router.post('/:id/accept', authenticate, acceptInvite);
router.post('/:id/decline', authenticate, declineInvite);
export default router;