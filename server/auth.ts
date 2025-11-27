/**
 * Google OAuth 2.0 Authentication Handler
 *
 * This module handles USER authentication via Google OAuth.
 * It does NOT handle Vertex AI access - that uses service account credentials.
 */

import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage.js';
import { randomBytes } from 'crypto';
import { type User } from '../shared/schema.js';
import { db } from './db.js';
import { sessions } from '../shared/schema.js';
import { eq, lt } from 'drizzle-orm';

/**
 * Get the OAuth redirect URI based on the current environment
 * Uses the configured OAUTH_REDIRECT_URI from environment variables
 * Defaults to localhost for local development
 */
function getRedirectUri(): string {
  return process.env.OAUTH_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';
}

// Initialize OAuth2 client with credentials from environment
const redirectUri = getRedirectUri();
console.log(`✅ OAuth redirect URI configured: ${redirectUri}`);

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate the Google OAuth authorization URL
 * This is where we send users to log in with Google
 */
export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens and user info
 * Called when Google redirects back to our callback URL
 */
export async function handleOAuthCallback(code: string): Promise<{ user: User; token: string }> {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Failed to get user payload from ID token');
    }

    // Check if user exists
    let user = await storage.getUserByGoogleId(payload.sub);

    if (!user) {
      // Check if user exists with this email (for account linking)
      const existingEmailUser = await storage.getUserByEmail(payload.email!);

      if (existingEmailUser && !existingEmailUser.googleId) {
        // Link Google account to existing email/password account
        user = await storage.updateUser(existingEmailUser.id, {
          googleId: payload.sub,
          picture: payload.picture,
          lastLogin: new Date(),
        });
      } else if (existingEmailUser) {
        // User already exists with Google
        user = existingEmailUser;
      } else {
        // Create new user
        user = await storage.createOAuthUser({
          email: payload.email!,
          googleId: payload.sub,
          name: payload.name!,
          picture: payload.picture,
        });
      }
    } else {
      // Update last login
      const updatedUser = await storage.updateUser(user.id, { lastLogin: new Date() });
      if (updatedUser) {
        user = updatedUser;
      }
    }

    // At this point, user should always be defined due to the logic above
    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Create session token and store in database
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(sessions).values({
      token,
      userId: user.id,
      expiresAt,
    });

    console.log(`User logged in via Google: ${user.email}`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
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
 * Logout session and clear token
 */
export async function logoutSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
  console.log(`Session logged out`);
}

/**
 * Get all active sessions (for debugging)
 */
export async function getActiveSessions(): Promise<number> {
  const allSessions = await db.select().from(sessions);
  return allSessions.length;
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
