import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import { getAll, create, update, remove } from '../../controllers/discipline.controller.js';

const router = express.Router();
router.get('/', authenticate, getAll);
router.post('/', authenticate, authorize('Administrator', 'Discipline Officer', 'Class Teacher'), create);
router.put('/:id', authenticate, authorize('Administrator', 'Discipline Officer'), update);
router.delete('/:id', authenticate, authorize('Administrator'), remove);
export default router;
