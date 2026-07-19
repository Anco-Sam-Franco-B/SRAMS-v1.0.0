-- ============================================================
-- SRAMS PostgreSQL Database Schema
-- Student Records and Academics Management System
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'attendance_status'
    ) THEN
        CREATE TYPE attendance_status AS ENUM (
            'PRESENT',
            'ABSENT',
            'LATE',
            'EXCUSED',
            'UNEXCUSED',
            'EARLY_LEAVE',
            'HALF_DAY',
            'SICK',
            'ON_LEAVE',
            'SUSPENDED',
            'NOT_MARKED'
        );
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS roles(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(50) UNIQUE NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 code VARCHAR(50) UNIQUE NOT NULL,
 name VARCHAR(50) UNIQUE NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 role_id UUID REFERENCES roles(id),
 first_name VARCHAR(100) NOT NULL,
 last_name VARCHAR(100) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 is_active BOOLEAN DEFAULT TRUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_years(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(50) UNIQUE NOT NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 is_current BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS terms(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
 name VARCHAR(50) NOT NULL,
 start_date DATE,
 end_date DATE,
 is_current BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS classes(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 name VARCHAR(100) NOT NULL,
 level VARCHAR(50),
 capacity INT NOT NULL
);

CREATE TABLE IF NOT EXISTS admission_sequences (
    id SERIAL PRIMARY KEY,
    admission_year INT UNIQUE NOT NULL,
    last_number INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS students(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 admission_no VARCHAR(50) UNIQUE NOT NULL,
 class_id UUID REFERENCES classes(id),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 first_name VARCHAR(100) NOT NULL,
 last_name VARCHAR(100) NOT NULL,
 email VARCHAR(255) UNIQUE,
 is_active BOOLEAN DEFAULT TRUE,
 gender VARCHAR(20),
 country VARCHAR(50),
 nationality VARCHAR(30) NOT NULL,
 phone VARCHAR(20),
 date_of_birth DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
 code VARCHAR(20) UNIQUE,
 name VARCHAR(100) NOT NULL,
 weight NUMERIC(6,2) NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS teachers(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) UNIQUE
);

CREATE TABLE IF NOT EXISTS teacher_subjects(
 teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
 subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 class_id UUID REFERENCES classes(id),
 PRIMARY KEY(teacher_id,subject_id,class_id)
);

CREATE TABLE IF NOT EXISTS assessments(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
 subject_id UUID REFERENCES subjects(id),
 term_id UUID REFERENCES terms(id),
 title VARCHAR(150),
 total_marks NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS grading_system(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 grade VARCHAR(5),
 min_mark NUMERIC(5,2),
 max_mark NUMERIC(5,2),
 remarks VARCHAR(140)
);

CREATE TABLE IF NOT EXISTS marks(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
 assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
 student_id UUID REFERENCES students(id) ON DELETE CASCADE,
 marks NUMERIC(6,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 student_id UUID REFERENCES students(id) ON DELETE CASCADE,
 teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
 class_id UUID REFERENCES classes(id),
 term_id UUID REFERENCES terms(id),
 subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
 attendance_date DATE NOT NULL,
 status attendance_status NOT NULL,
 UNIQUE(student_id,attendance_date)
);

CREATE TABLE IF NOT EXISTS report_cards(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id UUID REFERENCES students(id),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 term_id UUID REFERENCES terms(id),
 total_marks NUMERIC(10,2),
 average NUMERIC(5,2),
 position INTEGER,
 teacher_comment TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_promotions(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 student_id UUID REFERENCES students(id),
 from_class UUID REFERENCES classes(id),
 to_class UUID REFERENCES classes(id),
 academic_year_id UUID REFERENCES academic_years(id),
 status VARCHAR(30),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
 title VARCHAR(255),
 message TEXT,
 is_read BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS database_backups(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    backup_type VARCHAR(50) DEFAULT 'DAILY',
    status VARCHAR(30) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_adm ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ============================================================
-- EXPANDED ROLES (15 roles)
-- ============================================================
INSERT INTO roles(name)
SELECT v FROM (VALUES
  ('Administrator'),('School Administrator'),('Head Teacher'),
  ('Deputy Head Teacher'),('Director of Studies'),('Teacher'),
  ('Class Teacher'),('Student'),('Parent'),('Finance Officer'),
  ('Registrar'),('Librarian'),('Discipline Officer'),
  ('Examination Officer'),('System Auditor')
) t(v)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SCHOOL PROFILE
-- ============================================================
CREATE TABLE IF NOT EXISTS school_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  motto VARCHAR(500),
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  district VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Rwanda',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USER EXTENSIONS
-- ============================================================
DO $$ BEGIN ALTER TABLE users ADD COLUMN phone VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN avatar_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN locked_until TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN refresh_token TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN verification_token TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN reset_token TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN two_factor_secret TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'email'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN linked_student_id UUID REFERENCES students(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- PASSWORD HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SESSION MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  device_info TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- OTP CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(30) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENT EXTENSIONS
-- ============================================================
DO $$ BEGIN ALTER TABLE students ADD COLUMN photo_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN stream VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN guardian_name VARCHAR(200); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN guardian_phone VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN guardian_email VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN guardian_relationship VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN medical_conditions TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN blood_group VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN barcode VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN qr_code TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN graduation_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE students ADD COLUMN is_graduated BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- TEACHER EXTENSIONS
-- ============================================================
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN employee_no VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN qualification VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN specialization VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN phone VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN date_joined DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- STREAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  head_teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CLASSROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  capacity INT,
  building VARCHAR(100),
  room_type VARCHAR(50) DEFAULT 'classroom',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TIMETABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teachers(id),
  classroom_id UUID REFERENCES classrooms(id),
  academic_year_id UUID REFERENCES academic_years(id),
  term_id UUID REFERENCES terms(id),
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MARKS WORKFLOW
-- ============================================================
DO $$ BEGIN ALTER TABLE marks ADD COLUMN status VARCHAR(30) DEFAULT 'draft'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN submitted_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN submitted_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN verified_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN verified_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN approved_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN approved_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN head_approved_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN head_approved_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN is_locked BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN unlocked_by UUID REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marks ADD COLUMN unlocked_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- REPORT CARD ENHANCEMENTS
-- ============================================================
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN grade VARCHAR(5); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN division VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN gpa NUMERIC(4,2); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN head_teacher_comment TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN published BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN published_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN academic_year_id UUID REFERENCES academic_years(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- SUBJECT COMBINATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  trade_id UUID REFERENCES trade(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combination_subjects (
  combination_id UUID REFERENCES subject_combinations(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY(combination_id, subject_id)
);

-- ============================================================
-- STUDENT TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  from_school VARCHAR(200),
  to_school VARCHAR(200),
  from_class UUID REFERENCES classes(id),
  to_class UUID REFERENCES classes(id),
  transfer_date DATE,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DISCIPLINE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS discipline_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100),
  description TEXT,
  action_taken TEXT,
  reported_by UUID REFERENCES users(id),
  parent_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MEDICAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  condition_name VARCHAR(200),
  diagnosis TEXT,
  treatment TEXT,
  medication TEXT,
  emergency_contact VARCHAR(30),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COMPETENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN ALTER TABLE marks ADD COLUMN competency_id UUID REFERENCES competencies(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  certificate_type VARCHAR(100),
  certificate_number VARCHAR(100) UNIQUE,
  issued_date DATE,
  issued_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENT DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  document_type VARCHAR(100),
  file_name VARCHAR(255),
  file_path TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REPORT CARD TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS report_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  template_config JSONB,
  header_html TEXT,
  footer_html TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ADDITIONAL INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_marks_status ON marks(status);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetables(class_id, academic_year_id, term_id);
CREATE INDEX IF NOT EXISTS idx_discipline_student ON discipline_records(student_id);
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_student ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_transfers_student ON student_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_medical_student ON medical_records(student_id);
