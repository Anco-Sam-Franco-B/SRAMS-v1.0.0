import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { teacher_id, academic_year_id, term_id } = req.query;
    let query = `
      SELECT tp.*, t.employee_no, u.first_name, u.last_name
      FROM teacher_performance tp
      LEFT JOIN teachers t ON tp.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (teacher_id) { params.push(teacher_id); query += ` AND tp.teacher_id = $${params.length}`; }
    if (academic_year_id) { params.push(academic_year_id); query += ` AND tp.academic_year_id = $${params.length}`; }
    if (term_id) { params.push(term_id); query += ` AND tp.term_id = $${params.length}`; }
    query += ' ORDER BY tp.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching teacher performance', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch teacher performance' });
  }
};

export const create = async (req, res) => {
  try {
    const { teacher_id, academic_year_id, term_id, avg_student_marks, attendance_rate, completion_rate, rating } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO teacher_performance (teacher_id, academic_year_id, term_id, avg_student_marks,
       attendance_rate, completion_rate, rating, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [teacher_id, academic_year_id, term_id, avg_student_marks, attendance_rate, completion_rate, rating, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating teacher performance', { error: error.message });
    res.status(500).json({ error: 'Failed to create teacher performance' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { avg_student_marks, attendance_rate, completion_rate, rating } = req.body;
    const { rows } = await pool.query(
      `UPDATE teacher_performance SET avg_student_marks = COALESCE($1, avg_student_marks),
       attendance_rate = COALESCE($2, attendance_rate), completion_rate = COALESCE($3, completion_rate),
       rating = COALESCE($4, rating) WHERE id = $5 RETURNING *`,
      [avg_student_marks, attendance_rate, completion_rate, rating, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Performance record not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating teacher performance', { error: error.message });
    res.status(500).json({ error: 'Failed to update teacher performance' });
  }
};
