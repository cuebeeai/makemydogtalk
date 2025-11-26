/**
 * Vercel Serverless Function Entry Point
 * This file gets bundled by esbuild with all server dependencies
 */

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize routes once (cached across invocations)
let initialized = false;

async function initializeApp() {
  if (initialized) return;

  console.log('🚀 Initializing serverless function...');
  console.log('NODE_ENV:', process.env.NODE_ENV);

  try {
    await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Error:', err);
      res.status(status).json({ message });
    });

    initialized = true;
    console.log('✅ Routes initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize routes:', error);
    throw error;
  }
}

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  console.log(`📨 Request: ${req.method} ${req.url}`);

  try {
    await initializeApp();
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Try to send response if not already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Server initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  }
}
