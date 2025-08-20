import type { Family, Payment, BillAdjustment } from "./schema";

// Data structures for invoice service
export interface InvoiceCalculation {
  totalAmount: number;        // Base total after adjustments
  totalPaid: number;         // Sum of all payments
  balance: number;           // totalAmount - totalPaid
  paypalFee?: number;        // Only when PayPal calculation requested
  totalWithPayPal?: number;  // Only when PayPal calculation requested
  balanceWithPayPal?: number; // Only when PayPal calculation requested
}

export interface InvoiceRow {
  studentName?: string;  // For student-specific items
  grade?: string;        // Student's grade level
  hour?: string;         // Time slot (e.g., "1st Hour", "Math Hour")
  courseName?: string;   // Course name
  itemType: 'family' | 'student' | 'course' | 'book' | 'background' | 'adjustment' | 'paypal';
  itemDescription: string; // Human-readable description
  fee: number;
}

export interface FamilyInvoice {
  family: Family;
  calculation: InvoiceCalculation;
  invoiceRows: InvoiceRow[];
  payments: Payment[];
  billAdjustments: BillAdjustment[];
}

export interface InvoiceSummary {
  familyId: number;
  lastName: string;
  father?: string;
  mother?: string;
  needsBackgroundCheck: boolean;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  lastPaymentDate?: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overpaid';
}

export interface PayPalCalculation {
  paypalFee: number;
  totalWithPayPal: number;
  balanceWithPayPal: number;
}