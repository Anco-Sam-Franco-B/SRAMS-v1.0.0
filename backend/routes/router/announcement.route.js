import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/announcement.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('Administrator'), controller.create);
router.put('/:id', authenticate, authorize('Administrator'), controller.update);
router.delete('/:id', authenticate, authorize('Administrator'), controller.remove);
router.post('/:id/publish', authenticate, authorize('Administrator'), controller.publish);

export default router;
