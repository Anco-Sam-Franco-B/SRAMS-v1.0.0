import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT a.*, s.name as subject_name, t.name as term_name, tr.name as trade_name
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN terms t ON a.term_id = t.id
      LEFT JOIN trade tr ON a.trade_id = tr.id
    `;
    const conditions = [];
    const values = [];
    let index = 1;

    if (req.query.trade_id) {
      conditions.push(`a.trade_id = $${index++}`);
      values.push(req.query.trade_id);
    }
    if (req.query.subject_id) {
      conditions.push(`a.subject_id = $${index++}`);
      values.push(req.query.subject_id);
    }
    if (req.query.term_id) {
      conditions.push(`a.term_id = $${index++}`);
      values.push(req.query.term_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY a.title`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};

export const getById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, s.name as subject_name, t.name as term_name, tr.name as trade_name
       FROM assessments a
       LEFT JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN terms t ON a.term_id = t.id
       LEFT JOIN trade tr ON a.trade_id = tr.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Failed to fetch assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
};

export const create = async (req, res) => {
  try {
    const { trade_id, teacher_id, subject_id, term_id, title, total_marks } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO assessments (trade_id, teacher_id, subject_id, term_id, title, total_marks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [trade_id, teacher_id, subject_id, term_id, title, total_marks]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

export const update = async (req, res) => {
  try {
    const { trade_id, teacher_id, subject_id, term_id, title, total_marks } = req.body;
    const { rows } = await pool.query(
      `UPDATE assessments
       SET trade_id = $1, teacher_id = $2, subject_id = $3, term_id = $4, title = $5, total_marks = $6
       WHERE id = $7 RETURNING *`,
      [trade_id, teacher_id, subject_id, term_id, title, total_marks, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM assessments WHERE id = $1',
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete assessment:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};
