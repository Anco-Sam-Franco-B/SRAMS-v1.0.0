import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/examDistribution.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('Administrator', 'Examination Officer'), controller.create);
router.put('/:id', authenticate, authorize('Administrator', 'Examination Officer'), controller.update);
router.delete('/:id', authenticate, authorize('Administrator'), controller.remove);
router.get('/distributions', authenticate, controller.getDistributions);
router.post('/distributions', authenticate, authorize('Administrator', 'Examination Officer'), controller.createDistribution);

export default router;
