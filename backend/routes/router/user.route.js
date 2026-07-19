import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, getById, create, update, remove, changeRole, toggleActive, getProfile, updateProfile } from '../../controllers/user.controller.js';

const router = express.Router();
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/', authenticate, isAdmin, getAll);
router.get('/:id', authenticate, isAdmin, getById);
router.post('/', authenticate, isAdmin, create);
router.put('/:id/role', authenticate, isAdmin, changeRole);
router.put('/:id/toggle-active', authenticate, isAdmin, toggleActive);
router.delete('/:id', authenticate, isAdmin, remove);

export default router;
