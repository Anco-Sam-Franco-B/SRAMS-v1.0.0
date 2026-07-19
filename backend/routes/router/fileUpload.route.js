import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { uploadAny, handleMulterError } from '../../middleware/upload.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import * as controller from '../../controllers/fileUpload.controller.js';

const router = express.Router();

router.post('/:entityType/:entityId', authenticate, uploadLimiter, uploadAny.single('file'), handleMulterError, controller.upload);
router.get('/:entityType/:entityId', authenticate, controller.getFiles);
router.delete('/:id', authenticate, controller.deleteFile);

export default router;
