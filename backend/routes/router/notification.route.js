import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, create, markRead, markAllRead, remove } from '../../controllers/notification.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.post('/send', authenticate, isAdmin, create);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, remove);
export default router;