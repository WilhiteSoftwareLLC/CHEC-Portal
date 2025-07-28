-- Add alternate hour columns for clerical tracking
-- These columns are for recording student alternate choices when first choices are full

ALTER TABLE students 
ADD COLUMN third_hour_2 VARCHAR(255),
ADD COLUMN fifth_hour_2 VARCHAR(255);

-- Add comments to document purpose
COMMENT ON COLUMN students.third_hour_2 IS 'Alternate choice for 3rd hour when first choice is full';
COMMENT ON COLUMN students.fifth_hour_2 IS 'Alternate choice for 5th hour when first choice is full';