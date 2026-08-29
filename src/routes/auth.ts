import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// POST /api/auth/register - Manager or Player user creation
router.post('/register', registerUser);

// POST /api/auth/login - User authentication
router.post('/login', loginUser);

router.get('/me', authenticate, getMe);

export default router;