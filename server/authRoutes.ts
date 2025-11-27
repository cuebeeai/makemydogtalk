/**
 * Unified Authentication Routes
 * Handles both Email/Password and Google OAuth authentication
 */

import { Router, Request, Response } from 'express';
import { signupWithEmail, loginWithEmail } from './emailAuth.js';
import { getAuthUrl, handleOAuthCallback } from './auth.js';

const router = Router();

// ========================================
// EMAIL/PASSWORD AUTHENTICATION
// ========================================

/**
 * POST /auth/signup
 * Create new account with email and password
 */
router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, password, and name are required',
      });
    }

    const { user, token } = await signupWithEmail(email, password, name);

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.makemydogtalk.com' : undefined,
    });

    res.json({
      success: true,
      user,
      token,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('[Signup Error]', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Signup failed',
    });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    const { user, token } = await loginWithEmail(email, password);

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.makemydogtalk.com' : undefined,
    });

    res.json({
      success: true,
      user,
      token,
      message: 'Logged in successfully',
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

// ========================================
// GOOGLE OAUTH AUTHENTICATION
// ========================================

/**
 * GET /auth/google
 * Start OAuth flow - redirects to Google OAuth
 */
router.get('/auth/google', (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl();
    // Directly redirect to Google OAuth
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).send(`Authentication error: ${error.message}`);
  }
});

async function processOAuthCallback(req: Request, res: Response) {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'OAuth authentication failed',
        details: error,
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
      });
    }

    // Exchange code for tokens and create/get user
    const { user, token } = await handleOAuthCallback(code);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.makemydogtalk.com' : undefined,
    };

    console.log('[OAuth] Setting cookie with options:', {
      ...cookieOptions,
      tokenLength: token.length,
      userEmail: user.email,
    });

    // Set httpOnly cookie
    res.cookie('auth_token', token, cookieOptions);

    console.log('[OAuth] Redirecting to /?auth=success');

    // Redirect to frontend with success
    res.redirect(`/?auth=success`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message,
    });
  }
}

/**
 * GET /auth/google/callback
 * OAuth callback handler - exchanges code for tokens
 * User is redirected here after Google login
 */
router.get('/auth/google/callback', processOAuthCallback);

/**
 * GET /auth/callback
 * Alias for legacy integrations using the older callback path
 */
router.get('/auth/callback', processOAuthCallback);

export default router;
