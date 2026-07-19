-- Migration 004: Enterprise SRAMS Schema Expansion
-- Adds: 15-role RBAC, school profile, audit logs, sessions, timetable,
--        marks workflow, report card enhancements, discipline, medical,
--        certificates, competencies, transfers, and more.

-- ============================================================
-- 1. EXPANDED ROLES (15 roles)
-- ============================================================
INSERT INTO roles(name)
SELECT v FROM (VALUES
  ('Administrator'),
  ('School Administrator'),
  ('Head Teacher'),
  ('Deputy Head Teacher'),
  ('Director of Studies'),
  ('Teacher'),
  ('Class Teacher'),
  ('Student'),
  ('Parent'),
  ('Finance Officer'),
  ('Registrar'),
  ('Librarian'),
  ('Discipline Officer'),
  ('Examination Officer'),
  ('System Auditor')
) t(v)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. SCHOOL PROFILE
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

-- Insert default school profile
INSERT INTO school_profile(name) VALUES ('SRAMS School') ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. USER PROFILE EXTENSIONS
-- ============================================================
DO $$ BEGIN ALTER TABLE users ADD COLUMN phone VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN avatar_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
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
-- 4. PASSWORD HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. AUDIT LOGS
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
-- 6. SESSION MANAGEMENT
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
-- 7. OTP CODES
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
-- 8. STUDENT EXTENSIONS
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
-- 9. TEACHER EXTENSIONS
-- ============================================================
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN employee_no VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN qualification VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN specialization VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN phone VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE teachers ADD COLUMN date_joined DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- 10. STREAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  head_teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. CLASSROOMS
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
-- 13. TIMETABLE
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
-- 14. MARKS WORKFLOW (approval chain columns)
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
-- 15. REPORT CARD ENHANCEMENTS
-- ============================================================
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN grade VARCHAR(5); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN division VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN gpa NUMERIC(4,2); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN head_teacher_comment TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN published BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN published_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE report_cards ADD COLUMN academic_year_id UUID REFERENCES academic_years(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- 16. SUBJECT COMBINATIONS
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
-- 17. STUDENT TRANSFERS
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
-- 18. DISCIPLINE RECORDS
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
-- 19. MEDICAL RECORDS
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
-- 20. COMPETENCIES
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
-- 21. CERTIFICATES
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
-- 22. STUDENT DOCUMENTS
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
-- 23. REPORT CARD TEMPLATES
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

-- Insert default template
INSERT INTO report_card_templates(name, is_default, template_config)
VALUES ('National Format', true, '{"includeLogo":true,"includeWatermark":false,"includeQRCode":true,"includeBarcode":false,"includeAttendance":true,"includeCompetencies":true,"includeHeadTeacherSignature":true,"showGrades":true,"format":"national","colors":{"primary":"#1e40af","secondary":"#059669"}}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 24. INDEXES
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
