/**
 * Google OAuth 2.0 Authentication Handler
 *
 * This module handles USER authentication via Google OAuth.
 * It does NOT handle Vertex AI access - that uses service account credentials.
 */

import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';
import { randomBytes } from 'crypto';
import { type User } from '@shared/schema';

/**
 * Get the OAuth redirect URI based on the current environment
 * - In development (Replit): Use the Replit dev URL
 * - In production: Use the configured production URL
 */
function getRedirectUri(): string {
  // Check if we're running on Replit (development environment)
  const replitDomain = process.env.REPLIT_DOMAINS;
  
  if (replitDomain) {
    // Use Replit development URL
    return `https://${replitDomain}/auth/google/callback`;
  }
  
  // Use production URL from environment variable
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

// Session token storage
interface SessionData {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const sessions = new Map<string, SessionData>();

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

    // Create session token
    const token = generateSessionToken();
    const session: SessionData = {
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    sessions.set(token, session);

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
  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  // Check if session expired
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }

  // Get user
  const user = await storage.getUser(session.userId);
  if (!user) {
    sessions.delete(token);
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Logout session and clear token
 */
export function logoutSession(token: string): void {
  sessions.delete(token);
  console.log(`Session logged out`);
}

/**
 * Get all active sessions (for debugging)
 */
export function getActiveSessions(): number {
  return sessions.size;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(): void {
  const now = new Date();
  const expiredTokens: string[] = [];
  sessions.forEach((session, token) => {
    if (session.expiresAt < now) {
      expiredTokens.push(token);
    }
  });
  expiredTokens.forEach(token => sessions.delete(token));
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
