import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorization.js';
import * as controller from '../../controllers/library.controller.js';

const router = express.Router();

router.get('/books', authenticate, controller.getBooks);
router.post('/books', authenticate, authorize('Administrator', 'Librarian'), controller.createBook);
router.put('/books/:id', authenticate, authorize('Administrator', 'Librarian'), controller.updateBook);
router.delete('/books/:id', authenticate, authorize('Administrator', 'Librarian'), controller.deleteBook);
router.post('/borrow', authenticate, authorize('Administrator', 'Librarian'), controller.borrowBook);
router.post('/return/:id', authenticate, authorize('Administrator', 'Librarian'), controller.returnBook);
router.get('/transactions', authenticate, controller.getTransactions);
router.get('/overdue', authenticate, authorize('Administrator', 'Librarian'), controller.getOverdueBooks);

export default router;
