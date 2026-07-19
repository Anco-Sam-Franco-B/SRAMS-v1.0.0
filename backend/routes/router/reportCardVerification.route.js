import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/reportCardVerification.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/:id/verify', authenticate, authorize('Administrator', 'Head Teacher'), controller.verify);
router.post('/:id/reject', authenticate, authorize('Administrator', 'Head Teacher'), controller.reject);

export default router;
