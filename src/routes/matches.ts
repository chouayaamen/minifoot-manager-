import { Router } from 'express';
import { listMatches, getMatch, createMatch, updateMatch, deleteMatch } from '../controllers/matchController';
import { getLineup, upsertLineup, addGuest, listGuests, deleteGuest } from '../controllers/lineupController';
import { setRsvp, getRsvps } from '../controllers/rsvpController';
import { setResult, addEvents, listEvents, deleteEvent } from '../controllers/resultController';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.get('/', listMatches);
router.post('/', authenticate, authorize(['manager']), createMatch);
router.get('/:id', getMatch);
router.patch('/:id', authenticate, authorize(['manager']), updateMatch);
router.delete('/:id', authenticate, authorize(['manager']), deleteMatch);

router.get('/:id/lineup', getLineup);
router.post('/:id/lineup', authenticate, authorize(['manager']), upsertLineup);

router.get('/:id/guests', listGuests);
router.post('/:id/guests', authenticate, authorize(['manager']), addGuest);
router.delete('/:id/guests/:guestId', authenticate, authorize(['manager']), deleteGuest);

router.post('/:id/rsvp', authenticate, setRsvp);
router.get('/:id/rsvp', getRsvps);

router.post('/:id/result', authenticate, authorize(['manager']), setResult);
router.post('/:id/events', authenticate, authorize(['manager']), addEvents);
router.get('/:id/events', listEvents);
router.delete('/:id/events/:eventId', authenticate, authorize(['manager']), deleteEvent);

export default router;