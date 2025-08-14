import crypto from 'crypto';

/**
 * Generate a short hash from a family ID for secure invoice links
 */
export function generateFamilyHash(familyId: number): string {
  return crypto.createHash('sha256')
    .update(familyId.toString())
    .digest('hex')
    .substring(0, 8);
}

/**
 * Find the family ID that matches a given hash by checking all family IDs
 */
export function findFamilyIdByHash(hash: string, familyIds: number[]): number | null {
  for (const familyId of familyIds) {
    if (generateFamilyHash(familyId) === hash) {
      return familyId;
    }
  }
  return null;
}