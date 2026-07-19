import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT d.*, s.first_name, s.last_name, s.admission_no,
             u.first_name || ' ' || u.last_name as reporter_name
      FROM discipline_records d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN users u ON d.reported_by = u.id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (req.query.student_id) { conditions.push(`d.student_id = $${idx++}`); values.push(req.query.student_id); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY d.incident_date DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch discipline records:', error);
    res.status(500).json({ error: 'Failed to fetch discipline records' });
  }
};

export const create = async (req, res) => {
  try {
    const { student_id, incident_date, incident_type, description, action_taken, parent_notified } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO discipline_records (student_id, incident_date, incident_type, description, action_taken, reported_by, parent_notified)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [student_id, incident_date, incident_type, description, action_taken, req.user?.id, parent_notified || false]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create discipline record:', error);
    res.status(500).json({ error: 'Failed to create discipline record' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { incident_date, incident_type, description, action_taken, parent_notified } = req.body;
    const { rows } = await pool.query(
      `UPDATE discipline_records SET incident_date=$1, incident_type=$2, description=$3, action_taken=$4, parent_notified=$5 WHERE id=$6 RETURNING *`,
      [incident_date, incident_type, description, action_taken, parent_notified, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update discipline record:', error);
    res.status(500).json({ error: 'Failed to update discipline record' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM discipline_records WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete discipline record:', error);
    res.status(500).json({ error: 'Failed to delete discipline record' });
  }
};
