import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT t.*, tr.name as trade_name, u.first_name, u.last_name, u.email, u.is_active 
            FROM teachers t 
            LEFT JOIN trade tr ON t.trade_id = tr.id 
            LEFT JOIN users u ON t.user_id = u.id 
            ORDER BY u.last_name
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        logger.error(`Error fetching teachers: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT t.*, tr.name as trade_name, u.first_name, u.last_name, u.email, u.is_active 
            FROM teachers t 
            LEFT JOIN trade tr ON t.trade_id = tr.id 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        res.status(200).json({ data: rows[0] });
    } catch (error) {
        logger.error(`Error fetching teacher: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch teacher' });
    }
};

export const create = async (req, res) => {
    try {
        const { trade_id, user_id } = req.body;

        if (!trade_id || !user_id) {
            return res.status(400).json({ error: 'trade_id and user_id are required' });
        }

        const { rows } = await pool.query(
            'INSERT INTO teachers (trade_id, user_id) VALUES ($1, $2) RETURNING *',
            [trade_id, user_id]
        );
        res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
        logger.error(`Error creating teacher: ${error.message}`);
        res.status(500).json({ error: 'Failed to create teacher' });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { trade_id } = req.body;

        if (!trade_id) {
            return res.status(400).json({ error: 'trade_id is required' });
        }

        const { rows } = await pool.query(
            'UPDATE teachers SET trade_id = $1 WHERE id = $2 RETURNING *',
            [trade_id, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
        logger.error(`Error updating teacher: ${error.message}`);
        res.status(500).json({ error: 'Failed to update teacher' });
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM teachers WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        logger.error(`Error deleting teacher: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
};

export const getAssignedClasses = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT ts.*, s.name as subject_name, c.name as class_name, tr.name as trade_name 
            FROM teacher_subjects ts 
            LEFT JOIN subjects s ON ts.subject_id = s.id 
            LEFT JOIN classes c ON ts.class_id = c.id 
            LEFT JOIN trade tr ON ts.trade_id = tr.id 
            WHERE ts.teacher_id = $1
        `, [id]);

        res.status(200).json({ data: rows });
    } catch (error) {
        logger.error(`Error fetching assigned classes: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch assigned classes' });
    }
};
