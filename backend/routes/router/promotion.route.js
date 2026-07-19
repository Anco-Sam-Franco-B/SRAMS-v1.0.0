import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, promote } from '../../controllers/promotion.controller.js';

const router = express.Router();
router.get('/', authenticate, isAdmin, getAll);
router.post('/promote', authenticate, isAdmin, promote);
export default router;
