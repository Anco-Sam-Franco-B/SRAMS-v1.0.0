import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import { getProfile, updateProfile } from '../../controllers/schoolProfile.controller.js';

const router = express.Router();
router.get('/', authenticate, getProfile);
router.put('/', authenticate, authorize('Administrator', 'School Administrator'), updateProfile);
export default router;
