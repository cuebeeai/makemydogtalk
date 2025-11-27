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
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' as const,
      path: '/',
      // Don't set domain - let it default to the current domain
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
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' as const,
      path: '/',
      // Don't set domain - let it default to the current domain
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
// SHARED AUTHENTICATION ROUTES
// ========================================

/**
 * GET /auth/me
 * Get current authenticated user info
 */
router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    // Try to get token from cookie or Authorization header
    const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

    console.log('[Auth Me] Cookies:', Object.keys(req.cookies || {}));
    console.log('[Auth Me] Has auth_token cookie:', !!req.cookies?.auth_token);
    console.log('[Auth Me] Has Authorization header:', !!req.headers.authorization);
    console.log('[Auth Me] Token found:', !!token);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Import verification functions
    const { verifySessionToken } = await import('./auth.js');
    const { verifySessionToken: verifyEmailSessionToken } = await import('./emailAuth.js');

    // Try to verify with both auth methods
    let user = await verifySessionToken(token);
    if (!user) {
      user = await verifyEmailSessionToken(token);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('[Auth Me Error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and clear session
 */
router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

    if (token) {
      // Import logout functions
      const { logoutSession } = await import('./auth.js');
      const { logoutSession: logoutEmailSession } = await import('./emailAuth.js');

      // Try to logout from both session stores
      await Promise.all([
        logoutSession(token).catch(() => {}),
        logoutEmailSession(token).catch(() => {}),
      ]);
    }

    res.clearCookie('auth_token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('[Logout Error]', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
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
    console.log('[OAuth] Starting Google OAuth flow...');

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[OAuth] Missing Google OAuth credentials');
      return res.status(500).send('OAuth configuration error: Missing credentials');
    }

    const authUrl = getAuthUrl();
    console.log('[OAuth] Generated auth URL, redirecting to Google...');

    // Directly redirect to Google OAuth
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('[OAuth] Error generating auth URL:', error);
    console.error('[OAuth] Error stack:', error.stack);
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
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' as const,
      path: '/',
      // Don't set domain - let it default to the current domain
    };

    console.log('[OAuth] Setting cookie with options:', {
      ...cookieOptions,
      tokenLength: token.length,
      userEmail: user.email,
    });

    // Set httpOnly cookie
    res.cookie('auth_token', token, cookieOptions);

    // Debug: Also set a non-httpOnly cookie to verify cookie setting works
    res.cookie('auth_debug', 'cookie_was_set', {
      ...cookieOptions,
      httpOnly: false, // Allow JavaScript to read this one for debugging
    });

    console.log('[OAuth] Cookie set, redirecting to /?auth=success');

    // Redirect to frontend with success
    res.redirect(`/?auth=success`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    // Redirect to home with error instead of returning JSON
    res.redirect(`/?auth=error&message=${encodeURIComponent(error.message || 'Authentication failed')}`);
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
