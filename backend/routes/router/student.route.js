import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, getById, create, update, remove, changePin, loginWithPin, getStudentDashboard } from '../../controllers/student.controller.js';

const router = express.Router();

// Public PIN login
router.post('/login-pin', loginWithPin);

// Authenticated routes
router.get('/dashboard', authenticate, getStudentDashboard);
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, isAdmin, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, isAdmin, remove);
router.put('/:id/pin', authenticate, changePin);

export default router;
