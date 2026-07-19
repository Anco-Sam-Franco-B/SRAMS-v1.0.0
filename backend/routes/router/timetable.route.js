import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import { getAll, create, update, remove } from '../../controllers/timetable.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.post('/', authenticate, authorize('Administrator', 'Director of Studies'), create);
router.put('/:id', authenticate, authorize('Administrator', 'Director of Studies'), update);
router.delete('/:id', authenticate, authorize('Administrator'), remove);
export default router;
