import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as controller from '../../controllers/message.controller.js';

const router = express.Router();

router.get('/inbox', authenticate, controller.getInbox);
router.get('/sent', authenticate, controller.getSent);
router.get('/unread-count', authenticate, controller.getUnreadCount);
router.post('/', authenticate, controller.send);
router.put('/:id/read', authenticate, controller.markRead);
router.delete('/:id', authenticate, controller.remove);

export default router;
