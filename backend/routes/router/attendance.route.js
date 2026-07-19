import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getAll, markAttendance, getAttendanceByClass, getStudentAttendance, getAttendanceReport } from '../../controllers/attendance.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.post('/mark', authenticate, markAttendance);
router.get('/class/:classId', authenticate, getAttendanceByClass);
router.get('/student/:id', authenticate, getStudentAttendance);
router.get('/report', authenticate, getAttendanceReport);

export default router;
