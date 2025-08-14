/**
 * Browser-compatible version of invoice utilities
 */

/**
 * Generate a short hash from a family ID for secure invoice links using Web Crypto API
 */
export async function generateFamilyHash(familyId: number): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(familyId.toString());
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string and take first 8 characters
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return hashHex.substring(0, 8);
}

/**
 * Find the family ID that matches a given hash by checking all family IDs
 */
export async function findFamilyIdByHash(hash: string, familyIds: number[]): Promise<number | null> {
  for (const familyId of familyIds) {
    const familyHash = await generateFamilyHash(familyId);
    if (familyHash === hash) {
      return familyId;
    }
  }
  return null;
}