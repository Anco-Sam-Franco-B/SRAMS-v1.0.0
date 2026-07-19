import pool from '../config/db.js';
import logger from '../config/logger.js';
import { logAudit } from '../utils/auditLog.js';

// Grade to Division mapping (Rwanda national format)
const GRADE_DIVISION = {
  'A': 'Division 1', 'A-': 'Division 1',
  'B+': 'Division 2', 'B': 'Division 2', 'B-': 'Division 2',
  'C+': 'Division 3', 'C': 'Division 3', 'C-': 'Division 3',
  'D+': 'Division 4', 'D': 'Division 4', 'D-': 'Division 4',
  'E': 'Division 4'
};

// GPA calculation (4.0 scale)
const GRADE_GPA = {
  'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'E': 0.0
};

// ============================================================
// GET ALL REPORT CARDS
// ============================================================
export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT rc.*, s.first_name, s.last_name, s.admission_no,
        c.name as class_name, t.name as term_name, tr.name as trade_name
      FROM report_cards rc
      LEFT JOIN students s ON rc.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN terms t ON rc.term_id = t.id
      LEFT JOIN trade tr ON rc.trade_id = tr.id
    `;
    const conditions = [];
    const values = [];
    let index = 1;

    if (req.query.trade_id) {
      conditions.push(`rc.trade_id = $${index++}`);
      values.push(req.query.trade_id);
    }
    if (req.query.term_id) {
      conditions.push(`rc.term_id = $${index++}`);
      values.push(req.query.term_id);
    }
    if (req.query.student_id) {
      conditions.push(`rc.student_id = $${index++}`);
      values.push(req.query.student_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY rc.position ASC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch report cards:', error);
    res.status(500).json({ error: 'Failed to fetch report cards' });
  }
};

// ============================================================
// GET BY ID — Full report card data
// ============================================================
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const rcResult = await pool.query(
      `SELECT rc.*,
        s.first_name, s.last_name, s.admission_no, s.gender, s.date_of_birth,
        c.name as class_name, t.name as term_name, t.start_date as term_start_date, t.end_date as term_end_date,
        tr.name as trade_name
       FROM report_cards rc
       LEFT JOIN students s ON rc.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN terms t ON rc.term_id = t.id
       LEFT JOIN trade tr ON rc.trade_id = tr.id
       WHERE rc.id = $1`,
      [id]
    );

    if (rcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    const reportCard = rcResult.rows[0];

    // Get marks for this student and term
    const marksResult = await pool.query(
      `SELECT m.*, a.title as assessment_title, a.total_marks,
        sub.name as subject_name, sub.code as subject_code
       FROM marks m
       LEFT JOIN assessments a ON m.assessment_id = a.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       WHERE m.student_id = $1 AND a.term_id = $2`,
      [reportCard.student_id, reportCard.term_id]
    );

    // Get attendance summary
    const attResult = await pool.query(
      `SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'SICK' THEN 1 END) as sick
       FROM attendance
       WHERE student_id = $1 AND term_id = $2`,
      [reportCard.student_id, reportCard.term_id]
    );

    // Get grading system
    const gradingResult = await pool.query('SELECT * FROM grading_system ORDER BY min_mark DESC');

    // Get school profile
    const schoolResult = await pool.query('SELECT * FROM school_profile LIMIT 1');

    // Group marks by subject
    const subjectMarks = {};
    marksResult.rows.forEach(m => {
      const subName = m.subject_name || 'Unknown';
      if (!subjectMarks[subName]) {
        subjectMarks[subName] = { marks: [], total: 0, totalPossible: 0 };
      }
      subjectMarks[subName].marks.push({
        assessment: m.assessment_title,
        score: parseFloat(m.marks),
        total: parseFloat(m.total_marks)
      });
      subjectMarks[subName].total += parseFloat(m.marks);
      subjectMarks[subName].totalPossible += parseFloat(m.total_marks);
    });

    const student = {
      id: reportCard.student_id,
      first_name: reportCard.first_name,
      last_name: reportCard.last_name,
      admission_no: reportCard.admission_no,
      gender: reportCard.gender,
      date_of_birth: reportCard.date_of_birth,
      class_name: reportCard.class_name,
      trade_name: reportCard.trade_name
    };

    const term = {
      id: reportCard.term_id,
      name: reportCard.term_name,
      start_date: reportCard.term_start_date,
      end_date: reportCard.term_end_date
    };

    const gradeEntry = gradingResult.rows.find(
      g => reportCard.average >= g.min_mark && reportCard.average <= g.max_mark
    );

    const attendance = attResult.rows[0];

    res.json({
      data: {
        student,
        term,
        school: schoolResult.rows[0] || {},
        subjectMarks,
        attendance: {
          total: parseInt(attendance.total_days) || 0,
          present: parseInt(attendance.present) || 0,
          absent: parseInt(attendance.absent) || 0,
          late: parseInt(attendance.late) || 0,
          sick: parseInt(attendance.sick) || 0,
          percentage: attendance.total_days > 0
            ? Math.round((parseInt(attendance.present) / parseInt(attendance.total_days)) * 100)
            : 0
        },
        summary: {
          total_marks: reportCard.total_marks,
          average: reportCard.average,
          position: reportCard.position,
          grade: reportCard.grade || (gradeEntry ? gradeEntry.grade : null),
          division: reportCard.division || GRADE_DIVISION[reportCard.grade] || null,
          gpa: reportCard.gpa || null,
          teacher_comment: reportCard.teacher_comment,
          head_teacher_comment: reportCard.head_teacher_comment
        },
        published: reportCard.published
      }
    });
  } catch (error) {
    logger.error('Failed to fetch report card:', error);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
};

// ============================================================
// GENERATE REPORT CARDS (enhanced with auto grade/rank/GPA/division)
// ============================================================
export const generate = async (req, res) => {
  try {
    const { trade_id, term_id } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all students in the trade
      const studentsResult = await client.query(
        `SELECT id, first_name, last_name, class_id FROM students WHERE trade_id = $1 AND is_active = true`,
        [trade_id]
      );

      // Get grading system
      const gradingResult = await client.query('SELECT * FROM grading_system ORDER BY min_mark DESC');

      const studentData = [];

      for (const student of studentsResult.rows) {
        // Get marks grouped by subject
        const marksResult = await client.query(
          `SELECT a.subject_id, SUM(m.marks) as subject_total, SUM(a.total_marks) as subject_possible
           FROM marks m
           LEFT JOIN assessments a ON m.assessment_id = a.id
           WHERE m.student_id = $1 AND a.term_id = $2
           GROUP BY a.subject_id`,
          [student.id, term_id]
        );

        if (marksResult.rows.length === 0) continue;

        let totalMarks = 0;
        let totalPossible = 0;
        const subjectAverages = [];

        for (const sub of marksResult.rows) {
          const subTotal = parseFloat(sub.subject_total) || 0;
          const subPossible = parseFloat(sub.subject_possible) || 1;
          totalMarks += subTotal;
          totalPossible += subPossible;
          subjectAverages.push((subTotal / subPossible) * 100);
        }

        // Average = mean of subject percentages
        const average = subjectAverages.length > 0
          ? subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length
          : 0;

        // Find grade from grading system
        const gradeEntry = gradingResult.rows.find(
          g => average >= g.min_mark && average <= g.max_mark
        );
        const grade = gradeEntry ? gradeEntry.grade : null;

        // GPA
        const gpa = GRADE_GPA[grade] !== undefined ? GRADE_GPA[grade] : null;

        // Division
        const division = GRADE_DIVISION[grade] || null;

        studentData.push({
          student_id: student.id,
          total_marks: Math.round(totalMarks * 100) / 100,
          average: Math.round(average * 100) / 100,
          grade,
          gpa,
          division,
          subjectCount: marksResult.rows.length
        });
      }

      // Sort by average descending
      studentData.sort((a, b) => b.average - a.average);

      // Assign positions
      let position = 1;
      for (let i = 0; i < studentData.length; i++) {
        if (i > 0 && studentData[i].average < studentData[i - 1].average) {
          position = i + 1;
        }
        studentData[i].position = position;
      }

      // Calculate class GPA average
      const gpaValues = studentData.filter(d => d.gpa !== null).map(d => d.gpa);
      const classAvgGPA = gpaValues.length > 0
        ? Math.round((gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length) * 100) / 100
        : null;

      // Delete existing report cards for this trade+term
      await client.query(
        'DELETE FROM report_cards WHERE trade_id = $1 AND term_id = $2',
        [trade_id, term_id]
      );

      // Insert new report cards
      for (const data of studentData) {
        await client.query(
          `INSERT INTO report_cards (student_id, trade_id, term_id, total_marks, average, position, grade, division, gpa)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [data.student_id, trade_id, term_id, data.total_marks, data.average, data.position, data.grade, data.division, data.gpa]
        );
      }

      await client.query('COMMIT');

      await logAudit(req.user?.id, 'REPORT_CARDS_GENERATED', 'trade', trade_id,
        null, { trade_id, term_id, count: studentData.length, classAvgGPA }, req);

      res.status(201).json({
        data: {
          count: studentData.length,
          classAvgGPA,
          topStudent: studentData[0] || null,
          divisionBreakdown: studentData.reduce((acc, d) => {
            acc[d.division || 'N/A'] = (acc[d.division || 'N/A'] || 0) + 1;
            return acc;
          }, {})
        },
        message: 'Report cards generated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Failed to generate report cards:', error);
    res.status(500).json({ error: 'Failed to generate report cards' });
  }
};

