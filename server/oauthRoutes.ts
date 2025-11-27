/**
 * OAuth + Vertex AI Routes
 *
 * Complete integration of:
 * 1. Google OAuth 2.0 user authentication
 * 2. Vertex AI video generation with service account
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthUrl, handleOAuthCallback, logoutSession, getActiveSessions } from './auth.js';
import { generateVideo, checkVideoStatus } from './veo.js';
import { requireAuth, optionalAuth } from './middleware.js';
import { videoGenerationRateLimiter } from './rateLimiter.js';
import { validateImageFile, videoGenerationSchema } from './validation.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ========================================
// AUTHENTICATION ROUTES (OAuth 2.0)
// ========================================

/**
 * GET /auth/google
 * Start OAuth flow - redirects user to Google login
 */
router.get('/auth/google', (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl();
    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to start Google login',
    });
  } catch (error: any) {
    console.error('Error generating auth URL');
    res.status(500).json({
      success: false,
      error: 'Failed to generate auth URL',
    });
  }
});

/**
 * GET /auth/google/callback
 * OAuth callback handler - exchanges code for tokens
 * User is redirected here after Google login
 */
router.get('/auth/google/callback', async (req: Request, res: Response) => {
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

    // Exchange code for tokens and create user session
    const result = await handleOAuthCallback(code);

    // In production, set httpOnly cookie for security
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user info and token
    res.json({
      success: true,
      user: result.user,
      accessToken: result.token,
      message: 'Successfully authenticated. Use accessToken in Authorization header for protected routes.',
    });
  } catch (error: any) {
    console.error('OAuth callback error: Authentication failed');
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and clear session
 */
router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  try {
    // Get token from Authorization header or cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
    
    if (token) {
      logoutSession(token);
    }

    res.clearCookie('access_token');

    res.json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error: any) {
    console.error('Logout failed');
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current user info (requires authentication)
 */
router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// ========================================
// VIDEO GENERATION ROUTES (Vertex AI)
// ========================================

/**
 * POST /generate-video
 * Generate talking dog video using Vertex AI
 * Requires: User authentication (OAuth)
 * Uses: Service account credentials for Vertex AI
 */
router.post(
  '/generate-video',
  requireAuth,
  videoGenerationRateLimiter,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please log in with Google to generate videos',
        });
      }

      // Validate image upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image uploaded',
          message: 'Please upload a dog image',
        });
      }

      // Validate file
      const fileValidation = validateImageFile(req.file);
      if (!fileValidation.valid) {
        // Clean up invalid file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: fileValidation.error,
        });
      }

      // Validate input data
      const validation = videoGenerationSchema.safeParse(req.body);
      if (!validation.success) {
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: validation.error.errors,
        });
      }

      const { prompt, intent, tone, voiceStyle, action, background, aspectRatio } = validation.data;

      console.log(`[Video Generation] Request received from authenticated user`);

      // Call Vertex AI using SERVICE ACCOUNT credentials
      const result = await generateVideo({
        prompt,
        imagePath: req.file.path,
        intent,
        tone,
        voiceStyle,
        action,
        background,
        aspectRatio,
      });

      // Clean up temp file (veo.ts reads it directly)
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        operationId: result.operation.name,
        status: 'processing',
        message: 'Video generation started. Use operationId to check status.',
      });
    } catch (error: any) {
      console.error('[Video Generation] Video generation failed');

      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Video generation failed',
      });
    }
  }
);

/**
 * GET /video-status/:operationId
 * Check video generation status
 * Requires: User authentication
 */
router.get('/video-status/:operationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;

    if (!operationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing operation ID',
      });
    }

    const result = await checkVideoStatus(operationId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Video Status] Failed to check video status');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check video status',
    });
  }
});

// ========================================
// HEALTH & DEBUG ROUTES
// ========================================

/**
 * GET /health
 * Server health check with authentication status
 */
router.get('/health', optionalAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    server: 'MakeMyDogTalk.com API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    authentication: {
      user: req.user ? {
        email: req.user.email,
        name: req.user.name,
      } : null,
      activeSessions: getActiveSessions(),
    },
    vertexAI: {
      configured: !!process.env.SERVICE_ACCOUNT_JSON && !!process.env.VERTEX_AI_PROJECT_ID,
    },
  });
});

/**
 * GET /
 * Root endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MakeMyDogTalk.com API',
    endpoints: {
      auth: {
        google: '/auth/google - Start Google OAuth login',
        callback: '/auth/callback - OAuth callback handler',
        me: '/auth/me - Get current user (requires auth)',
        logout: '/auth/logout - Logout (requires auth)',
      },
      video: {
        generate: 'POST /generate-video - Generate talking dog video (requires auth)',
        status: 'GET /video-status/:id - Check video status (requires auth)',
      },
      health: '/health - Server health check',
    },
    documentation: 'See README_OAUTH_VERTEX.md for complete documentation',
  });
});

export default router;
