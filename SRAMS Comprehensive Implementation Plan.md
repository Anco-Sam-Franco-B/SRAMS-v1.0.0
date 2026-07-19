# SRAMS Comprehensive Implementation Plan

> **Project:** Student Records and Academic Management System
> **Stack:** PostgreSQL + Express 5 + React 19 + Node.js (PREN)
> **Generated:** 2026-07-11

---

## Executive Summary

The SRAMS project has a working backend (generic CRUD + auth) and a partially built admin frontend (7 functional pages, 8 stubs). The plan covers 8 phases that transform it into a complete multi-portal school management system with RBAC, student/teacher portals, report card PDFs, and modern animated UI.

---

## PHASE 1: Database Schema Changes

**Goal:** Add student PIN authentication, teacher portal support fields, and audit columns.

### 1.1 Migration File: `backend/database/migrations/001_add_auth_and_portal_fields.sql`

```sql
-- Add PIN fields to students for PIN-based login
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS pin_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP;

-- Add user_id to students (link to users table for unified auth)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add last_login tracking to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add is_read to notifications (already exists in schema - verify)
-- Add created_at to attendance if missing
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index for PIN lockout check
CREATE INDEX IF NOT EXISTS idx_students_pin_locked ON students(pin_locked_until);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
```

### 1.2 Migration Runner: `backend/database/runMigrations.js`

Reads `.sql` files from `migrations/` in order, tracks which have run via a `schema_migrations` table.

### Files to Create
- `backend/database/migrations/001_add_auth_and_portal_fields.sql`
- `backend/database/runMigrations.js`

### Files to Modify
- `backend/database/schema.sql` — append new columns for fresh installs
- `backend/utils/startupLoader.js` — add migration step after schema init

---

## PHASE 2: Backend Restructuring — Per-Table Controllers & Routes

**Goal:** Replace the monolithic generic CRUD with dedicated, domain-specific controllers and routes.

### 2.1 Architecture

```
backend/
  controllers/
    auth.controller.js          (EXISTING - modify)
    student.controller.js       (REWRITE - expand from 1 line)
    teacher.controller.js       (NEW)
    class.controller.js         (NEW)
    subject.controller.js       (NEW)
    academicYear.controller.js  (NEW)
    term.controller.js          (NEW)
    assessment.controller.js    (NEW)
    mark.controller.js          (NEW)
    attendance.controller.js    (NEW)
    reportCard.controller.js    (NEW)
    promotion.controller.js     (NEW)
    gradingSystem.controller.js (NEW)
    notification.controller.js  (NEW)
    trade.controller.js         (NEW)
    user.controller.js          (REWRITE - expand)
    dashboard.controller.js     (NEW - extract from data.controller)
    data.controller.js          (KEEP as fallback/legacy, restrict access)
  routes/
    router/
      auth.route.js             (EXISTING - modify)
      student.route.js          (NEW)
      teacher.route.js          (NEW)
      class.route.js            (NEW)
      subject.route.js          (NEW)
      academicYear.route.js     (NEW)
      term.route.js             (NEW)
      assessment.route.js       (NEW)
      mark.route.js             (NEW)
      attendance.route.js       (NEW)
      reportCard.route.js       (NEW)
      promotion.route.js        (NEW)
      gradingSystem.route.js    (NEW)
      notification.route.js     (NEW)
      trade.route.js            (NEW)
      user.route.js             (REWRITE)
      dashboard.route.js        (NEW)
      data.route.js             (RESTRICT - admin legacy only)
    index.js                    (MODIFY - mount all new routers)
```

### 2.2 Per-Table Controller Pattern

Every controller follows this template:

```javascript
// controllers/example.controller.js
import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    // Role-specific filtering:
    // - Student: only own data
    // - Teacher: only assigned classes/trades
    // - Admin: everything
    let query = 'SELECT ...';
    let params = [];
    
    if (req.userRole === 'Student') {
      query += ' WHERE student_id = $1';
      params = [req.user.id];
    }
    
    const { rows } = await pool.query(query, params);
    res.status(200).json({ data: rows });
  } catch (error) {
    logger.error('...', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch' });
  }
};

export const getById = async (req, res) => { /* ... */ };
export const create = async (req, res) => { /* ... */ };
export const update = async (req, res) => { /* ... */ };
export const remove = async (req, res) => { /* ... */ };
```

### 2.3 Per-Table Route Pattern

```javascript
// routes/router/example.route.js
import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin, isAdminOrTeacher } from '../../middleware/authorization.js';
import { validateExample } from '../../middleware/validation.js';
import { getAll, getById, create, update, remove } from '../../controllers/example.controller.js';

const router = express.Router();

router.get('/',      authenticate, isAdminOrTeacher, getAll);
router.get('/:id',   authenticate, isAdminOrTeacher, getById);
router.post('/',     authenticate, isAdmin, validateExample, create);
router.put('/:id',   authenticate, isAdmin, validateExample, update);
router.delete('/:id', authenticate, isAdmin, remove);

export default router;
```

### 2.4 Specific Controller Details

#### `student.controller.js` (REWRITE)
```javascript
export const getAll = async (req, res) => {
  // Admin: all students with trade/class joins
  // Teacher: students in assigned classes only
  // Student: own profile only
};

export const getById = async (req, res) => {
  // Full student profile with trade, class, marks, attendance summary
};

export const create = async (req, res) => {
  // Use existing generateAdmissionNumber()
  // Hash PIN (default "1234")
  // Insert student + create linked user account
  // Transaction: BEGIN → generate ADM → INSERT student → INSERT user → COMMIT
};

export const update = async (req, res) => {
  // Admin only — update profile fields
  // Student can update own phone, email
};

export const remove = async (req, res) => {
  // Soft delete (is_active = false) unless admin hard deletes
};

export const changePin = async (req, res) => {
  // Student changes own PIN: verify old PIN → hash new PIN → update
};

export const getStudentDashboard = async (req, res) => {
  // Own marks summary, attendance %, upcoming assessments
};
```

**Route: `student.route.js`**
```
GET    /api/v1/students                    → getAll (admin/teacher)
GET    /api/v1/students/dashboard          → getStudentDashboard (student)
GET    /api/v1/students/:id                → getById (admin/teacher/self)
POST   /api/v1/students                    → create (admin)
PUT    /api/v1/students/:id                → update (admin/self limited)
DELETE /api/v1/students/:id                → remove (admin)
PUT    /api/v1/students/:id/pin            → changePin (self)
POST   /api/v1/students/login-pin          → loginWithPin (public)
```

#### `teacher.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Admin: all teachers with user info + trade
  // Teacher: own profile
};

export const create = async (req, res) => {
  // Admin: link existing user to teachers table
  // Or create user + teacher in transaction
};

export const getAssignedClasses = async (req, res) => {
  // Teacher: classes + subjects they're assigned to
};

export const getTeacherDashboard = async (req, res) => {
  // Pending attendance, upcoming assessments, class summary
};
```

**Route: `teacher.route.js`**
```
GET    /api/v1/teachers                    → getAll (admin)
GET    /api/v1/teachers/dashboard          → getTeacherDashboard (teacher)
GET    /api/v1/teachers/:id                → getById (admin/self)
POST   /api/v1/teachers                    → create (admin)
PUT    /api/v1/teachers/:id                → update (admin)
DELETE /api/v1/teachers/:id                → remove (admin)
GET    /api/v1/teachers/:id/assignments    → getAssignedClasses (teacher)
```

#### `attendance.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Admin: all attendance with student/class/subject names
  // Teacher: attendance for their classes only
  // Student: own attendance only
};

