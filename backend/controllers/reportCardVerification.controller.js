import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { status, report_card_id } = req.query;
    let query = `
      SELECT rcv.*, rc.student_id, rc.average, rc.position, rc.grade,
        s.first_name, s.last_name, s.admission_no
      FROM report_card_verifications rcv
      LEFT JOIN report_cards rc ON rcv.report_card_id = rc.id
      LEFT JOIN students s ON rc.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND rcv.status = $${params.length}`; }
    if (report_card_id) { params.push(report_card_id); query += ` AND rcv.report_card_id = $${params.length}`; }
    query += ' ORDER BY rcv.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching verifications', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
};

export const verify = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { rows } = await pool.query(
      `UPDATE report_card_verifications SET status = 'verified', verified_by = $1,
       verified_at = CURRENT_TIMESTAMP, comments = $2 WHERE id = $3 RETURNING *`,
      [req.user.id, comments, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Verification not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error verifying report card', { error: error.message });
    res.status(500).json({ error: 'Failed to verify' });
  }
};

export const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { rows } = await pool.query(
      `UPDATE report_card_verifications SET status = 'rejected', verified_by = $1,
       verified_at = CURRENT_TIMESTAMP, comments = $2 WHERE id = $3 RETURNING *`,
      [req.user.id, comments, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Verification not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error rejecting report card', { error: error.message });
    res.status(500).json({ error: 'Failed to reject' });
  }
};
