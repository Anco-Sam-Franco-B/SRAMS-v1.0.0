import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ts.*, 
                   t.first_name as teacher_first_name, t.last_name as teacher_last_name,
                   s.name as subject_name, c.name as class_name, tr.name as trade_name
            FROM teacher_subjects ts
            LEFT JOIN teachers te ON ts.teacher_id = te.id
            LEFT JOIN users t ON te.user_id = t.id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            LEFT JOIN classes c ON ts.class_id = c.id
            LEFT JOIN trade tr ON ts.trade_id = tr.id
        `);
        res.json({ data: rows });
    } catch (error) {
        logger.error('Failed to fetch teacher allocations:', error);
        res.status(500).json({ error: 'Failed to fetch teacher allocations' });
    }
};

export const create = async (req, res) => {
    try {
        const { teacher_id, subject_id, class_id, trade_id } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, trade_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [teacher_id, subject_id, class_id, trade_id]
        );
        res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
        logger.error('Failed to create teacher allocation:', error);
        res.status(500).json({ error: 'Failed to create teacher allocation' });
    }
};

export const remove = async (req, res) => {
    try {
        const { teacher_id, subject_id, class_id } = req.params;
        const { rowCount } = await pool.query(
            'DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3',
            [teacher_id, subject_id, class_id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Allocation not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        logger.error('Failed to delete teacher allocation:', error);
        res.status(500).json({ error: 'Failed to delete teacher allocation' });
    }
};
