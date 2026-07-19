-- Migration 001: Add student PIN authentication and portal support fields

-- Add PIN fields to students for PIN-based login
DO $$ BEGIN
    ALTER TABLE students ADD COLUMN pin_hash TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE students ADD COLUMN pin_changed_at TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE students ADD COLUMN pin_attempts INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE students ADD COLUMN pin_locked_until TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add user_id to students
DO $$ BEGIN
    ALTER TABLE students ADD COLUMN user_id UUID REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_pin_locked ON students(pin_locked_until);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
