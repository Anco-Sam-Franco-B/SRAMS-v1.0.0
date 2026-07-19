import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import { getAll, create, remove } from '../../controllers/certificate.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.post('/', authenticate, authorize('Administrator', 'Registrar'), create);
router.delete('/:id', authenticate, authorize('Administrator'), remove);
export default router;
