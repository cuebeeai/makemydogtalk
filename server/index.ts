import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Required for auth system to read cookies

// Simple logging middleware
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting server initialization...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Serve static files from public directory (videos, thumbnails, etc.)
    // This needs to be before Vite middleware in development
    // Exclude index.html so Vite can handle the main app
    const path = await import("path");
    const publicDir = path.resolve(import.meta.dirname, "..", "public");
    console.log('Setting up static file serving from:', publicDir);
    app.use(express.static(publicDir, {
      index: false  // Don't serve index.html from public directory
    }));

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving for production...');
      const { serveStatic } = await import("./vite.js");
      serveStatic(app);
    }

    // Serve the app on the port specified in the environment variable PORT
    // Default to 5000 for local development
    const port = parseInt(process.env.PORT || '5000', 10);
    // Use 0.0.0.0 for external access
    const host = '0.0.0.0';
    
    console.log(`Attempting to start server on ${host}:${port}...`);
    
    server.listen({
      port,
      host,
    }, () => {
      console.log(`✅ Server successfully started on ${host}:${port}`);
      log(`serving on port ${port} (host: ${host})`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
// This prevents the server from crashing on unexpected errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, you might want to log this to a service like Sentry
  // For now, we'll log it but keep the server running
  if (process.env.NODE_ENV === 'production') {
    // Don't exit in production - let the platform handle restarts
    console.error('Server continuing despite uncaught exception');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to a service like Sentry
  if (process.env.NODE_ENV === 'production') {
    console.error('Server continuing despite unhandled rejection');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing server gracefully');
  process.exit(0);
});