export const markAttendance = async (req, res) => {
  // Bulk upsert: receive array of {student_id, status, attendance_date, subject_id}
  // Uses ON CONFLICT (student_id, attendance_date) DO UPDATE
};

export const getAttendanceByClass = async (req, res) => {
  // Cascade: trade_id → academic_year → term → class → subject → student list with status
};

export const getAttendanceReport = async (req, res) => {
  // Summary: per student % present/absent/late for a date range
};
```

**Route: `attendance.route.js`**
```
GET    /api/v1/attendance                  → getAll (admin/teacher/student)
POST   /api/v1/attendance/mark             → markAttendance (teacher/admin)
GET    /api/v1/attendance/class/:classId   → getAttendanceByClass (teacher/admin)
GET    /api/v1/attendance/report           → getAttendanceReport (admin/teacher)
GET    /api/v1/attendance/student/:id      → getStudentAttendance (student/self, admin)
```

#### `assessment.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Admin: all with subject/teacher/term names
  // Teacher: assessments for their assigned subjects
};

export const create = async (req, res) => {
  // Admin/Teacher: create assessment linked to subject, term, teacher
};

export const update = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `assessment.route.js`**
```
GET    /api/v1/assessments                 → getAll (admin/teacher)
GET    /api/v1/assessments/:id             → getById (admin/teacher)
POST   /api/v1/assessments                 → create (admin/teacher)
PUT    /api/v1/assessments/:id             → update (admin/teacher)
DELETE /api/v1/assessments/:id             → remove (admin)
```

#### `mark.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Admin: all marks with student/assessment names
  // Teacher: marks for their assessments only
  // Student: own marks only
};

export const enterMarks = async (req, res) => {
  // Bulk insert: receive array of {student_id, assessment_id, marks}
  // ON CONFLICT (assessment_id, student_id) DO UPDATE
};

export const getMarksByAssessment = async (req, res) => {
  // All marks for a specific assessment with student names
};

export const getStudentMarks = async (req, res) => {
  // All marks for a student with assessment details, grouped by subject/term
};
```

**Route: `mark.route.js`**
```
GET    /api/v1/marks                       → getAll (admin/teacher/student)
POST   /api/v1/marks/enter                 → enterMarks (teacher/admin)
GET    /api/v1/marks/assessment/:id        → getMarksByAssessment (teacher/admin)
GET    /api/v1/marks/student/:id           → getStudentMarks (student/self, admin)
```

#### `reportCard.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Admin: all report cards with student/term names
  // Student: own report cards
};

export const generate = async (req, res) => {
  // Admin: generate report cards for all students in a term
  // Algorithm:
  //   1. Get all students in trade + term
  //   2. For each student: sum all marks, calculate average
  //   3. Rank students by average within their class
  //   4. Auto-assign grade from grading_system based on average
  //   5. INSERT into report_cards
  //   6. Return generated report cards
};

export const getReportCard = async (req, res) => {
  // Full report card: student info + all subject marks + average + position + grade + comment
};

export const generatePDF = async (req, res) => {
  // Return structured data for frontend PDF rendering
  // (Frontend uses @react-pdf/renderer or jspdf)
};
```

**Route: `reportCard.route.js`**
```
GET    /api/v1/report-cards                → getAll (admin/student)
POST   /api/v1/report-cards/generate       → generate (admin)
GET    /api/v1/report-cards/:id            → getReportCard (admin/student/self)
GET    /api/v1/report-cards/:id/pdf        → generatePDF data (admin/student/self)
```

#### `promotion.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {};
export const promote = async (req, res) => {
  // Bulk: receive array of {student_id, to_class_id}
  // Or auto-promote: promote all students based on marks
};
export const getPromotionHistory = async (req, res) => {};
```

**Route: `promotion.route.js`**
```
GET    /api/v1/promotions                  → getAll (admin)
POST   /api/v1/promotions/promote          → promote (admin)
GET    /api/v1/promotions/history          → getPromotionHistory (admin)
```

#### `gradingSystem.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `gradingSystem.route.js`**
```
GET    /api/v1/grading-system              → getAll (admin/teacher/student)
POST   /api/v1/grading-system              → create (admin)
PUT    /api/v1/grading-system/:id          → update (admin)
DELETE /api/v1/grading-system/:id          → remove (admin)
```

#### `notification.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Filter by user_id — each user sees their own notifications
};
export const send = async (req, res) => {
  // Admin: send to specific user(s), all teachers, all students, all
};
export const markRead = async (req, res) => {};
export const markAllRead = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `notification.route.js`**
```
GET    /api/v1/notifications               → getAll (any authenticated)
POST   /api/v1/notifications/send          → send (admin)
PUT    /api/v1/notifications/:id/read      → markRead (owner)
PUT    /api/v1/notifications/read-all      → markAllRead (owner)
DELETE /api/v1/notifications/:id           → remove (admin/owner)
```

#### `trade.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `trade.route.js`**
```
GET    /api/v1/trades                      → getAll (all authenticated)
POST   /api/v1/trades                      → create (admin)
PUT    /api/v1/trades/:id                  → update (admin)
DELETE /api/v1/trades/:id                  → remove (admin)
```

#### `academicYear.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
export const setCurrent = async (req, res) => {
  // Set is_current=true for this year, false for all others
};
```

**Route: `academicYear.route.js`**
```
GET    /api/v1/academic-years              → getAll (all authenticated)
POST   /api/v1/academic-years              → create (admin)
PUT    /api/v1/academic-years/:id          → update (admin)
DELETE /api/v1/academic-years/:id          → remove (admin)
PUT    /api/v1/academic-years/:id/set-current → setCurrent (admin)
```

#### `term.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
export const setCurrent = async (req, res) => {};
```

**Route: `term.route.js`**
```
GET    /api/v1/terms                       → getAll (all authenticated)
POST   /api/v1/terms                       → create (admin)
PUT    /api/v1/terms/:id                   → update (admin)
DELETE /api/v1/terms/:id                   → remove (admin)
PUT    /api/v1/terms/:id/set-current       → setCurrent (admin)
```

#### `class.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Filter by trade_id if provided as query param
};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `class.route.js`**
```
GET    /api/v1/classes                     → getAll (all authenticated)
GET    /api/v1/classes?trade_id=X          → getAll filtered
POST   /api/v1/classes                     → create (admin)
PUT    /api/v1/classes/:id                 → update (admin)
DELETE /api/v1/classes/:id                 → remove (admin)
```

#### `subject.controller.js` (NEW)
```javascript
export const getAll = async (req, res) => {
  // Filter by trade_id and/or class_id via query params
};
export const create = async (req, res) => {};
export const update = async (req, res) => {};
export const remove = async (req, res) => {};
```

**Route: `subject.route.js`**
```
GET    /api/v1/subjects                    → getAll (all authenticated)
GET    /api/v1/subjects?trade_id=X&class_id=Y → getAll filtered
POST   /api/v1/subjects                    → create (admin)
PUT    /api/v1/subjects/:id                → update (admin)
DELETE /api/v1/subjects/:id                → remove (admin)
```

#### `dashboard.controller.js` (NEW)
```javascript
export const getAdminStats = async (req, res) => {
  // Counts: students, teachers, classes, subjects, assessments
  // Recent activity: last 10 created records across tables
  // Alerts: upcoming term end, low attendance, etc.
};

export const getTeacherStats = async (req, res) => {
  // Assigned classes count, pending attendance, upcoming assessments
};

export const getStudentStats = async (req, res) => {
  // Overall average, attendance %, rank, upcoming assessments
};
```

