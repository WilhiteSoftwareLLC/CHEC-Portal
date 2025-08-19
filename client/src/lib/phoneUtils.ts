/**
 * Phone number utility functions for standardized handling
 */

/**
 * Formats a phone number for display as XXX-XXX-XXXX
 * @param phone - Raw phone number (may contain formatting)
 * @returns Formatted phone number or empty string if invalid
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX if we have exactly 10 digits
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  
  // Return original if not 10 digits
  return phone;
}

/**
 * Parses a phone number for storage as a 10-digit string
 * @param phone - Phone number with or without formatting
 * @returns 10-digit string or null if invalid
 */
export function parsePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Return 10-digit string if valid, null otherwise
  if (digits.length === 10) {
    return digits;
  }
  
  return null;
}

/**
 * Validates if a phone number is valid (exactly 10 digits when cleaned)
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Normalizes a phone number for database storage
 * @param phone - Phone number with or without formatting
 * @returns 10-digit string for storage, or empty string if invalid
 */
export function normalizePhoneNumber(phone: string): string {
  const parsed = parsePhoneNumber(phone);
  return parsed || '';
}