// Minimal server for testing Firebase App Hosting deployment
import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: process.env.PORT 
  });
});

// Test database connection endpoint
app.get('/api/test-db', (_req, res) => {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasSessionSecret = !!process.env.SESSION_SECRET;
  
  res.json({
    database_configured: hasDbUrl,
    session_configured: hasSessionSecret,
    database_url_length: process.env.DATABASE_URL?.length || 0
  });
});

// Add a basic auth endpoint that the frontend expects
app.get('/auth/me', (_req, res) => {
  res.status(401).json({ 
    success: false, 
    error: 'Not authenticated',
    message: 'Minimal server - authentication not implemented yet'
  });
});

// Add other API endpoints the frontend might expect
app.get('/api/*', (_req, res) => {
  res.status(501).json({ 
    error: 'API not implemented in minimal server',
    message: 'This is a minimal server for testing deployment'
  });
});

// Serve static files in production
const distPath = path.resolve(process.cwd(), "dist", "public");
console.log('Looking for static files at:', distPath);

if (fs.existsSync(distPath)) {
  console.log('✅ Static files directory found');
  app.use(express.static(distPath));
  
  // Fallback to index.html for SPA routing (only for non-API routes)
  app.use("*", (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Static files not found');
    }
  });
} else {
  console.log('❌ Static files directory not found');
  app.use("*", (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.status(200).send(`
      <h1>Make My Dog Talk - Server Running! (v2)</h1>
      <p>Environment: ${process.env.NODE_ENV}</p>
      <p>Port: ${process.env.PORT}</p>
      <p>Database configured: ${!!process.env.DATABASE_URL}</p>
      <p>Session configured: ${!!process.env.SESSION_SECRET}</p>
      <p>Static files path: ${distPath}</p>
      <p><a href="/api/health">Health Check</a></p>
      <p><a href="/api/test-db">Test Database Config</a></p>
    `);
  });
}

// Start server
const port = parseInt(process.env.PORT || '8080', 10);
const host = '0.0.0.0';

console.log(`Starting minimal server...`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${port}`);
console.log(`HOST: ${host}`);
console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
console.log(`SESSION_SECRET configured: ${!!process.env.SESSION_SECRET}`);

const server = app.listen(port, host, () => {
  console.log(`✅ Minimal server successfully started on ${host}:${port}`);
});

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