**Route: `dashboard.route.js`**
```
GET    /api/v1/dashboard/admin             → getAdminStats (admin)
GET    /api/v1/dashboard/teacher           → getTeacherStats (teacher)
GET    /api/v1/dashboard/student           → getStudentStats (student)
```

#### `user.controller.js` (REWRITE)
```javascript
export const getAll = async (req, res) => {};  // Admin only
export const getById = async (req, res) => {}; // Admin
export const changeRole = async (req, res) => {}; // Admin
export const toggleActive = async (req, res) => {}; // Admin
export const remove = async (req, res) => {}; // Admin
export const getProfile = async (req, res) => {}; // Any authenticated - own profile
export const updateProfile = async (req, res) => {}; // Any authenticated - own profile
```

**Route: `user.route.js`**
```
GET    /api/v1/users                       → getAll (admin)
GET    /api/v1/users/profile               → getProfile (any authenticated)
PUT    /api/v1/users/profile               → updateProfile (any authenticated)
GET    /api/v1/users/:id                   → getById (admin)
PUT    /api/v1/users/:id/role              → changeRole (admin)
PUT    /api/v1/users/:id/toggle-active     → toggleActive (admin)
DELETE /api/v1/users/:id                   → remove (admin)
```

### 2.5 Route Mounting (`backend/routes/index.js`)

```javascript
import express from 'express';
import authRouter from './router/auth.route.js';
import studentRouter from './router/student.route.js';
import teacherRouter from './router/teacher.route.js';
import classRouter from './router/class.route.js';
import subjectRouter from './router/subject.route.js';
import academicYearRouter from './router/academicYear.route.js';
import termRouter from './router/term.route.js';
import assessmentRouter from './router/assessment.route.js';
import markRouter from './router/mark.route.js';
import attendanceRouter from './router/attendance.route.js';
import reportCardRouter from './router/reportCard.route.js';
import promotionRouter from './router/promotion.route.js';
import gradingSystemRouter from './router/gradingSystem.route.js';
import notificationRouter from './router/notification.route.js';
import tradeRouter from './router/trade.route.js';
import userRouter from './router/user.route.js';
import dashboardRouter from './router/dashboard.route.js';
import BackupRouter from './backupRoutes.js';
import dataRouter from './router/data.route.js'; // Legacy fallback

const sramsRoutes = express.Router();

sramsRoutes.use('/auth', authRouter);
sramsRoutes.use('/dashboard', dashboardRouter);
sramsRoutes.use('/students', studentRouter);
sramsRoutes.use('/teachers', teacherRouter);
sramsRoutes.use('/classes', classRouter);
sramsRoutes.use('/subjects', subjectRouter);
sramsRoutes.use('/academic-years', academicYearRouter);
sramsRoutes.use('/terms', termRouter);
sramsRoutes.use('/assessments', assessmentRouter);
sramsRoutes.use('/marks', markRouter);
sramsRoutes.use('/attendance', attendanceRouter);
sramsRoutes.use('/report-cards', reportCardRouter);
sramsRoutes.use('/promotions', promotionRouter);
sramsRoutes.use('/grading-system', gradingSystemRouter);
sramsRoutes.use('/notifications', notificationRouter);
sramsRoutes.use('/trades', tradeRouter);
srmsRoutes.use('/users', userRouter);
sramsRoutes.use('/backups', BackupRouter);
sramsRoutes.use('/data', authenticate, authorize('Administrator'), dataRouter); // Legacy admin-only

export default sramsRoutes;
```

### 2.6 Files to Create/Modify Summary

**Create (20 files):**
- `backend/controllers/teacher.controller.js`
- `backend/controllers/class.controller.js`
- `backend/controllers/subject.controller.js`
- `backend/controllers/academicYear.controller.js`
- `backend/controllers/term.controller.js`
- `backend/controllers/assessment.controller.js`
- `backend/controllers/mark.controller.js`
- `backend/controllers/attendance.controller.js`
- `backend/controllers/reportCard.controller.js`
- `backend/controllers/promotion.controller.js`
- `backend/controllers/gradingSystem.controller.js`
- `backend/controllers/notification.controller.js`
- `backend/controllers/trade.controller.js`
- `backend/controllers/dashboard.controller.js`
- `backend/routes/router/student.route.js` (NEW)
- `backend/routes/router/teacher.route.js`
- `backend/routes/router/class.route.js`
- `backend/routes/router/subject.route.js`
- `backend/routes/router/academicYear.route.js`
- `backend/routes/router/term.route.js`
- `backend/routes/router/assessment.route.js`
- `backend/routes/router/mark.route.js`
- `backend/routes/router/attendance.route.js`
- `backend/routes/router/reportCard.route.js`
- `backend/routes/router/promotion.route.js`
- `backend/routes/router/gradingSystem.route.js`
- `backend/routes/router/notification.route.js`
- `backend/routes/router/trade.route.js`
- `backend/routes/router/dashboard.route.js`

**Modify (5 files):**
- `backend/controllers/auth.controller.js` — add student login PIN
- `backend/controllers/student.controller.js` — full rewrite
- `backend/controllers/user.controller.js` — expand
- `backend/routes/index.js` — mount all new routers
- `backend/middleware/authorization.js` — add resource-level checks

---

## PHASE 3: Authentication & RBAC

**Goal:** Three login portals (admin/teacher via email+password, student via admission_no+PIN). Role-based access on every route.

### 3.1 Backend Auth Changes

#### `backend/controllers/auth.controller.js` — Add Student PIN Login

```javascript
export const loginWithPin = async (req, res) => {
  const { admission_no, pin } = req.body;
  
  // 1. Find student by admission_no
  const { rows } = await pool.query(
    'SELECT * FROM students WHERE admission_no = $1 AND is_active = true',
    [admission_no]
  );
  
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid admission number' });
  }
  
  const student = rows[0];
  
  // 2. Check lockout
  if (student.pin_locked_until && new Date(student.pin_locked_until) > new Date()) {
    return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
  }
  
  // 3. Verify PIN
  const isValidPin = await bcrypt.compare(pin, student.pin_hash || '');
  
  if (!isValidPin) {
    // Increment attempts, lock after 5 failures
    const attempts = (student.pin_attempts || 0) + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    
    await pool.query(
      'UPDATE students SET pin_attempts = $1, pin_locked_until = $2 WHERE id = $3',
      [attempts, lockUntil, student.id]
    );
    
    return res.status(401).json({ error: 'Invalid PIN', attempts_remaining: 5 - attempts });
  }
  
  // 4. Reset attempts on success
  await pool.query(
    'UPDATE students SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1',
    [student.id]
  );
  
  // 5. Find or create linked user
  let userId = student.user_id;
  if (!userId) {
    // Create a user account for the student
    const tempEmail = `${student.admission_no.toLowerCase()}@student.srams.local`;
    const tempHash = await bcrypt.hash(pin, 12);
    const userResult = await pool.query(
      `INSERT INTO users (role_id, first_name, last_name, email, password_hash)
       SELECT id, $1, $2, $3, $4 FROM roles WHERE name = 'Student'
       RETURNING id`,
      [student.first_name, student.last_name, tempEmail, tempHash]
    );
    userId = userResult.rows[0].id;
    await pool.query('UPDATE students SET user_id = $1 WHERE id = $2', [userId, student.id]);
  }
  
  // 6. Generate JWT
  const token = jwt.sign(
    { id: userId, role: 'Student', studentId: student.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  
  res.status(200).json({
    success: true,
    user: { id: userId, role: 'Student', first_name: student.first_name, last_name: student.last_name, admission_no: student.admission_no }
  });
};
```

