import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, getById, create, update, remove } from '../../controllers/assessment.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, isAdmin, remove);

export default router;
