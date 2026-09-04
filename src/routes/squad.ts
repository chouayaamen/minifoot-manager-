import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import {
  getSquadRoster,
  getMySquad,
  createSquad,
  addPlayerToSquad,
  removePlayerFromSquad,
  joinSquad,
  regenerateCode,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
  leaveSquad,
} from '../controllers/squadController';

const router = Router();

router.get('/roster', authenticate, getSquadRoster);
router.get('/me', authenticate, getMySquad);
router.get('/requests', authenticate, getJoinRequests);
router.post('/', authenticate, authorize(['manager']), createSquad);
router.post('/players', authenticate, addPlayerToSquad);
router.post('/requests/:id/accept', authenticate, authorize(['manager']), acceptJoinRequest);
router.post('/requests/:id/reject', authenticate, authorize(['manager']), rejectJoinRequest);
router.post('/requests/:id/cancel', authenticate, cancelJoinRequest);
router.delete('/players/:playerId', authenticate, authorize(['manager']), removePlayerFromSquad);
router.post('/leave', authenticate, leaveSquad);
router.post('/join', authenticate, joinSquad);
router.post('/regenerate-code', authenticate, authorize(['manager']), regenerateCode);

export default router;
