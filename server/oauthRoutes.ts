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
import { getAuthUrl, handleOAuthCallback, verifyUserSession, logoutUser, getActiveSessions } from './auth';
import { generateTalkingDogVideo, checkVideoGenerationStatus, getVertexAIInfo } from './vertexAI';
import { requireAuth, optionalAuth } from './middleware';

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
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /auth/callback
 * OAuth callback handler - exchanges code for tokens
 * User is redirected here after Google login
 */
router.get('/auth/callback', async (req: Request, res: Response) => {
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
    const userSession = await handleOAuthCallback(code);

    // In production, set httpOnly cookie for security
    res.cookie('access_token', userSession.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user info and token
    res.json({
      success: true,
      user: {
        id: userSession.id,
        email: userSession.email,
        name: userSession.name,
        picture: userSession.picture,
      },
      accessToken: userSession.accessToken,
      message: 'Successfully authenticated. Use accessToken in Authorization header for protected routes.',
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message,
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and clear session
 */
router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  try {
    if (req.user) {
      logoutUser(req.user.id);
    }

    res.clearCookie('access_token');

    res.json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
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

      // Validate prompt
      const { prompt, intent, tone, background } = req.body;
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Missing prompt',
          message: 'Please provide what the dog should say',
        });
      }

      console.log(`[Video Generation] User: ${req.user.email}, Prompt: "${prompt}"`);

      // Read image and convert to base64
      const imageBytes = fs.readFileSync(req.file.path);
      const imageBase64 = imageBytes.toString('base64');

      // Determine MIME type
      const mimeType = req.file.path.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

      // Call Vertex AI using SERVICE ACCOUNT credentials
      // (NOT the user's OAuth token)
      const result = await generateTalkingDogVideo({
        prompt,
        imageBase64,
        mimeType,
        intent,
        tone,
        background,
        userId: req.user.id,
      });

      // Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        ...result,
        message: 'Video generation started. Use operationId to check status.',
      });
    } catch (error: any) {
      console.error('[Video Generation] Error:', error);

      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Video generation failed',
        details: error.message,
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

    const result = await checkVideoGenerationStatus(operationId);

    res.json(result);
  } catch (error: any) {
    console.error('[Video Status] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check video status',
      details: error.message,
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
  const vertexInfo = getVertexAIInfo();

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
      configured: !!process.env.SERVICE_ACCOUNT_JSON,
      projectId: vertexInfo.projectId,
      location: vertexInfo.location,
      serviceAccount: vertexInfo.serviceAccountEmail,
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
