import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAdminStats, getTeacherStats, getStudentStats } from '../../controllers/dashboard.controller.js';

const router = express.Router();
router.get('/admin', authenticate, isAdmin, getAdminStats);
router.get('/teacher', authenticate, getTeacherStats);
router.get('/student', authenticate, getStudentStats);
export default router;