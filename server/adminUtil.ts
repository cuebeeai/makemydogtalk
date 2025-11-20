/**
 * Admin Utility Functions
 * Handles admin user checks and permissions
 */

// Admin email addresses - only these users have admin privileges
const ADMIN_EMAILS = ['jeff@cuebee.ai'];

/**
 * Check if an email address belongs to an admin
 */
export function isAdmin(email: string): boolean {
  console.log('[isAdmin] Checking email:', email);
  console.log('[isAdmin] Admin emails list:', ADMIN_EMAILS);
  console.log('[isAdmin] Lowercased email:', email.toLowerCase());
  const result = ADMIN_EMAILS.includes(email.toLowerCase());
  console.log('[isAdmin] Result:', result);
  return result;
}

/**
 * Check if a user ID belongs to an admin
 * This requires looking up the user's email from the database
 */
export async function isAdminById(userId: string, db: any): Promise<boolean> {
  try {
    const { users } = await import('../shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (result.length === 0) {
      return false;
    }

    return isAdmin(result[0].email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get list of admin emails
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