#### `backend/middleware/authorization.js` — Add Resource-Level Checks

```javascript
export const canAccessStudent = async (req, res, next) => {
  if (req.userRole === 'Administrator') return next();
  if (req.userRole === 'Teacher') {
    // Check if teacher is assigned to the student's class/trade
    const studentId = req.params.id || req.body.student_id;
    const { rows } = await pool.query(
      `SELECT 1 FROM teacher_subjects ts
       JOIN students s ON ts.class_id = s.class_id AND ts.trade_id = s.trade_id
       WHERE ts.teacher_id = (SELECT id FROM teachers WHERE user_id = $1)
       AND s.id = $2`,
      [req.user.id, studentId]
    );
    if (rows.length > 0) return next();
  }
  if (req.userRole === 'Student') {
    // Check if accessing own data
    const studentId = req.params.id || req.body.student_id;
    const { rows } = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (rows.length > 0 && rows[0].id === studentId) return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};
```

### 3.2 Route-Level RBAC Mapping

| Resource | Admin | Teacher | Student |
|----------|-------|---------|---------|
| `/students` | CRUD all | Read assigned | Read self, update own phone/email |
| `/teachers` | CRUD all | Read self | - |
| `/classes` | CRUD all | Read assigned | Read assigned |
| `/subjects` | CRUD all | Read assigned | Read assigned |
| `/academic-years` | CRUD all | Read | Read |
| `/terms` | CRUD all | Read | Read |
| `/assessments` | CRUD all | CRUD for own subjects | Read own |
| `/marks` | CRUD all | Enter for own subjects | Read own |
| `/attendance` | CRUD all, view reports | Mark for own classes | Read own |
| `/report-cards` | CRUD all, generate | Read assigned | Read own |
| `/promotions` | CRUD all | - | Read own |
| `/grading-system` | CRUD all | Read | Read |
| `/notifications` | CRUD all, send | Read own | Read own |
| `/trades` | CRUD all | Read | Read |
| `/users` | CRUD all | - | - |
| `/dashboard` | Admin stats | Teacher stats | Student stats |
| `/backups` | Full access | - | - |

### 3.3 Frontend Route Protection

