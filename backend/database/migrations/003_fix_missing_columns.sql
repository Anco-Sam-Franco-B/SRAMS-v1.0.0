-- Migration 003: Fix missing columns from partial migration 001
-- All operations are idempotent

-- Add user_id to students
DO $$ BEGIN
    ALTER TABLE students ADD COLUMN user_id UUID REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Make nationality nullable
DO $$ BEGIN
    ALTER TABLE students ALTER COLUMN nationality DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- Add last_login tracking to users
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add created_at to attendance
DO $$ BEGIN
    ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add created_at to assessments
DO $$ BEGIN
    ALTER TABLE assessments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_pin_locked ON students(pin_locked_until);

-- Unique constraint for marks upsert (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'marks_assessment_student_unique'
    ) THEN
        ALTER TABLE marks ADD CONSTRAINT marks_assessment_student_unique UNIQUE (assessment_id, student_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
