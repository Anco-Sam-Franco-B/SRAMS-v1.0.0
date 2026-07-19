import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT sp.*, s.first_name, s.last_name, s.admission_no,
        fc.name as from_class_name, tc.name as to_class_name,
        ay.name as academic_year_name
      FROM student_promotions sp
      LEFT JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes fc ON sp.from_class = fc.id
      LEFT JOIN classes tc ON sp.to_class = tc.id
      LEFT JOIN academic_years ay ON sp.academic_year_id = ay.id
    `;
    const conditions = [];
    const values = [];
    let index = 1;

    if (req.query.trade_id) {
      conditions.push(`sp.trade_id = $${index++}`);
      values.push(req.query.trade_id);
    }
    if (req.query.academic_year_id) {
      conditions.push(`sp.academic_year_id = $${index++}`);
      values.push(req.query.academic_year_id);
    }
    if (req.query.status) {
      conditions.push(`sp.status = $${index++}`);
      values.push(req.query.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sp.created_at DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
};

export const promote = async (req, res) => {
  try {
    const { promotions } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];

      for (const promo of promotions) {
        const { student_id, from_class, to_class, academic_year_id, trade_id, status } = promo;

        const { rows } = await client.query(
          `INSERT INTO student_promotions (student_id, from_class, to_class, academic_year_id, trade_id, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [student_id, from_class, to_class, academic_year_id, trade_id, status]
        );

        await client.query(
          `UPDATE students SET class_id = $1 WHERE id = $2`,
          [to_class, student_id]
        );

        results.push(rows[0]);
      }

      await client.query('COMMIT');

      res.status(201).json({ data: results, message: 'Students promoted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Failed to promote students:', error);
    res.status(500).json({ error: 'Failed to promote students' });
  }
};
