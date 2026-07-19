import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getPerformance = async (req, res) => {
  try {
    const { term_id } = req.query;
    let query = `
      SELECT sub.name as subject_name, sub.code as subject_code,
        ROUND(AVG(m.marks), 2) as average,
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE m.marks >= 50) as pass_count,
        ROUND(COUNT(*) FILTER (WHERE m.marks >= 50)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as pass_rate
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
    `;
    const params = [];
    if (term_id) { params.push(term_id); query += ` WHERE a.term_id = $${params.length}`; }
    query += ' GROUP BY sub.id, sub.name, sub.code ORDER BY sub.name';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching performance analytics', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
};

export const getAttendanceTrends = async (req, res) => {
  try {
    const { term_id } = req.query;
    let query = `
      SELECT
        TO_CHAR(attendance_date, 'YYYY-MM-DD') as date,
        COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
        COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
        COUNT(*) FILTER (WHERE status = 'LATE') as late,
        COUNT(*) as total
      FROM attendance
    `;
    const params = [];
    if (term_id) {
      params.push(term_id);
      query += ` WHERE term_id = $${params.length}`;
    }
    query += ' GROUP BY TO_CHAR(attendance_date, \'YYYY-MM-DD\') ORDER BY date';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching attendance trends', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch attendance trends' });
  }
};

export const getSubjectAnalysis = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT sub.name as subject_name,
        sub.code as subject_code,
        ROUND(AVG(m.marks), 2) as avg_marks,
        MIN(m.marks) as min_marks,
        MAX(m.marks) as max_marks,
        COUNT(DISTINCT m.student_id) as student_count,
        COUNT(DISTINCT a.teacher_id) as teacher_count
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY avg_marks DESC
    `);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching subject analysis', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch subject analysis' });
  }
};

export const getTeacherPerformance = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.first_name || ' ' || u.last_name as teacher_name,
        t.employee_no,
        tr.name as trade_name,
        ROUND(AVG(m.marks), 2) as avg_student_marks,
        COUNT(DISTINCT ts.subject_id) as subjects_taught,
        COUNT(DISTINCT ts.class_id) as classes_taught
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN trade tr ON t.trade_id = tr.id
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN assessments a ON a.teacher_id = t.id
      LEFT JOIN marks m ON m.assessment_id = a.id
      GROUP BY u.first_name, u.last_name, t.employee_no, tr.name
      ORDER BY avg_student_marks DESC NULLS LAST
    `);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching teacher performance', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch teacher performance' });
  }
};
