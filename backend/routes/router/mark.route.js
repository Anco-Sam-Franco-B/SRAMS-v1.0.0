import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import {
  getAll, enterMarks, getMarksByAssessment, getStudentMarks,
  submitMarks, verifyMarks, approveMarksDoS, approveMarksHead,
  lockMarks, unlockMarks, getWorkflowStatus
} from '../../controllers/mark.controller.js';

const router = express.Router();

// Standard CRUD
router.get('/', authenticate, getAll);
router.post('/enter', authenticate, enterMarks);
router.get('/assessment/:id', authenticate, getMarksByAssessment);
router.get('/student/:id', authenticate, getStudentMarks);

// Workflow — submit (Teacher)
router.post('/submit', authenticate, submitMarks);

// Workflow — verify (Class Teacher, Director of Studies, Admin)
router.post('/verify', authenticate,
  authorize('Administrator', 'Director of Studies', 'Class Teacher'),
  verifyMarks
);

// Workflow — approve DoS (Director of Studies, Admin)
router.post('/approve-dos', authenticate,
  authorize('Administrator', 'Director of Studies', 'School Administrator'),
  approveMarksDoS
);

// Workflow — approve Head Teacher (Head Teacher, Admin)
router.post('/approve-head', authenticate,
  authorize('Administrator', 'Head Teacher', 'School Administrator'),
  approveMarksHead
);

// Workflow — lock (Head Teacher, Admin)
router.post('/lock', authenticate,
  authorize('Administrator', 'Head Teacher', 'School Administrator'),
  lockMarks
);

// Workflow — unlock (Admin only)
router.post('/unlock', authenticate,
  authorize('Administrator'),
  unlockMarks
);

// Workflow status
router.get('/workflow/:assessmentId', authenticate, getWorkflowStatus);

export default router;
