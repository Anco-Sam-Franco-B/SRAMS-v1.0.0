import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin, authorize } from '../../middleware/authorization.js';
import {
  getAll, getById, generate, update, remove, publish, getPromotionRecommendation
} from '../../controllers/reportCard.controller.js';

const router = express.Router();

router.get('/', authenticate, getAll);
router.post('/generate', authenticate, isAdmin, generate);
router.post('/publish', authenticate,
  authorize('Administrator', 'Head Teacher', 'School Administrator'),
  publish
);
router.get('/promotion-recommendation', authenticate, isAdmin, getPromotionRecommendation);
router.get('/:id', authenticate, getById);
router.put('/:id', authenticate, isAdmin, update);
router.delete('/:id', authenticate, isAdmin, remove);

export default router;
