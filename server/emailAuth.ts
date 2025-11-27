/**
 * Email/Password Authentication Handler
 * Traditional signup and login with bcrypt password hashing
 */

import bcrypt from 'bcrypt';
import { storage } from './storage.js';
import { type User, insertUserSchema } from '../shared/schema.js';
import { randomBytes } from 'crypto';
import { db } from './db.js';
import { sessions } from '../shared/schema.js';
import { eq, lt } from 'drizzle-orm';

const SALT_ROUNDS = 10;

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new user with email and password
 */
export async function signupWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; token: string }> {
  // Validate input
  const validation = insertUserSchema.safeParse({ email, password, name });
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await storage.createUser({
    email,
    password: hashedPassword,
    name,
  });

  // Create session and store in database
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    token,
    userId: user.id,
    expiresAt,
  });

  console.log(`New user registered: ${email}`);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User, token };
}

/**
 * Login with email and password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  // Find user by email
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user has a password (not OAuth user)
  if (!user.password) {
    throw new Error('This account uses Google sign-in. Please log in with Google.');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await storage.updateUser(user.id, { lastLogin: new Date() });

  // Create session and store in database
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    token,
    userId: user.id,
    expiresAt,
  });

  console.log(`User logged in: ${email}`);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User, token };
}

/**
 * Verify session token and get user
 */
export async function verifySessionToken(token: string): Promise<User | null> {
  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionResult.length === 0) {
    return null;
  }

  const session = sessionResult[0];

  // Check if session expired
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  // Get user
  const user = await storage.getUser(session.userId);
  if (!user) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Logout and invalidate session
 */
export async function logoutSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
  console.log(`Session logged out`);
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  console.log('Cleaned up expired sessions');
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
