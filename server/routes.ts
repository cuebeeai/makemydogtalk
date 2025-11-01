import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { generateVideo, checkVideoStatus } from "./veo";
import { rateLimiter } from "./rateLimiter";
import { registerStripeRoutes } from "./stripe";
import { creditManager } from "./credits";
import { optionalAuth, requireAuth } from "./middleware";
import authRoutes from "./authRoutes";
import { logoutSession } from "./auth";
import { logoutSession as logoutEmailSession } from "./emailAuth";

const upload = multer({
  dest: "uploads/temp/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register unified authentication routes (Email/Password + OAuth)
  app.use(authRoutes);

  // Get current authenticated user
  app.get('/auth/me', optionalAuth, (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        user: req.user,
      });
    } else {
      res.status(401).json({ success: false, error: 'Not authenticated' });
    }
  });

  // Logout endpoint
  app.post('/auth/logout', optionalAuth, (req, res) => {
    try {
      // Get token from cookie or header
      const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

      if (token) {
        // Try to logout from both session stores
        logoutSession(token);
        logoutEmailSession(token);
      }

      res.clearCookie('auth_token');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  });

  // Register Stripe payment routes
  registerStripeRoutes(app);

  // Serve static files with proper headers for video files
  app.use("/uploads", (req, res, next) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Set proper content-type for video files
    if (req.path.endsWith('.mp4')) {
      res.header('Content-Type', 'video/mp4');
    }

    next();
  }, express.static(path.join(process.cwd(), "uploads")));

  app.post("/api/generate-video", optionalAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      if (!req.body.prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }

      const prompt = req.body.prompt;

      // Validate prompt length
      if (prompt.length > 300) {
        return res.status(400).json({ error: "Prompt must be 300 characters or less" });
      }

      if (prompt.length < 5) {
        return res.status(400).json({ error: "Prompt must be at least 5 characters" });
      }

      // Get user identifier: Prioritize authenticated user ID, fallback to IP
      const userId = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
      const useCredit = req.body.useCredit === 'true' || req.body.useCredit === true;

      // New: Admin bypass logic
      const adminEmail = process.env.ADMIN_EMAIL;
      const isAdmin = !!(adminEmail && req.user && req.user.email === adminEmail);

      console.log(`Video generation request from ${req.user ? `user ${req.user.email}` : `IP ${userId}`}${isAdmin ? ' (Admin)' : ''}`);

      if (isAdmin) {
        console.log(`Admin user ${req.user!.email} bypassing credit and rate limits.`);
      } else {
        // Check if user has credits
        let hasCredits = false;
        let creditBalance = 0;

        if (req.user) {
          // For authenticated users, fetch current credits from database
          const currentUser = await storage.getUser(req.user.id);
          creditBalance = currentUser?.credits || 0;
          hasCredits = creditBalance > 0;
        } else {
          // For anonymous users, use in-memory credit manager (legacy)
          hasCredits = creditManager.hasCredits(userId);
          creditBalance = creditManager.getCredits(userId);
        }

        // If user wants to use a credit and has credits available
        if (useCredit && hasCredits) {
          // Deduct credit and skip rate limit
          if (req.user) {
            // Fetch current user from database to ensure latest credit balance
            const currentUser = await storage.getUser(req.user.id);
            if (!currentUser || (currentUser.credits || 0) < 1) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            // Update database credits for authenticated users
            const updatedUser = await storage.updateUser(req.user.id, {
              credits: currentUser.credits - 1
            });
            if (!updatedUser) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "Could not update credit balance"
              });
            }
            req.user = updatedUser; // Update session user
            console.log(`User ${req.user.email} used a credit. Remaining: ${updatedUser.credits}`);
          } else {
            // Use in-memory credit manager for anonymous users
            const deducted = creditManager.deductCredit(userId);
            if (!deducted) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            console.log(`Anonymous user ${userId} used a credit. Remaining: ${creditManager.getCredits(userId)}`);
          }
        } else {
          // Check rate limit for free generation
          const rateLimitCheck = rateLimiter.canGenerate(userId, false);

          if (!rateLimitCheck.allowed) {
            const hours = Math.floor(rateLimitCheck.remainingMinutes! / 60);
            const minutes = rateLimitCheck.remainingMinutes! % 60;
            const timeString = hours > 0
              ? `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

            return res.status(429).json({
              error: "Rate limit exceeded",
              message: `Please wait ${timeString} or purchase credits to generate now.`,
              remainingMinutes: rateLimitCheck.remainingMinutes,
              credits: creditBalance,
              canPurchase: true
            });
          }
        }
      }

      const imagePath = req.file.path;
      const intent = req.body.intent || "";
      const tone = req.body.tone || "friendly";
      const background = req.body.background || "";
      const aspectRatio = req.body.aspectRatio;
      const voiceStyle = req.body.voiceStyle || "";
      const action = req.body.action || "";

      // Add validation for aspectRatio
      if (!aspectRatio || !['16:9', '9:16', '1:1'].includes(aspectRatio)) {
        // Clean up the uploaded file before sending an error response
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Failed to cleanup temp file on validation error:", err);
        });
        return res.status(400).json({ error: `Invalid or missing aspectRatio. Received: ${aspectRatio}` });
      }

      console.log(`Generating video with prompt: "${prompt}", intent: "${intent}", tone: "${tone}", voiceStyle: "${voiceStyle}", action: "${action}", background: "${background}", aspectRatio: "${aspectRatio}"`);

      const result = await generateVideo({
        prompt,
        imagePath,
        intent,
        tone,
        background,
        aspectRatio: aspectRatio as "16:9" | "9:16" | "1:1",
        voiceStyle,
        action,
      });

      const operation = await storage.createVideoOperation({
        operationId: result.operation.name || null,
        status: "processing",
        prompt,
        imagePath,
        videoUrl: null,
        error: null,
        userId: req.user ? req.user.id : null, // Add userId
      });

      // Record this generation for rate limiting (only if not using credits and not an admin)
      if (!useCredit && !isAdmin) {
        rateLimiter.recordGeneration(userId);
        console.log(`Rate limit recorded for user: ${userId}`);
      } else {
        console.log(`Credit used or admin bypass - rate limit not recorded for user: ${userId}`);
      }

      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to cleanup temp file:", err);
      });

      res.json({
        id: operation.id,
        status: "processing",
      });
    } catch (error: any) {
      console.error("Error in /api/generate-video:", error);
      res.status(500).json({ error: error.message || "Failed to start video generation" });
    }
  });

  app.get("/api/video-status/:id", optionalAuth, async (req, res) => {
    try {
      const operationId = req.params.id;
      const operation = await storage.getVideoOperation(operationId);

      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }

      if (operation.status === "completed") {
        return res.json({
          status: "completed",
          videoUrl: operation.videoUrl,
        });
      }

      if (operation.status === "failed") {
        return res.json({
          status: "failed",
          error: operation.error,
        });
      }

      if (operation.operationId) {
        const statusResult = await checkVideoStatus(operation.operationId);

        await storage.updateVideoOperation(operationId, {
          status: statusResult.status,
          videoUrl: statusResult.videoUrl || null,
          error: statusResult.error || null,
        });

        res.json({
          status: statusResult.status,
          videoUrl: statusResult.videoUrl,
          error: statusResult.error,
        });
      } else {
        res.json({
          status: operation.status,
          videoUrl: operation.videoUrl,
          error: operation.error,
        });
      }
    } catch (error: any) {
      console.error("Error in /api/video-status:", error);
      res.status(500).json({ error: error.message || "Failed to check video status" });
    }
  });

  // New endpoint to get user's video creations
  app.get("/api/my-videos", optionalAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const videos = await storage.getVideosByUserId(req.user.id);
      res.json(videos);
    } catch (error: any) {
      console.error("Error in /api/my-videos:", error);
      res.status(500).json({ error: error.message || "Failed to fetch user videos" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
