import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/imihigo.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('Administrator', 'Head Teacher'), controller.create);
router.put('/:id', authenticate, authorize('Administrator', 'Head Teacher'), controller.update);
router.delete('/:id', authenticate, authorize('Administrator'), controller.remove);
router.get('/videos', authenticate, controller.getVideos);
router.post('/videos', authenticate, authorize('Administrator', 'Head Teacher'), controller.addVideo);

export default router;