#### `frontend/src/protectedRoutes/RoleRoute.jsx` (NEW)

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}
```

#### Update `App.jsx` routing:

```jsx
<Routes>
  {/* Public Routes */}
  <Route element={<PublicRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Signup />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
  </Route>

  {/* Admin Routes */}
  <Route element={<RoleRoute allowedRoles={['Administrator']} />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="users" element={<Users />} />
      <Route path="students" element={<Students />} />
      {/* ... all 18 admin routes ... */}
    </Route>
  </Route>

  {/* Teacher Routes */}
  <Route element={<RoleRoute allowedRoles={['Teacher', 'Administrator']} />}>
    <Route path="/teacher" element={<TeacherLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<TeacherDashboard />} />
      <Route path="attendance" element={<TeacherAttendance />} />
      <Route path="marks" element={<TeacherMarks />} />
      <Route path="classes" element={<TeacherClasses />} />
      <Route path="assessments" element={<TeacherAssessments />} />
      <Route path="profile" element={<TeacherProfile />} />
    </Route>
  </Route>

  {/* Student Routes */}
  <Route element={<RoleRoute allowedRoles={['Student']} />}>
    <Route path="/student" element={<StudentLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="marks" element={<StudentMarks />} />
      <Route path="attendance" element={<StudentAttendance />} />
      <Route path="report-card" element={<StudentReportCard />} />
      <Route path="assessments" element={<StudentAssessments />} />
      <Route path="profile" element={<StudentProfile />} />
      <Route path="change-pin" element={<ChangePin />} />
    </Route>
  </Route>
</Routes>
```

#### Update `AuthContext.jsx` — Handle role-based redirect after login:

```javascript
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { user } = response.data;
  setUser(user);
  return user; // Return user so Login.jsx can redirect based on role
};

const loginWithPin = async (admission_no, pin) => {
  const response = await api.post('/auth/students/login-pin', { admission_no, pin });
  const { user } = response.data;
  setUser(user);
  return user;
};
```

### 3.4 Files to Create/Modify

**Create:**
- `frontend/src/protectedRoutes/RoleRoute.jsx`

**Modify:**
- `backend/controllers/auth.controller.js` — add `loginWithPin`, `changePin`
- `backend/middleware/authorization.js` — add `canAccessStudent`, `canAccessTeacher`
- `backend/routes/router/auth.route.js` — add PIN login route
- `frontend/src/App.jsx` — add teacher/student route sections
- `frontend/src/context/AuthContext.jsx` — add `loginWithPin`, role-aware redirects
- `frontend/src/pages/auth/Login.jsx` — add portal toggle (Admin/Teacher vs Student)

---

## PHASE 4: Student Portal

**Goal:** Complete student-facing portal with dashboard, marks, attendance, report cards, and PIN management.

### 4.1 Layout: `frontend/src/layouts/StudentLayout.jsx` (REWRITE)

Modern sidebar + topbar layout matching AdminLayout style but with student-specific nav:

```
Sidebar items:
  - Dashboard (LayoutDashboard icon)
  - My Marks (BarChart3 icon)
  - Attendance (CheckSquare icon)
  - Report Cards (FileText icon)
  - Assessments (ClipboardList icon)
  - Profile (User icon)
  - Change PIN (Lock icon)
  - Logout

Topbar:
  - Hamburger (mobile)
  - School name
  - Notification bell
  - User avatar (first letter)
  - Logout button
```

### 4.2 Pages

#### `frontend/src/pages/student/Dashboard.jsx`
```
- Welcome card with student name + admission number
- Stats cards: Overall Average, Attendance %, Class Position, Total Subjects
- Recent marks (last 5 assessments with scores)
- Upcoming assessments
- Attendance calendar heatmap (last 30 days)
```

#### `frontend/src/pages/student/StudentMarks.jsx`
```
- Filter: Term dropdown → Subject dropdown (cascade)
- Table: Assessment Title | Subject | Marks | Total | Percentage | Grade
- Grouped by subject
- Summary row: total marks, average, grade
```

#### `frontend/src/pages/student/StudentAttendance.jsx`
```
- Date range picker
- Summary cards: Present days, Absent days, Late days, Attendance %
- Table: Date | Subject | Status | Teacher
- Color-coded status badges
```

#### `frontend/src/pages/student/StudentReportCard.jsx`
```
- Term selector dropdown
- Report card preview (styled like a real report card)
  - School header/logo
  - Student info (name, admission no, class, trade, term)
  - Subject-by-subject marks table
  - Total, Average, Position
  - Grade with remarks
  - Teacher comment
  - Principal comment area
- Buttons: Download PDF, Print
```

#### `frontend/src/pages/student/StudentAssessments.jsx`
```
- List of upcoming/recent assessments
- Card layout: Title, Subject, Date, Total Marks
- Status badge: Upcoming, Completed
```

#### `frontend/src/pages/student/Profile.jsx`
```
- Student info card (photo placeholder, name, admission no, class, trade, email, phone, DOB)
- Edit own phone/email
- Change PIN form
```

#### `frontend/src/pages/student/ChangePin.jsx`
```
- Current PIN input
- New PIN input
- Confirm new PIN input
- Validation: min 4 digits, must match
- Success toast + redirect
```

### 4.3 Files to Create
- `frontend/src/pages/student/Dashboard.jsx`
- `frontend/src/pages/student/StudentMarks.jsx`
- `frontend/src/pages/student/StudentAttendance.jsx`
- `frontend/src/pages/student/StudentReportCard.jsx`
- `frontend/src/pages/student/StudentAssessments.jsx`
- `frontend/src/pages/student/Profile.jsx`
- `frontend/src/pages/student/ChangePin.jsx`

### 4.4 Files to Modify
- `frontend/src/layouts/StudentLayout.jsx` — full rewrite
- `frontend/src/App.jsx` — add student routes

---

## PHASE 5: Teacher Portal

**Goal:** Teacher portal with attendance marking, marks entry, and class management using the cascade pattern.

### 5.1 Layout: `frontend/src/layouts/TeacherLayout.jsx` (REWRITE)

```
Sidebar items:
  - Dashboard
  - Attendance
  - Marks Entry
  - My Classes
  - Assessments
  - Profile
  - Logout
```

### 5.2 Pages

#### `frontend/src/pages/teacher/TeacherDashboard.jsx`
```
- Welcome card with teacher name + assigned trade
- Stats: My Classes, My Subjects, Pending Attendance, Total Students
- Quick actions: Mark Attendance, Enter Marks
- Recent activity feed
```

#### `frontend/src/pages/teacher/TeacherAttendance.jsx` — CASCADE PATTERN
```
Cascade Dropdowns:
  Step 1: Trade (auto-selected from teacher's assignment)
  Step 2: Academic Year (dropdown)
  Step 3: Term (filtered by academic year)
  Step 4: Class (filtered by teacher's assigned classes)
  Step 5: Subject (filtered by teacher's assigned subjects in that class)
  Step 6: Date picker

After cascade complete → Load student list for that class
- Table: Student Name | Admission No | Status dropdown (PRESENT/ABSENT/LATE/EXCUSED/SICK)
- Bulk actions: Mark All Present, Mark All Absent
- Save button → POST /attendance/mark (bulk upsert)
```

#### `frontend/src/pages/teacher/TeacherMarks.jsx` — CASCADE PATTERN
```
Cascade Dropdowns:
  Step 1: Trade → Step 2: Academic Year → Step 3: Term → Step 4: Assessment

After cascade → Load student list with marks input
- Table: Student Name | Admission No | Marks input (number) | Total Marks display
- Auto-calculate percentage
- Save button → POST /marks/enter (bulk upsert)
```

#### `frontend/src/pages/teacher/TeacherClasses.jsx`
```
- List of assigned classes with student count
- Click class → view student list
- Per-class stats: average marks, attendance rate
```

#### `frontend/src/pages/teacher/TeacherAssessments.jsx`
```
- CRUD for assessments within assigned subjects
- List assessments with status
- Create new assessment form (with cascade)
```

#### `frontend/src/pages/teacher/TeacherProfile.jsx`
```
- Teacher info card
- Assigned subjects/classes list
```

### 5.3 Files to Create
- `frontend/src/pages/teacher/TeacherDashboard.jsx`
- `frontend/src/pages/teacher/TeacherAttendance.jsx`
- `frontend/src/pages/teacher/TeacherMarks.jsx`
- `frontend/src/pages/teacher/TeacherClasses.jsx`
- `frontend/src/pages/teacher/TeacherAssessments.jsx`
- `frontend/src/pages/teacher/TeacherProfile.jsx`

### 5.4 Files to Modify
- `frontend/src/layouts/TeacherLayout.jsx` — full rewrite
- `frontend/src/App.jsx` — add teacher routes

---

## PHASE 6: Complete All Admin CRUD Pages

**Goal:** Convert all 8 stub pages into fully functional CRUD pages.

### 6.1 `admin/Users.jsx` — Full CRUD

**Current:** Read-only table with role change dropdown (toggle/delete not wired).

**Add:**
- Toggle active/inactive button (PUT `/users/:id/toggle-active`)
- Delete user button with confirmation modal
- Create user modal (first_name, last_name, email, password, role)
- Edit user modal
- Search + filter by role
- Active/Inactive badge

### 6.2 `admin/Attendance.jsx` — Full CRUD + Reports

**Current:** Read-only table showing raw UUIDs.

**Add:**
- Create/Mark Attendance button → opens modal with cascade: Trade → Academic Year → Term → Class → Subject → Date → Student list with status dropdowns
- Filter by: Trade, Class, Date range, Status
- Resolve display names (student name, teacher name, subject name) instead of raw UUIDs
- Generate Report button → attendance summary per student
- Color-coded status badges
- Bulk mark: "Mark All Present"

### 6.3 `admin/Assessments.jsx` — Full CRUD

**Current:** Read-only table, "New Assessment" button not wired.

**Add:**
- Create Assessment modal with cascade: Trade → Subject → Term
- Fields: title, total_marks, subject, teacher, term, trade
- Edit assessment modal
- Delete with confirmation
- Link to enter marks for this assessment
- Filter by trade, subject, term

### 6.4 `admin/Marks.jsx` — Full CRUD + Bulk Entry

**Current:** Read-only table showing raw UUIDs.

**Add:**
- Enter Marks button → cascade: Assessment → Student list
- Bulk marks entry table: Student Name | Marks input
- Edit individual marks
- Filter by assessment, student, trade
- Display resolved names instead of UUIDs
- Statistics: class average, highest, lowest per assessment

### 6.5 `admin/ReportCards.jsx` — Generate + PDF

**Current:** Read-only table.

**Add:**
- "Generate New Reports" button → modal: select Trade, Term → generates for all students
- Preview report card in modal (styled HTML)
- Download PDF button
- Print button
- Filter by trade, term
- Display student name, class, average, position instead of UUIDs
- Sort by position

### 6.6 `admin/Promotions.jsx` — Bulk Promote

**Current:** Read-only table.

**Add:**
- "New Promotion Run" button → modal:
  - Select Academic Year
  - Select From Class → To Class (or auto-promote based on marks)
  - Select students to promote (checkboxes) or "Promote All"
- View promotion history with filters
- Status badges (Promoted, Held Back, Pending)

### 6.7 `admin/Notifications.jsx` — Send + Manage

**Current:** Read-only card list.

**Add:**
- "Send Notification" button → modal:
  - Recipient selection: Specific user, All Teachers, All Students, All
  - Title, Message fields
- Mark as read/unread toggle
- Delete notification
- Filter by read status

### 6.8 `admin/GradingSystem.jsx` — Full CRUD

**Current:** Read-only table.

**Add:**
- "Add Grade" button → modal: grade, min_mark, max_mark, remarks
- Edit grade inline or via modal
- Delete with confirmation
- Validation: no overlapping ranges
- Sort by min_mark

### 6.9 `admin/Settings.jsx` — Fix Bugs + Full CRUD

**Current:** Trade create only, has bugs (undefined `fetchSubjects`, missing `LoaderPinwheelIcon`).

**Fix:**
- Replace `fetchSubjects()` with `fetchTrades()`
- Import `LoaderPinwheelIcon` or replace with existing icon
- Add edit trade modal
- Add delete trade with confirmation
- Trade code + name fields

### 6.10 Files to Modify (8 files)
- `frontend/src/pages/admin/Users.jsx` — full rewrite
- `frontend/src/pages/admin/Attendance.jsx` — full rewrite
- `frontend/src/pages/admin/Assessments.jsx` — full rewrite
- `frontend/src/pages/admin/Marks.jsx` — full rewrite
- `frontend/src/pages/admin/ReportCards.jsx` — full rewrite with PDF
- `frontend/src/pages/admin/Promotions.jsx` — full rewrite
- `frontend/src/pages/admin/Notifications.jsx` — full rewrite
- `frontend/src/pages/admin/GradingSystem.jsx` — full rewrite
- `frontend/src/pages/admin/Settings.jsx` — fix bugs + enhance
- `frontend/src/pages/admin/Dashboard.jsx` — enhance with charts/recent activity

---

## PHASE 7: Report Card PDF Generation

**Goal:** Professional report card with preview, download (PDF), and print.

### 7.1 Architecture Decision

Use **`@react-pdf/renderer`** for PDF generation (already installed). It produces server-quality PDFs with proper fonts, layouts, and tables — superior to jspdf for complex document layouts.

### 7.2 Components to Create

#### `frontend/src/components/reportCard/ReportCardPDF.jsx`
The actual PDF document component using `@react-pdf/renderer`:

```jsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  schoolName: { fontSize: 20, fontWeight: 'bold', color: '#1e40af' },
  reportTitle: { fontSize: 14, marginTop: 5, color: '#374151' },
  studentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, padding: 10, backgroundColor: '#f3f4f6' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#d1d5db' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  tableHeader: { backgroundColor: '#1e40af', color: 'white', fontWeight: 'bold' },
  tableCell: { padding: 6, fontSize: 10, flex: 1 },
  summary: { marginTop: 20, padding: 15, backgroundColor: '#eff6ff', borderRadius: 4 },
  comment: { marginTop: 15, padding: 10, borderLeftWidth: 3, borderLeftColor: '#1e40af' },
  footer: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' },
  signature: { width: '40%', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5, textAlign: 'center', fontSize: 9 }
});

export default function ReportCardPDF({ reportData, student, marks, term, school }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{school.name}</Text>
          <Text style={styles.reportTitle}>ACADEMIC REPORT CARD</Text>
        </View>
        
        {/* Student Info */}
        <View style={styles.studentInfo}>
          <Text>Name: {student.first_name} {student.last_name}</Text>
          <Text>Adm No: {student.admission_no}</Text>
          <Text>Class: {student.class_name}</Text>
          <Text>Term: {term.name}</Text>
        </View>
        
        {/* Marks Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Subject</Text>
            <Text style={styles.tableCell}>CA1</Text>
            <Text style={styles.tableCell}>Exam</Text>
            <Text style={styles.tableCell}>Total</Text>
            <Text style={styles.tableCell}>Grade</Text>
          </View>
          {marks.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{m.subject_name}</Text>
              <Text style={styles.tableCell}>{m.ca_marks}</Text>
              <Text style={styles.tableCell}>{m.exam_marks}</Text>
              <Text style={styles.tableCell}>{m.total}</Text>
              <Text style={styles.tableCell}>{m.grade}</Text>
            </View>
          ))}
        </View>
        
        {/* Summary */}
        <View style={styles.summary}>
          <Text>Total Marks: {reportData.total_marks}</Text>
          <Text>Average: {reportData.average}%</Text>
          <Text>Position: {reportData.position}</Text>
          <Text>Overall Grade: {reportData.grade}</Text>
        </View>
        
        {/* Comments */}
        <View style={styles.comment}>
          <Text>Teacher's Comment: {reportData.teacher_comment}</Text>
        </View>
        
        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <Text>Class Teacher</Text>
          </View>
          <View style={styles.signature}>
            <Text>Principal</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### 7.3 Components to Create

- `frontend/src/components/reportCard/ReportCardPDF.jsx` — PDF document
- `frontend/src/components/reportCard/ReportCardPreview.jsx` — HTML preview modal
- `frontend/src/components/reportCard/ReportCardDownload.jsx` — PDF download wrapper
- `frontend/src/components/reportCard/ReportCardPrint.jsx` — Print-optimized view

### 7.4 Backend Support

The `reportCard.controller.js` `getReportCard` endpoint must return:

```json
{
  "student": {
    "first_name": "John",
    "last_name": "Doe",
    "admission_no": "ADM-2026-0001",
    "class_name": "Form 3",
    "trade_name": "Science"
  },
  "term": { "name": "Term 1", "academic_year": "2026" },
  "marks": [
    { "subject_name": "Mathematics", "ca_marks": 35, "exam_marks": 55, "total": 90, "grade": "A" },
    { "subject_name": "English", "ca_marks": 30, "exam_marks": 50, "total": 80, "grade": "B+" }
  ],
  "summary": {
    "total_marks": 170,
    "average": 85.0,
    "position": 3,
    "grade": "A",
    "teacher_comment": "Excellent performance. Keep it up!"
  }
}
```

### 7.5 Files to Create
- `frontend/src/components/reportCard/ReportCardPDF.jsx`
- `frontend/src/components/reportCard/ReportCardPreview.jsx`
- `frontend/src/components/reportCard/ReportCardDownload.jsx`

---

## PHASE 8: Modern UI/UX with Framer Motion

**Goal:** Stunning, animated interface throughout the application.

### 8.1 Design System

#### Color Palette (Tailwind extend in `tailwind.config.js`)
```javascript
theme: {
  extend: {
    colors: {
      primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
      accent: { 50: '#fdf4ff', 500: '#a855f7', 600: '#9333ea' },
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-out',
      'slide-up': 'slideUp 0.5s ease-out',
      'slide-in-right': 'slideInRight 0.3s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    keyframes: {
      fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
    }
  }
}
```

### 8.2 Framer Motion Utilities

#### `frontend/src/components/motion/AnimatedComponents.jsx` (NEW)

Pre-built animated wrappers:

```jsx
import { motion } from 'framer-motion';

// Page transition wrapper
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Staggered list items (for tables, cards)
export const StaggerContainer = ({ children, className }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      visible: { transition: { staggerChildren: 0.05 } }
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    {children}
  </motion.div>
);

// Card hover effect
export const HoverCard = ({ children, className }) => (
  <motion.div
    className={className}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    {children}
  </motion.div>
);

// Modal animation
export const ModalOverlay = ({ isOpen, onClose, children }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

// Stat card with count-up animation
export const AnimatedStatCard = ({ icon: Icon, label, value, color }) => (
  <HoverCard className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <motion.p
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.p>
      </div>
    </div>
  </HoverCard>
);
```

### 8.3 Global Page Transitions

Update `App.jsx` to use `AnimatePresence`:

```jsx
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ... all routes ... */}
      </Routes>
    </AnimatePresence>
  );
}
```

### 8.4 Loading Skeletons

#### `frontend/src/components/ui/Skeleton.jsx` (NEW)

```jsx
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <TableSkeleton rows={5} cols={5} />
    </div>
  </div>
);
```

### 8.5 Enhanced Login Page

Redesign `Login.jsx` with:
- Animated gradient background (CSS or framer-motion)
- Floating particles effect
- Smooth form transitions
- Portal selection tabs (Admin/Teacher | Student)
- Student portal shows admission_no + PIN fields instead of email + password
- Animated logo/branding

### 8.6 Enhanced Dashboard

Redesign `Dashboard.jsx` with:
- Animated stat cards with count-up effect
- Chart.js or Recharts integration for visual analytics
- Recent activity timeline with animated entries
- Quick action cards with hover effects

### 8.7 Files to Create
- `frontend/src/components/motion/AnimatedComponents.jsx`
- `frontend/src/components/ui/Skeleton.jsx`

### 8.8 Files to Modify
- `frontend/tailwind.config.js` — extend animations
- `frontend/src/App.jsx` — AnimatePresence
- `frontend/src/pages/auth/Login.jsx` — full redesign
- `frontend/src/pages/admin/Dashboard.jsx` — charts + animations
- All admin pages — wrap in PageTransition, use StaggerContainer for tables
- All modal components — use ModalOverlay

---

## PHASE 9: Cascade Pattern Implementation

**Goal:** Consistent Trade → Academic Year → Term → Class → Subject → Student cascade in all relevant forms.

### 9.1 Reusable Cascade Hook

#### `frontend/src/hooks/useCascade.js` (NEW)

```javascript
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useCascade() {
  const [trades, setTrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Selections
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Load base data
  useEffect(() => {
    api.get('/trades').then(r => setTrades(r.data.data));
    api.get('/academic-years').then(r => setAcademicYears(r.data.data));
  }, []);
  
  // When trade changes → load classes
  useEffect(() => {
    if (!selectedTrade) { setClasses([]); return; }
    api.get(`/classes?trade_id=${selectedTrade}`).then(r => setClasses(r.data.data));
    setSelectedClass('');
    setSelectedSubject('');
  }, [selectedTrade]);
  
  // When year changes → load terms
  useEffect(() => {
    if (!selectedYear) { setTerms([]); return; }
    api.get(`/terms?academic_year_id=${selectedYear}`).then(r => setTerms(r.data.data));
    setSelectedTerm('');
  }, [selectedYear]);
  
  // When class changes → load subjects
  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return; }
    const params = new URLSearchParams({ trade_id: selectedTrade, class_id: selectedClass });
    api.get(`/subjects?${params}`).then(r => setSubjects(r.data.data));
    setSelectedSubject('');
  }, [selectedClass, selectedTrade]);
  
  // When subject changes → load students
  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    api.get(`/students?class_id=${selectedClass}&trade_id=${selectedTrade}`)
      .then(r => setStudents(r.data.data));
  }, [selectedSubject, selectedClass, selectedTrade]);
  
  const resetCascade = useCallback(() => {
    setSelectedTrade('');
    setSelectedYear('');
    setSelectedTerm('');
    setSelectedClass('');
    setSelectedSubject('');
  }, []);
  
  return {
    trades, academicYears, terms, classes, subjects, students,
    selectedTrade, setSelectedTrade,
    selectedYear, setSelectedYear,
    selectedTerm, setSelectedTerm,
    selectedClass, setSelectedClass,
    selectedSubject, setSelectedSubject,
    resetCascade
  };
}
```

### 9.2 Reusable Cascade Component

#### `frontend/src/components/CascadeSelector.jsx` (NEW)

```jsx
import { useCascade } from '../hooks/useCascade';

export default function CascadeSelector({ onChange, steps = ['trade', 'year', 'term', 'class', 'subject'] }) {
  const cascade = useCascade();
  
  useEffect(() => {
    onChange?.(cascade);
  }, [cascade.selectedTrade, cascade.selectedYear, cascade.selectedTerm, cascade.selectedClass, cascade.selectedSubject]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {steps.includes('trade') && (
        <div className="form-control">
          <label className="label"><span className="label-text">Trade / Department</span></label>
          <select className="select select-bordered" value={cascade.selectedTrade} onChange={e => cascade.setSelectedTrade(e.target.value)}>
            <option value="">Select Trade</option>
            {cascade.trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {steps.includes('year') && (
        <div className="form-control">
          <label className="label"><span className="label-text">Academic Year</span></label>
          <select className="select select-bordered" value={cascade.selectedYear} onChange={e => cascade.setSelectedYear(e.target.value)}>
            <option value="">Select Year</option>
            {cascade.academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
      )}
      {steps.includes('term') && cascade.terms.length > 0 && (
        <div className="form-control">
          <label className="label"><span className="label-text">Term</span></label>
          <select className="select select-bordered" value={cascade.selectedTerm} onChange={e => cascade.setSelectedTerm(e.target.value)}>
            <option value="">Select Term</option>
            {cascade.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {steps.includes('class') && cascade.classes.length > 0 && (
        <div className="form-control">
          <label className="label"><span className="label-text">Class</span></label>
          <select className="select select-bordered" value={cascade.selectedClass} onChange={e => cascade.setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {cascade.classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.level}</option>)}
          </select>
        </div>
      )}
      {steps.includes('subject') && cascade.subjects.length > 0 && (
        <div className="form-control">
          <label className="label"><span className="label-text">Subject</span></label>
          <select className="select select-bordered" value={cascade.selectedSubject} onChange={e => cascade.setSelectedSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {cascade.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
```

### 9.3 Pages Using Cascade

| Page | Cascade Steps Used |
|------|--------------------|
| Teacher Attendance | trade → year → term → class → subject → students |
| Teacher Marks Entry | trade → year → term → assessment → students |
| Admin Attendance | trade → year → term → class → subject |
| Admin Assessments | trade → subject → term |
| Admin Marks | assessment → students |
| Admin Report Cards | trade → term → generate |
| Admin Promotions | trade → year → from_class → to_class |
| Students Create | trade → class |
| Subjects Create | trade → class |

### 9.4 Files to Create
- `frontend/src/hooks/useCascade.js`
- `frontend/src/components/CascadeSelector.jsx`

### 9.5 Files to Modify
- All pages listed in the cascade table above

---

## PHASE 10: API Endpoint Summary (Complete)

### Authentication
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | No | - | Register new user |
| POST | `/auth/login` | No | - | Login (email + password) |
| POST | `/auth/students/login-pin` | No | - | Student login (admission_no + PIN) |
| POST | `/auth/logout` | Yes | Any | Logout |
| GET | `/auth/me` | Yes | Any | Get current user |
| PUT | `/auth/change-pin` | Yes | Student | Change own PIN |

### Dashboard
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/dashboard/admin` | Yes | Admin | Admin dashboard stats |
| GET | `/dashboard/teacher` | Yes | Teacher | Teacher dashboard stats |
| GET | `/dashboard/student` | Yes | Student | Student dashboard stats |

### Students
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/students` | Yes | Admin/Teacher | List students (filtered by role) |
| GET | `/students/:id` | Yes | Admin/Teacher/Self | Get student detail |
| POST | `/students` | Yes | Admin | Create student (auto ADM) |
| PUT | `/students/:id` | Yes | Admin/Self | Update student |
| DELETE | `/students/:id` | Yes | Admin | Soft delete student |
| PUT | `/students/:id/pin` | Yes | Self | Change PIN |

### Teachers
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/teachers` | Yes | Admin | List teachers |
| GET | `/teachers/:id` | Yes | Admin/Self | Get teacher detail |
| POST | `/teachers` | Yes | Admin | Create teacher |
| PUT | `/teachers/:id` | Yes | Admin | Update teacher |
| DELETE | `/teachers/:id` | Yes | Admin | Remove teacher |
| GET | `/teachers/:id/assignments` | Yes | Self | Get assigned classes/subjects |

### Classes
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/classes` | Yes | Any | List classes (filter by trade_id) |
| POST | `/classes` | Yes | Admin | Create class |
| PUT | `/classes/:id` | Yes | Admin | Update class |
| DELETE | `/classes/:id` | Yes | Admin | Delete class |

### Subjects
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/subjects` | Yes | Any | List subjects (filter by trade_id, class_id) |
| POST | `/subjects` | Yes | Admin | Create subject |
| PUT | `/subjects/:id` | Yes | Admin | Update subject |
| DELETE | `/subjects/:id` | Yes | Admin | Delete subject |

### Academic Years
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/academic-years` | Yes | Any | List academic years |
| POST | `/academic-years` | Yes | Admin | Create academic year |
| PUT | `/academic-years/:id` | Yes | Admin | Update |
| DELETE | `/academic-years/:id` | Yes | Admin | Delete |
| PUT | `/academic-years/:id/set-current` | Yes | Admin | Set as current year |

### Terms
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/terms` | Yes | Any | List terms (filter by academic_year_id) |
| POST | `/terms` | Yes | Admin | Create term |
| PUT | `/terms/:id` | Yes | Admin | Update |
| DELETE | `/terms/:id` | Yes | Admin | Delete |
| PUT | `/terms/:id/set-current` | Yes | Admin | Set as current term |

### Assessments
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/assessments` | Yes | Admin/Teacher | List assessments |
| POST | `/assessments` | Yes | Admin/Teacher | Create assessment |
| PUT | `/assessments/:id` | Yes | Admin/Teacher | Update |
| DELETE | `/assessments/:id` | Yes | Admin | Delete |

### Marks
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/marks` | Yes | Admin/Teacher/Student | List marks (filtered) |
| POST | `/marks/enter` | Yes | Teacher/Admin | Bulk enter marks |
| GET | `/marks/assessment/:id` | Yes | Teacher/Admin | Marks for assessment |
| GET | `/marks/student/:id` | Yes | Student/Self/Admin | Student's marks |

### Attendance
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/attendance` | Yes | Admin/Teacher/Student | List attendance (filtered) |
| POST | `/attendance/mark` | Yes | Teacher/Admin | Bulk mark attendance |
| GET | `/attendance/class/:classId` | Yes | Teacher/Admin | Attendance by class |
| GET | `/attendance/report` | Yes | Admin/Teacher | Attendance summary report |
| GET | `/attendance/student/:id` | Yes | Student/Self/Admin | Student's attendance |

### Report Cards
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/report-cards` | Yes | Admin/Student | List report cards |
| POST | `/report-cards/generate` | Yes | Admin | Generate for term |
| GET | `/report-cards/:id` | Yes | Admin/Self | Full report card data |

### Promotions
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/promotions` | Yes | Admin | List promotions |
| POST | `/promotions/promote` | Yes | Admin | Bulk promote students |
| GET | `/promotions/history` | Yes | Admin | Promotion history |

### Grading System
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/grading-system` | Yes | Any | List grades |
| POST | `/grading-system` | Yes | Admin | Create grade |
| PUT | `/grading-system/:id` | Yes | Admin | Update grade |
| DELETE | `/grading-system/:id` | Yes | Admin | Delete grade |

### Notifications
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/notifications` | Yes | Any | List own notifications |
| POST | `/notifications/send` | Yes | Admin | Send notification |
| PUT | `/notifications/:id/read` | Yes | Owner | Mark as read |
| PUT | `/notifications/read-all` | Yes | Owner | Mark all as read |
| DELETE | `/notifications/:id` | Yes | Admin/Owner | Delete |

### Trades
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/trades` | Yes | Any | List trades |
| POST | `/trades` | Yes | Admin | Create trade |
| PUT | `/trades/:id` | Yes | Admin | Update trade |
| DELETE | `/trades/:id` | Yes | Admin | Delete trade |

### Users
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | Yes | Admin | List users |
| GET | `/users/profile` | Yes | Any | Own profile |
| PUT | `/users/profile` | Yes | Any | Update own profile |
| GET | `/users/:id` | Yes | Admin | Get user |
| PUT | `/users/:id/role` | Yes | Admin | Change role |
| PUT | `/users/:id/toggle-active` | Yes | Admin | Toggle active |
| DELETE | `/users/:id` | Yes | Admin | Delete user |

---

## PHASE 11: Implementation Order & Dependencies

### Execution Sequence

```
Phase 1  ──→ Phase 2  ──→ Phase 3  ──→ Phase 4/5 (parallel)
  │            │            │            │
  │            │            │         Phase 6 (admin CRUD)
  │            │            │            │
  │            │            │         Phase 7 (report card PDF)
  │            │            │            │
  │            │            │         Phase 8 (UI/UX)
  │            │            │            │
  │            │            │         Phase 9 (cascade)
  │            │            │
  └────────────┴────────────┴── Backend must be done first
```

**Critical Path:**
1. **Phase 1** (DB migrations) — must be first, no dependencies
2. **Phase 2** (Backend restructuring) — depends on Phase 1
3. **Phase 3** (Auth + RBAC) — depends on Phase 2
4. **Phase 4** (Student portal) — depends on Phase 3
5. **Phase 5** (Teacher portal) — depends on Phase 3, can parallel with Phase 4
6. **Phase 6** (Admin CRUD) — depends on Phase 2, can start after Phase 2
7. **Phase 7** (PDF) — depends on Phase 6 (report cards must work)
8. **Phase 8** (UI/UX) — can start after Phase 3, iterate throughout
9. **Phase 9** (Cascade) — depends on Phases 4, 5, 6

### Estimated Effort

| Phase | Scope | Est. Files | Priority |
|-------|-------|-----------|----------|
| 1 - DB Schema | 2 new files, 2 modified | 4 | P0 |
| 2 - Backend | ~30 new controllers/routes, 5 modified | 35 | P0 |
| 3 - Auth + RBAC | 1 new, 6 modified | 7 | P0 |
| 4 - Student Portal | 7 new, 2 modified | 9 | P1 |
| 5 - Teacher Portal | 6 new, 2 modified | 8 | P1 |
| 6 - Admin CRUD | 0 new, 10 modified | 10 | P1 |
| 7 - PDF | 3 new | 3 | P2 |
| 8 - UI/UX | 2 new, ~15 modified | 17 | P2 |
| 9 - Cascade | 2 new, ~8 modified | 10 | P2 |

---

## Known Bugs to Fix

1. **`Settings.jsx:43`** — `fetchSubjects()` undefined → replace with `fetchTrades()`
2. **`Settings.jsx:110`** — `LoaderPinwheelIcon` not imported → use `Loader2` from lucide-react
3. **`student.controller.js:96`** — `nationality VARCHAR(30) NOT NULL` but `createStudent` doesn't include it → add to INSERT or make nullable
4. **`GenericCrud.jsx`** — Dead code, never imported → either integrate or remove
5. **`StepsIndicator.jsx`** — Dead code, never imported → either integrate or remove
6. **`tailwind.config.js`** — DaisyUI not in plugins array → verify v5 auto-detection works, add explicitly if not
7. **Authorization middleware** — Defined but never used on routes → wire up in Phase 3

---

## Migration Strategy

### Backward Compatibility

During the transition from generic CRUD (`/data/:table`) to per-table routes:

1. **Keep generic CRUD active** but restrict to admin only
2. **Mount new per-table routes alongside** generic routes
3. **Update frontend incrementally** — page by page, switch from `/data/students` to `/students`
4. **Remove generic routes** only after all frontend pages are migrated

```javascript
// routes/index.js — during transition
sramsRoutes.use('/data', authenticate, authorize('Administrator'), dataRouter); // Legacy
sramsRoutes.use('/students', studentRouter); // New
// ... other new routes
```

### Database Migration

1. Run `runMigrations.js` during startup (add to startupLoader.js after schema init)
2. Migrations are idempotent (IF NOT EXISTS)
3. Track applied migrations in `schema_migrations` table
4. Never modify existing migration files — create new ones for changes
