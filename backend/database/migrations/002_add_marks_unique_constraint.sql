-- Migration 002: Add unique constraint on marks and created_at to assessments

-- Add unique constraint for marks upsert
DO $$ BEGIN
    ALTER TABLE marks ADD CONSTRAINT marks_assessment_student_unique UNIQUE (assessment_id, student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add created_at to assessments
DO $$ BEGIN
    ALTER TABLE assessments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
