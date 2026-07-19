import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/support.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, authorize('Administrator'), controller.update);
router.delete('/:id', authenticate, authorize('Administrator'), controller.remove);

export default router;
