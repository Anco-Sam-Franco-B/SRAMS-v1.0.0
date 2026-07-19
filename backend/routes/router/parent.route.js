import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/parent.controller.js';

const router = express.Router();

router.get('/', authenticate, authorize('Administrator'), controller.getAll);
router.get('/children', authenticate, controller.getChildren);
router.get('/children/:studentId/marks', authenticate, controller.getChildMarks);
router.get('/children/:studentId/attendance', authenticate, controller.getChildAttendance);
router.post('/link', authenticate, authorize('Administrator'), controller.linkStudent);

export default router;
