/**
 * Vercel Serverless Function Entry Point
 * Vercel compiles this TypeScript file natively
 */

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Normalize Vercel rewrite paths so Express sees the original route
app.use((req, _res, next) => {
  const prefix = '/api/index';

  if (req.url.startsWith(prefix)) {
    const url = new URL(req.url, 'http://internal');
    // Strip the /api/index prefix and rebuild the URL
    const rewrittenPath = url.pathname.slice(prefix.length) || '/';
    const search = url.searchParams;
    const restQuery = new URLSearchParams(search);
    const normalizedPath = rewrittenPath.startsWith('/') ? rewrittenPath : `/${rewrittenPath}`;

    // Remove any query params that only existed to carry the wildcard
    restQuery.delete('path');

    const queryString = restQuery.toString();
    req.url = queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
  }

  next();
});

// Initialize routes once (cached across invocations)
let initialized = false;
let initError: Error | null = null;

async function initializeApp() {
  if (initialized) return;
  if (initError) throw initError;

  console.log('🚀 Initializing serverless function...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Has DATABASE_URL:', !!process.env.DATABASE_URL);
  console.log('Has GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);

  try {
    // Import routes dynamically to catch errors
    // Use root-relative path that Vercel can resolve
    const { registerRoutes } = await import("../server/routes.js");
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
    initError = error instanceof Error ? error : new Error(String(error));
    throw initError;
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
// Rebuild Wed Nov 26 22:51:35 EST 2025
