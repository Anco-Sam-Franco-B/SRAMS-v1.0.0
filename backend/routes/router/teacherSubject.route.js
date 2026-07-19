import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, create, remove } from '../../controllers/teacherSubject.controller.js';

const router = express.Router();
router.get('/', authenticate, isAdmin, getAll);
router.post('/', authenticate, isAdmin, create);
router.delete('/:teacher_id/:subject_id/:class_id', authenticate, isAdmin, remove);
export default router;