// ============================================================
// PUBLISH REPORT CARDS
// ============================================================
export const publish = async (req, res) => {
  const { term_id, trade_id } = req.body;
  try {
    const { rowCount } = await pool.query(
      `UPDATE report_cards SET published = true, published_at = NOW()
       WHERE term_id = $1 AND trade_id = $2 AND published = false`,
      [term_id, trade_id]
    );

    await logAudit(req.user?.id, 'REPORT_CARDS_PUBLISHED', 'trade', trade_id,
      null, { term_id, trade_id, count: rowCount }, req);

    res.json({ message: `${rowCount} report cards published`, count: rowCount });
  } catch (error) {
    logger.error('Failed to publish report cards:', error);
    res.status(500).json({ error: 'Failed to publish report cards' });
  }
};

// ============================================================
// PROMOTION RECOMMENDATION
// ============================================================
export const getPromotionRecommendation = async (req, res) => {
  const { trade_id, term_id } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT rc.*, s.first_name, s.last_name, s.admission_no, s.class_id,
              c.name as class_name
       FROM report_cards rc
       LEFT JOIN students s ON rc.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE rc.trade_id = $1 AND rc.term_id = $2
       ORDER BY rc.average DESC`,
      [trade_id, term_id]
    );

    const recommendations = rows.map(rc => {
      let recommendation = 'Promote';
      if (rc.average < 40) recommendation = 'Repeat';
      else if (rc.average < 50) recommendation = 'Refer';

      return {
        student_id: rc.student_id,
        first_name: rc.first_name,
        last_name: rc.last_name,
        admission_no: rc.admission_no,
        class_name: rc.class_name,
        average: rc.average,
        grade: rc.grade,
        division: rc.division,
        recommendation
      };
    });

    res.json({ data: recommendations });
  } catch (error) {
    logger.error('Failed to get promotion recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// ============================================================
// UPDATE / DELETE
// ============================================================
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_comment, head_teacher_comment } = req.body;
    const { rows } = await pool.query(
      `UPDATE report_cards SET teacher_comment=$1, head_teacher_comment=$2 WHERE id=$3 RETURNING *`,
      [teacher_comment || null, head_teacher_comment || null, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report card not found' });
    }
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update report card:', error);
    res.status(500).json({ error: 'Failed to update report card' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM report_cards WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Report card not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete report card:', error);
    res.status(500).json({ error: 'Failed to delete report card' });
  }
};
