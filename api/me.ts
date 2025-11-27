/**
 * Debug endpoint to check current user
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Call the main auth endpoint
    const authResponse = await fetch(`${req.headers.origin || 'https://www.makemydogtalk.com'}/auth/me`, {
      headers: {
        cookie: req.headers.cookie || '',
      },
    });

    const data = await authResponse.json();

    return res.status(200).json({
      ...data,
      debug: {
        cookies: req.headers.cookie ? 'present' : 'missing',
        origin: req.headers.origin,
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
