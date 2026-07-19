import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAdminStats = async (req, res) => {
  try {
    const [studentsCount, teachersCount, classesCount, subjectsCount, assessmentsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students'),
      pool.query('SELECT COUNT(*) FROM teachers'),
      pool.query('SELECT COUNT(*) FROM classes'),
      pool.query('SELECT COUNT(*) FROM subjects'),
      pool.query('SELECT COUNT(*) FROM assessments')
    ]);

    const [recentStudents, recentTeachers, recentAssessments] = await Promise.all([
      pool.query('SELECT id, first_name, last_name, admission_no FROM students ORDER BY created_at DESC LIMIT 5'),
      pool.query(`SELECT t.id, u.first_name, u.last_name FROM teachers t LEFT JOIN users u ON t.user_id = u.id LIMIT 5`),
      pool.query('SELECT id, title, total_marks FROM assessments LIMIT 5')
    ]);

    res.json({
      data: {
        stats: {
          students: parseInt(studentsCount.rows[0].count),
          teachers: parseInt(teachersCount.rows[0].count),
          classes: parseInt(classesCount.rows[0].count),
          subjects: parseInt(subjectsCount.rows[0].count),
          assessments: parseInt(assessmentsCount.rows[0].count)
        },
        recentActivity: {
          students: recentStudents.rows,
          teachers: recentTeachers.rows,
          assessments: recentAssessments.rows
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const getTeacherStats = async (req, res) => {
  try {
    const teacherResult = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(200).json({ data: { stats: { classes: 0, subjects: 0, students: 0, pendingAttendance: 0 } } });
    }

    const teacher = teacherResult.rows[0];

    const [subjectsCount, studentsCount] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) FROM teacher_subjects WHERE teacher_id = $1',
        [teacher.id]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT s.id) FROM students s
         JOIN teacher_subjects ts ON s.class_id = ts.class_id AND s.trade_id = ts.trade_id
         WHERE ts.teacher_id = $1`,
        [teacher.id]
      )
    ]);

    const pendingResult = await pool.query(
      `SELECT COUNT(DISTINCT ts.class_id) FROM teacher_subjects ts
       WHERE ts.teacher_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM attendance a
         WHERE a.class_id = ts.class_id AND a.attendance_date = CURRENT_DATE
       )`,
      [teacher.id]
    );

    res.json({
      data: {
        stats: {
          classes: parseInt(subjectsCount.rows[0].count),
          subjects: parseInt(subjectsCount.rows[0].count),
          students: parseInt(studentsCount.rows[0].count),
          pendingAttendance: parseInt(pendingResult.rows[0].count)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch teacher stats:', error);
    res.status(500).json({ error: 'Failed to fetch teacher stats' });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    if (!studentId) {
      return res.status(200).json({ data: { stats: { average: 0, attendancePercentage: 0, position: null, totalSubjects: 0 } } });
    }

    const [averageResult, attendanceResult, positionResult, subjectsResult] = await Promise.all([
      pool.query(
        `SELECT AVG(rc.average) as overall_average
         FROM report_cards rc
         WHERE rc.student_id = $1`,
        [studentId]
      ),
      pool.query(
        `SELECT
           COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_count,
           COUNT(*) as total_count
         FROM attendance a
         WHERE a.student_id = $1`,
        [studentId]
      ),
      pool.query(
        `SELECT rc.position
         FROM report_cards rc
         WHERE rc.student_id = $1
         ORDER BY rc.created_at DESC
         LIMIT 1`,
        [studentId]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT sub.id) as total_subjects
         FROM marks m
         JOIN assessments a ON m.assessment_id = a.id
         JOIN subjects sub ON a.subject_id = sub.id
         WHERE m.student_id = $1`,
        [studentId]
      )
    ]);

    const average = averageResult.rows[0].overall_average
      ? Math.round(parseFloat(averageResult.rows[0].overall_average) * 100) / 100
      : 0;

    const presentCount = parseInt(attendanceResult.rows[0].present_count) || 0;
    const totalCount = parseInt(attendanceResult.rows[0].total_count) || 1;
    const attendancePercentage = Math.round((presentCount / totalCount) * 100 * 100) / 100;

    res.json({
      data: {
        stats: {
          average,
          attendancePercentage,
          position: positionResult.rows[0] ? positionResult.rows[0].position : null,
          totalSubjects: parseInt(subjectsResult.rows[0].total_subjects)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch student stats:', error);
    res.status(500).json({ error: 'Failed to fetch student stats' });
  }
};
