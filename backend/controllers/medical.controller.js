import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT m.*, s.first_name, s.last_name, s.admission_no,
             u.first_name || ' ' || u.last_name as recorder_name
      FROM medical_records m
      LEFT JOIN students s ON m.student_id = s.id
      LEFT JOIN users u ON m.recorded_by = u.id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (req.query.student_id) { conditions.push(`m.student_id = $${idx++}`); values.push(req.query.student_id); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY m.created_at DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
};

export const create = async (req, res) => {
  try {
    const { student_id, condition_name, diagnosis, treatment, medication, emergency_contact } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO medical_records (student_id, condition_name, diagnosis, treatment, medication, emergency_contact, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [student_id, condition_name, diagnosis, treatment, medication, emergency_contact, req.user?.id]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create medical record:', error);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition_name, diagnosis, treatment, medication, emergency_contact } = req.body;
    const { rows } = await pool.query(
      `UPDATE medical_records SET condition_name=$1, diagnosis=$2, treatment=$3, medication=$4, emergency_contact=$5 WHERE id=$6 RETURNING *`,
      [condition_name, diagnosis, treatment, medication, emergency_contact, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update medical record:', error);
    res.status(500).json({ error: 'Failed to update medical record' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM medical_records WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete medical record:', error);
    res.status(500).json({ error: 'Failed to delete medical record' });
  }
};
