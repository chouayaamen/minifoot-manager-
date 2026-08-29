import { Router } from 'express';
import { sendFriendRequest, listFriends, acceptFriend, declineFriend, listUsers, removeFriend, cancelRequest } from '../controllers/friendController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.get('/', authenticate, listFriends);
router.get('/users', authenticate, listUsers);
router.post('/request', authenticate, sendFriendRequest);
router.post('/:id/accept', authenticate, acceptFriend);
router.post('/:id/decline', authenticate, declineFriend);
router.delete('/:id', authenticate, removeFriend);
router.post('/:id/cancel', authenticate, cancelRequest);
export default router;