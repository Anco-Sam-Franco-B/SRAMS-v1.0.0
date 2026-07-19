import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as controller from '../../controllers/analytics.controller.js';

const router = express.Router();

router.get('/performance', authenticate, controller.getPerformance);
router.get('/attendance-trends', authenticate, controller.getAttendanceTrends);
router.get('/subject-analysis', authenticate, controller.getSubjectAnalysis);
router.get('/teacher-performance', authenticate, controller.getTeacherPerformance);

export default router;
