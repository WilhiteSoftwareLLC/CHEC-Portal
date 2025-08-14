-- Create bill_adjustments table for tracking credits and additional charges
-- This table allows administrators to add adjustments to family bills

CREATE TABLE bill_adjustments (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    adjustment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster family-based queries
CREATE INDEX idx_bill_adjustments_family_id ON bill_adjustments(family_id);

-- Create index for adjustment date queries
CREATE INDEX idx_bill_adjustments_adjustment_date ON bill_adjustments(adjustment_date);

-- Add comments to document purpose
COMMENT ON TABLE bill_adjustments IS 'Credits and additional charges applied to family invoices';
COMMENT ON COLUMN bill_adjustments.family_id IS 'Reference to the family receiving the adjustment';
COMMENT ON COLUMN bill_adjustments.amount IS 'Adjustment amount (positive for charges, negative for credits)';
COMMENT ON COLUMN bill_adjustments.description IS 'Description of the adjustment reason';
COMMENT ON COLUMN bill_adjustments.adjustment_date IS 'Date the adjustment was applied';