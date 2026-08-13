-- Rollback: Merge exam and zachet tables back into academic_performance
-- This migration drops the split tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_zachet_discipline;
DROP INDEX IF EXISTS idx_zachet_student;
DROP INDEX IF EXISTS idx_exam_discipline;
DROP INDEX IF EXISTS idx_exam_student;

-- Drop tables (data will be lost as it was migrated to these tables)
DROP TABLE IF EXISTS zachet;
DROP TABLE IF EXISTS exam;
