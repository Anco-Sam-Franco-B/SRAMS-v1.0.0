import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const { rows } = await pool.query(
            'SELECT n.* FROM notifications n WHERE n.user_id = $1 ORDER BY n.created_at DESC',
            [user_id]
        );
        res.status(200).json({ data: rows });
    } catch (error) {
        logger.error(`Error fetching notifications: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const create = async (req, res) => {
    try {
        const { user_id, trade_id, title, message } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({ error: 'user_id, title, and message are required' });
        }

        const { rows } = await pool.query(
            'INSERT INTO notifications (user_id, trade_id, title, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, trade_id, title, message]
        );
        res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
        logger.error(`Error creating notification: ${error.message}`);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

export const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const { rows } = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({ data: rows[0], message: 'Marked as read' });
    } catch (error) {
        logger.error(`Error marking notification as read: ${error.message}`);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [req.user.id]
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error(`Error marking all notifications as read: ${error.message}`);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM notifications WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        logger.error(`Error deleting notification: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
