import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ps.*, u.first_name, u.last_name, u.email,
        json_agg(json_build_object('student_id', s.id, 'first_name', s.first_name, 'last_name', s.last_name, 'admission_no', s.admission_no)) as children
      FROM parent_students ps
      JOIN users u ON ps.parent_user_id = u.id
      LEFT JOIN students s ON ps.student_id = s.id
      GROUP BY ps.id, u.first_name, u.last_name, u.email
      ORDER BY u.last_name
    `);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching parents', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
};

export const getChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { rows } = await pool.query(`
      SELECT s.*, c.name as class_name, t.name as trade_name,
        ts.name as term_name
      FROM parent_students ps
      JOIN students s ON ps.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN trade t ON s.trade_id = t.id
      LEFT JOIN terms ts ON ts.is_current = true
      WHERE ps.parent_user_id = $1
    `, [parentId]);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching children', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch children' });
  }
};

export const getChildMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term_id } = req.query;
    let query = `
      SELECT m.*, a.title as assessment_title, a.total_marks,
        sub.name as subject_name, sub.code as subject_code
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE m.student_id = $1
    `;
    const params = [studentId];
    if (term_id) {
      query += ' AND a.term_id = $2';
      params.push(term_id);
    }
    query += ' ORDER BY a.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching child marks', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};

export const getChildAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date_from, date_to } = req.query;
    let query = 'SELECT * FROM attendance WHERE student_id = $1';
    const params = [studentId];
    if (date_from) {
      params.push(date_from);
      query += ` AND attendance_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND attendance_date <= $${params.length}`;
    }
    query += ' ORDER BY attendance_date DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching child attendance', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const linkStudent = async (req, res) => {
  try {
    const { parent_user_id, student_id, relationship, is_primary } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO parent_students (parent_user_id, student_id, relationship, is_primary)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [parent_user_id, student_id, relationship || 'guardian', is_primary || false]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error linking student', { error: error.message });
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Already linked' });
    }
    res.status(500).json({ error: 'Failed to link student' });
  }
};
