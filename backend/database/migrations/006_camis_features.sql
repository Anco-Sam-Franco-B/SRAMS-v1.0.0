-- Migration 006: CAMIS Features
-- Creates new tables for CAMIS-specific functionality

-- Exam Distribution
CREATE TABLE IF NOT EXISTS exam_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  academic_year_id UUID REFERENCES academic_years(id),
  term_id UUID REFERENCES terms(id),
  total_marks INT DEFAULT 100,
  duration_minutes INT,
  status VARCHAR(30) DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_paper_id UUID REFERENCES exam_papers(id),
  classroom_id UUID REFERENCES classrooms(id),
  distributed_to UUID REFERENCES users(id),
  distributed_at TIMESTAMP,
  returned_at TIMESTAMP,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Management
CREATE TABLE IF NOT EXISTS curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curriculum(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  material_type VARCHAR(50),
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Imihigo (Performance Contracts)
CREATE TABLE IF NOT EXISTS imihigo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_value NUMERIC(10,2),
  actual_value NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'active',
  period VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imihigo_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imihigo_id UUID REFERENCES imihigo(id) ON DELETE CASCADE,
  title VARCHAR(200),
  video_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submission Progress (SEI/District)
CREATE TABLE IF NOT EXISTS submission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(200) NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id),
  term_id UUID REFERENCES terms(id),
  total_items INT DEFAULT 0,
  submitted_items INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Card Verification
CREATE TABLE IF NOT EXISTS report_card_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID REFERENCES report_cards(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  status VARCHAR(30) DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Performance Audit
CREATE TABLE IF NOT EXISTS teacher_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id),
  term_id UUID REFERENCES terms(id),
  avg_student_marks NUMERIC(5,2),
  attendance_rate NUMERIC(5,2),
  completion_rate NUMERIC(5,2),
  rating VARCHAR(20),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_papers_subject ON exam_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_papers_class ON exam_papers(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_papers_year ON exam_papers(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_exam_distributions_paper ON exam_distributions(exam_paper_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subject ON curriculum(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_class ON curriculum(class_id);
CREATE INDEX IF NOT EXISTS idx_imihigo_status ON imihigo(status);
CREATE INDEX IF NOT EXISTS idx_submission_progress_entity ON submission_progress(entity_type);
CREATE INDEX IF NOT EXISTS idx_teacher_performance_teacher ON teacher_performance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
