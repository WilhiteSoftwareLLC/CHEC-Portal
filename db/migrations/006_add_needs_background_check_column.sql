-- Add needsBackgroundCheck column to families table
ALTER TABLE families ADD COLUMN needs_background_check BOOLEAN NOT NULL DEFAULT FALSE;