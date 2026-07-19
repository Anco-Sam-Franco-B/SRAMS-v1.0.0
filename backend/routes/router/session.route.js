import express from 'express';
import { listSessions, revokeSession, revokeAllSessions } from '../../controllers/session.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listSessions);
router.delete('/:id', authenticate, revokeSession);
router.delete('/', authenticate, revokeAllSessions);

export default router;
