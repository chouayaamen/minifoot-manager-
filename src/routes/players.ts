import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { upsertProfile, getPlayerById, listPlayers, getMyProfile, uploadAvatar } from '../controllers/playerController';
import { authenticate } from '../middleware/authenticate';

const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) cb(new Error('Only images allowed'));
  else cb(null, true);
}});

const router = Router();

router.get('/', listPlayers);
router.get('/profile/me', authenticate, getMyProfile);
router.get('/profile/:id', getPlayerById);
router.post('/profile', authenticate, upsertProfile);
router.put('/profile', authenticate, upsertProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

export default router;