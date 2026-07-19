import pool from '../config/db.js';
import logger from '../config/logger.js';
import { logAudit } from '../utils/auditLog.js';

// ============================================================
// GET ALL MARKS
// ============================================================
export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT m.*, s.first_name, s.last_name, s.admission_no,
             a.title as assessment_title, a.total_marks
      FROM marks m
      LEFT JOIN students s ON m.student_id = s.id
      LEFT JOIN assessments a ON m.assessment_id = a.id
    `;
    const conditions = [];
    const values = [];
    let index = 1;

    if (req.query.assessment_id) {
      conditions.push(`m.assessment_id = $${index++}`);
      values.push(req.query.assessment_id);
    }
    if (req.query.student_id) {
      conditions.push(`m.student_id = $${index++}`);
      values.push(req.query.student_id);
    }
    if (req.query.trade_id) {
      conditions.push(`m.trade_id = $${index++}`);
      values.push(req.query.trade_id);
    }
    if (req.query.status) {
      conditions.push(`m.status = $${index++}`);
      values.push(req.query.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY s.last_name`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch marks:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};

// ============================================================
// ENTER MARKS (bulk upsert)
// ============================================================
export const enterMarks = async (req, res) => {
  const client = await pool.connect();
  try {
    const { marks } = req.body;
    let count = 0;

    await client.query('BEGIN');

    for (const mark of marks) {
      const { student_id, assessment_id, marks: markValue, trade_id, teacher_id } = mark;
      const { rowCount } = await client.query(
        `INSERT INTO marks (student_id, assessment_id, marks, trade_id, teacher_id, status, submitted_by, submitted_at)
         VALUES ($1, $2, $3, $4, $5, 'draft', $6, NOW())
         ON CONFLICT (assessment_id, student_id)
         DO UPDATE SET marks = EXCLUDED.marks, trade_id = EXCLUDED.trade_id, teacher_id = EXCLUDED.teacher_id,
                      status = 'draft', submitted_by = $6, submitted_at = NOW()`,
        [student_id, assessment_id, markValue, trade_id, teacher_id, req.user?.id || null]
      );
      count += rowCount;
    }

    await client.query('COMMIT');
    res.status(201).json({ data: { count }, message: 'Marks entered successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to enter marks:', error);
    res.status(500).json({ error: 'Failed to enter marks' });
  } finally {
    client.release();
  }
};

// ============================================================
// GET MARKS BY ASSESSMENT
// ============================================================
export const getMarksByAssessment = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, s.first_name, s.last_name, s.admission_no
       FROM marks m
       LEFT JOIN students s ON m.student_id = s.id
       WHERE m.assessment_id = $1
       ORDER BY s.last_name`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch marks by assessment:', error);
    res.status(500).json({ error: 'Failed to fetch marks by assessment' });
  }
};

// ============================================================
// GET STUDENT MARKS
// ============================================================
export const getStudentMarks = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, a.title as assessment_title, a.total_marks, sub.name as subject_name
       FROM marks m
       LEFT JOIN assessments a ON m.assessment_id = a.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       WHERE m.student_id = $1
       ORDER BY sub.name, a.title`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch student marks:', error);
    res.status(500).json({ error: 'Failed to fetch student marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — SUBMIT (Teacher)
// ============================================================
export const submitMarks = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    // Get all draft marks for this assessment
    const { rows: marks } = await pool.query(
      'SELECT id, status FROM marks WHERE assessment_id = $1',
      [assessment_id]
    );

    const draftMarks = marks.filter(m => m.status === 'draft');
    if (draftMarks.length === 0) {
      return res.status(400).json({ error: 'No draft marks found for this assessment' });
    }

    // Update all draft marks to submitted
    await pool.query(
      `UPDATE marks SET status = 'submitted', submitted_by = $1, submitted_at = NOW()
       WHERE assessment_id = $2 AND status = 'draft'`,
      [req.user.id, assessment_id]
    );

    await logAudit(req.user.id, 'MARKS_SUBMITTED', 'assessment', assessment_id,
      { count: draftMarks.length }, { assessment_id }, req);

    res.json({ message: `${draftMarks.length} marks submitted for verification` });
  } catch (error) {
    logger.error('Failed to submit marks:', error);
    res.status(500).json({ error: 'Failed to submit marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — VERIFY (Class Teacher / Director of Studies)
// ============================================================
export const verifyMarks = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    const { rows: marks } = await pool.query(
      'SELECT id, status FROM marks WHERE assessment_id = $1',
      [assessment_id]
    );

    const submittedMarks = marks.filter(m => m.status === 'submitted');
    if (submittedMarks.length === 0) {
      return res.status(400).json({ error: 'No submitted marks found for this assessment' });
    }

    await pool.query(
      `UPDATE marks SET status = 'verified', verified_by = $1, verified_at = NOW()
       WHERE assessment_id = $2 AND status = 'submitted'`,
      [req.user.id, assessment_id]
    );

    await logAudit(req.user.id, 'MARKS_VERIFIED', 'assessment', assessment_id,
      { count: submittedMarks.length }, { assessment_id }, req);

    res.json({ message: `${submittedMarks.length} marks verified` });
  } catch (error) {
    logger.error('Failed to verify marks:', error);
    res.status(500).json({ error: 'Failed to verify marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — APPROVE DoS (Director of Studies / Admin)
// ============================================================
export const approveMarksDoS = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    const { rows: marks } = await pool.query(
      'SELECT id, status FROM marks WHERE assessment_id = $1',
      [assessment_id]
    );

    const verifiedMarks = marks.filter(m => m.status === 'verified');
    if (verifiedMarks.length === 0) {
      return res.status(400).json({ error: 'No verified marks found for this assessment' });
    }

    await pool.query(
      `UPDATE marks SET status = 'dos_approved', approved_by = $1, approved_at = NOW()
       WHERE assessment_id = $2 AND status = 'verified'`,
      [req.user.id, assessment_id]
    );

    await logAudit(req.user.id, 'MARKS_APPROVED_DOS', 'assessment', assessment_id,
      { count: verifiedMarks.length }, { assessment_id }, req);

    res.json({ message: `${verifiedMarks.length} marks approved by Director of Studies` });
  } catch (error) {
    logger.error('Failed to approve marks (DoS):', error);
    res.status(500).json({ error: 'Failed to approve marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — APPROVE Head Teacher
// ============================================================
export const approveMarksHead = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    const { rows: marks } = await pool.query(
      'SELECT id, status FROM marks WHERE assessment_id = $1',
      [assessment_id]
    );

    const dosApprovedMarks = marks.filter(m => m.status === 'dos_approved');
    if (dosApprovedMarks.length === 0) {
      return res.status(400).json({ error: 'No DoS-approved marks found for this assessment' });
    }

    await pool.query(
      `UPDATE marks SET status = 'head_approved', head_approved_by = $1, head_approved_at = NOW()
       WHERE assessment_id = $2 AND status = 'dos_approved'`,
      [req.user.id, assessment_id]
    );

    await logAudit(req.user.id, 'MARKS_APPROVED_HEAD', 'assessment', assessment_id,
      { count: dosApprovedMarks.length }, { assessment_id }, req);

    res.json({ message: `${dosApprovedMarks.length} marks approved by Head Teacher` });
  } catch (error) {
    logger.error('Failed to approve marks (Head):', error);
    res.status(500).json({ error: 'Failed to approve marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — LOCK (Head Teacher / Admin)
// ============================================================
export const lockMarks = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    const { rows: marks } = await pool.query(
      'SELECT id, status FROM marks WHERE assessment_id = $1',
      [assessment_id]
    );

    const headApprovedMarks = marks.filter(m => m.status === 'head_approved');
    if (headApprovedMarks.length === 0) {
      return res.status(400).json({ error: 'No Head-Teacher-approved marks found for this assessment' });
    }

    await pool.query(
      `UPDATE marks SET status = 'locked', is_locked = true
       WHERE assessment_id = $2 AND status = 'head_approved'`,
      [req.user.id, assessment_id]
    );

    await logAudit(req.user.id, 'MARKS_LOCKED', 'assessment', assessment_id,
      { count: headApprovedMarks.length }, { assessment_id }, req);

    res.json({ message: `${headApprovedMarks.length} marks locked` });
  } catch (error) {
    logger.error('Failed to lock marks:', error);
    res.status(500).json({ error: 'Failed to lock marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — UNLOCK (Admin only)
// ============================================================
export const unlockMarks = async (req, res) => {
  const { assessment_id } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });

  try {
    const { rowCount } = await pool.query(
      `UPDATE marks SET status = 'head_approved', is_locked = false,
       unlocked_by = $1, unlocked_at = NOW()
       WHERE assessment_id = $2 AND status = 'locked'`,
      [req.user.id, assessment_id]
    );

    if (rowCount === 0) {
      return res.status(400).json({ error: 'No locked marks found for this assessment' });
    }

    await logAudit(req.user.id, 'MARKS_UNLOCKED', 'assessment', assessment_id,
      { count: rowCount }, { assessment_id }, req);

    res.json({ message: `${rowCount} marks unlocked` });
  } catch (error) {
    logger.error('Failed to unlock marks:', error);
    res.status(500).json({ error: 'Failed to unlock marks' });
  }
};

// ============================================================
// MARKS WORKFLOW — GET STATUS for an assessment
// ============================================================
export const getWorkflowStatus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM marks WHERE assessment_id = $1
       GROUP BY status`,
      [req.params.assessmentId]
    );

    const workflow = {
      draft: 0, submitted: 0, verified: 0,
      dos_approved: 0, head_approved: 0, locked: 0
    };

    rows.forEach(r => { workflow[r.status] = parseInt(r.count); });

    const total = Object.values(workflow).reduce((a, b) => a + b, 0);
    const currentStep = workflow.locked > 0 ? 'locked' :
                        workflow.head_approved > 0 ? 'head_approved' :
                        workflow.dos_approved > 0 ? 'dos_approved' :
                        workflow.verified > 0 ? 'verified' :
                        workflow.submitted > 0 ? 'submitted' : 'draft';

    res.json({ data: { workflow, total, currentStep } });
  } catch (error) {
    logger.error('Failed to get workflow status:', error);
    res.status(500).json({ error: 'Failed to get workflow status' });
  }
};
