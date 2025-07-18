-- Migration to remove fridayScience column from students table
-- This migration removes the Friday Science functionality from the system

-- Remove the fridayScience column from the students table
ALTER TABLE students DROP COLUMN IF EXISTS friday_science;

-- Note: This migration is irreversible. If you need to rollback,
-- you would need to add the column back and restore data from backups.
