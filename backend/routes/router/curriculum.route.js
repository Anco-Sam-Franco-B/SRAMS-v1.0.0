import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/curriculum.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('Administrator', 'Director of Studies'), controller.create);
router.put('/:id', authenticate, authorize('Administrator', 'Director of Studies'), controller.update);
router.delete('/:id', authenticate, authorize('Administrator'), controller.remove);
router.get('/materials', authenticate, controller.getMaterials);
router.post('/materials', authenticate, authorize('Administrator', 'Director of Studies'), controller.addMaterial);

export default router;
