-- Create payments table for tracking family payments
-- This table replaces the simple paid/unpaid status with detailed payment records

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster family-based queries
CREATE INDEX idx_payments_family_id ON payments(family_id);

-- Create index for payment date queries
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- Add comments to document purpose
COMMENT ON TABLE payments IS 'Records of payments made by families toward their invoices';
COMMENT ON COLUMN payments.family_id IS 'Reference to the family that made the payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount in dollars';
COMMENT ON COLUMN payments.payment_date IS 'Date the payment was received';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment (cash, check, card, etc.)';
COMMENT ON COLUMN payments.description IS 'Optional notes about the payment';