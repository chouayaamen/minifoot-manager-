import { Router } from 'express';
import { listComments, createComment, replyComment, deleteComment } from '../controllers/commentController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.get('/', listComments);
router.post('/', authenticate, createComment);
router.post('/:id/reply', authenticate, replyComment);
router.delete('/:id', authenticate, deleteComment);
export default router;