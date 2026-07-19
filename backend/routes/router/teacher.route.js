import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/authorization.js';
import { getAll, getById, create, update, remove, getAssignedClasses } from '../../controllers/teacher.controller.js';

const router = express.Router();

// Teacher can read own profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const pool = (await import('../../config/db.js')).default;
        const { rows } = await pool.query(
            `SELECT t.*, tr.name as trade_name, u.first_name, u.last_name, u.email, u.is_active
             FROM teachers t
             LEFT JOIN trade tr ON t.trade_id = tr.id
             LEFT JOIN users u ON t.user_id = u.id
             WHERE t.user_id = $1`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
        res.json({ data: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

router.get('/', authenticate, isAdmin, getAll);
router.get('/:id/assignments', authenticate, getAssignedClasses);
router.get('/:id', authenticate, isAdmin, getById);
router.post('/', authenticate, isAdmin, create);
router.put('/:id', authenticate, isAdmin, update);
router.delete('/:id', authenticate, isAdmin, remove);

export default router;
