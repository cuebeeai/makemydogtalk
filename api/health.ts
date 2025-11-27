/**
 * Simple health check endpoint to test Vercel deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Health check called');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Has DATABASE_URL:', !!process.env.DATABASE_URL);

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    }
  });
}
