import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/finance.controller.js';

const router = express.Router();

router.get('/fee-structures', authenticate, controller.getFeeStructures);
router.post('/fee-structures', authenticate, authorize('Administrator', 'Finance Officer'), controller.createFeeStructure);
router.put('/fee-structures/:id', authenticate, authorize('Administrator', 'Finance Officer'), controller.updateFeeStructure);
router.delete('/fee-structures/:id', authenticate, authorize('Administrator'), controller.deleteFeeStructure);
router.get('/payments', authenticate, controller.getPayments);
router.post('/payments', authenticate, authorize('Administrator', 'Finance Officer'), controller.recordPayment);
router.get('/balance/:studentId', authenticate, controller.getStudentBalance);
router.get('/summary', authenticate, authorize('Administrator', 'Finance Officer'), controller.getFinanceSummary);

export default router;
