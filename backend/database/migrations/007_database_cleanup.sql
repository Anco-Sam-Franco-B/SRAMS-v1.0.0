-- Migration 007: Database Cleanup
-- Drop tables not needed for CAMIS functionality

-- Drop library tables (replaced by CAMIS curriculum module)
DROP TABLE IF EXISTS library_transactions CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;

-- Drop finance tables (not in CAMIS scope)
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;

-- Drop student documents (replaced by file_uploads)
DROP TABLE IF EXISTS student_documents CASCADE;

-- Drop student transfers (not in CAMIS scope)
DROP TABLE IF EXISTS student_transfers CASCADE;

-- Drop medical records (not in CAMIS scope)
DROP TABLE IF EXISTS medical_records CASCADE;

-- Drop discipline records (not in CAMIS scope)
DROP TABLE IF EXISTS discipline_records CASCADE;

-- Drop combination tables (simplified in CAMIS)
DROP TABLE IF EXISTS combination_subjects CASCADE;
DROP TABLE IF EXISTS subject_combinations CASCADE;
