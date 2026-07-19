import pool from '../config/db.js';
import logger from '../config/logger.js';

const generateCertNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CERT-${year}-${rand}`;
};

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT c.*, s.first_name, s.last_name, s.admission_no
      FROM certificates c LEFT JOIN students s ON c.student_id = s.id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (req.query.student_id) { conditions.push(`c.student_id = $${idx++}`); values.push(req.query.student_id); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY c.issued_date DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

export const create = async (req, res) => {
  try {
    const { student_id, certificate_type, issued_date } = req.body;
    const certificate_number = generateCertNumber();
    const { rows } = await pool.query(
      `INSERT INTO certificates (student_id, certificate_type, certificate_number, issued_date, issued_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, certificate_type, certificate_number, issued_date, req.user?.id]
    );
    res.status(201).json({ data: rows[0], message: 'Certificate created' });
  } catch (error) {
    logger.error('Failed to create certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM certificates WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
};
