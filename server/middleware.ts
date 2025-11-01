/**
 * Authentication Middleware
 *
 * Middleware to protect routes requiring user authentication
 * Supports both Email/Password and Google OAuth authentication
 */

import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from './auth';
import { verifySessionToken as verifyEmailSessionToken } from './emailAuth';
import { type User } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Require authentication middleware
 * Checks if user has valid session via Authorization header or cookie
 * Works with both Email/Password and Google OAuth sessions
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie (unified auth_token for both methods)
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    // Try to verify token with both auth methods
    let user = await verifySessionToken(token);
    if (!user) {
      user = await verifyEmailSessionToken(token);
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        message: 'Please log in again',
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message,
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't block if not
 * Works with both Email/Password and Google OAuth sessions
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      // Try both auth methods
      let user = await verifySessionToken(token);
      if (!user) {
        user = await verifyEmailSessionToken(token);
      }

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't block on error for optional auth
    next();
  }
}
