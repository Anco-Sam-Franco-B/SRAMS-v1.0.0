import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/teacherPerformance.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('Administrator', 'Head Teacher', 'Director of Studies'), controller.create);
router.put('/:id', authenticate, authorize('Administrator', 'Head Teacher', 'Director of Studies'), controller.update);

export default router;
