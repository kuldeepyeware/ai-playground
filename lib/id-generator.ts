/**
 * Generate a unique ID for use in the database
 * Uses crypto.randomUUID() which is compatible with Prisma's string ID fields
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
