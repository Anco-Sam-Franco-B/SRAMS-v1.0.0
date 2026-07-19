import pool from '../config/db.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

export const getAll = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
                   r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            ORDER BY u.created_at DESC
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        logger.error(`Error fetching users: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
                   r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ data: rows[0] });
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const create = async (req, res) => {
    try {
        const { role_id, first_name, last_name, email, password } = req.body;

        if (!role_id || !first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'role_id, first_name, last_name, email, and password are required' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const { rows } = await pool.query(
            'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, is_active, created_at',
            [role_id, first_name, last_name, email, password_hash]
        );
        res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'first_name, last_name, and email are required' });
        }

        const { rows } = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING id, first_name, last_name, email',
            [first_name, last_name, email, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
        logger.error(`Error updating user: ${error.message}`);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        logger.error(`Error deleting user: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export const changeRole = async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
        return res.status(400).json({ error: 'role_id is required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
            [role_id, id]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const roleResult = await client.query('SELECT name FROM roles WHERE id = $1', [role_id]);

        if (roleResult.rows.length > 0) {
            const roleName = roleResult.rows[0].name;

            if (roleName === 'Teacher') {
                await client.query(
                    'INSERT INTO teachers (user_id) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = $1)',
                    [id]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ data: userResult.rows[0], message: 'Role updated' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Error changing user role: ${error.message}`);
        res.status(500).json({ error: 'Failed to change user role' });
    } finally {
        client.release();
    }
};

export const toggleActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ data: rows[0], message: 'Status toggled' });
    } catch (error) {
        logger.error(`Error toggling user status: ${error.message}`);
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ data: rows[0] });
    } catch (error) {
        logger.error(`Error fetching user profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'first_name, last_name, and email are required' });
        }

        const { rows } = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING id, first_name, last_name, email',
            [first_name, last_name, email, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
        logger.error(`Error updating user profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};
