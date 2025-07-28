-- Migration: Update courses table to replace classId with fromGrade and toGrade
-- Remove the classId column and add fromGrade and toGrade columns

ALTER TABLE courses 
DROP COLUMN IF EXISTS class_id;

ALTER TABLE courses 
ADD COLUMN from_grade INTEGER,
ADD COLUMN to_grade INTEGER;

-- Add foreign key constraints to reference grades table
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_from_grade 
FOREIGN KEY (from_grade) REFERENCES grades(code);

ALTER TABLE courses 
ADD CONSTRAINT fk_courses_to_grade 
FOREIGN KEY (to_grade) REFERENCES grades(code);