/**
 * Rate limiting middleware for video generation endpoints
 * Contains both middleware-based rate limiting (for oauthRoutes) and class-based rate limiting (for routes.ts credit system)
 */

import { Request, Response, NextFunction } from 'express';

// Rate limit constants
const RATE_LIMITS = {
  VIDEO_GENERATION_PER_HOUR: 10,
  VIDEO_GENERATION_COOLDOWN_MS: 30000, // 30 seconds between requests
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}

// In-memory rate limit store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get rate limit key for a request (user ID or IP address)
 */
function getRateLimitKey(req: Request): string {
  // Prefer user ID if authenticated
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  
  // Fall back to IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limiter middleware for video generation
 * Limits: 10 requests per hour per user/IP
 */
export function videoGenerationRateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + hourInMs,
      lastRequestTime: 0,
    };
    rateLimitStore.set(key, entry);
  }

  // Check cooldown period (30 seconds between requests)
  const timeSinceLastRequest = now - entry.lastRequestTime;
  if (entry.lastRequestTime > 0 && timeSinceLastRequest < RATE_LIMITS.VIDEO_GENERATION_COOLDOWN_MS) {
    const waitTime = Math.ceil((RATE_LIMITS.VIDEO_GENERATION_COOLDOWN_MS - timeSinceLastRequest) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitTime} seconds before generating another video`,
      retryAfter: waitTime,
    });
  }

  // Check hourly limit
  if (entry.count >= RATE_LIMITS.VIDEO_GENERATION_PER_HOUR) {
    const resetInMinutes = Math.ceil((entry.resetTime - now) / (60 * 1000));
    return res.status(429).json({
      error: `Rate limit exceeded. You can generate ${RATE_LIMITS.VIDEO_GENERATION_PER_HOUR} videos per hour. Please try again in ${resetInMinutes} minutes.`,
      retryAfter: resetInMinutes * 60,
    });
  }

  // Update rate limit entry
  entry.count++;
  entry.lastRequestTime = now;
  rateLimitStore.set(key, entry);

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMITS.VIDEO_GENERATION_PER_HOUR.toString());
  res.setHeader('X-RateLimit-Remaining', (RATE_LIMITS.VIDEO_GENERATION_PER_HOUR - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

  next();
}

/**
 * Get rate limit status for a user/IP
 */
export function getRateLimitStatus(req: Request): {
  limit: number;
  remaining: number;
  resetTime: Date;
  cooldownRemaining: number;
} {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    return {
      limit: RATE_LIMITS.VIDEO_GENERATION_PER_HOUR,
      remaining: RATE_LIMITS.VIDEO_GENERATION_PER_HOUR,
      resetTime: new Date(now + 60 * 60 * 1000),
      cooldownRemaining: 0,
    };
  }

  const timeSinceLastRequest = now - entry.lastRequestTime;
  const cooldownRemaining = Math.max(0, RATE_LIMITS.VIDEO_GENERATION_COOLDOWN_MS - timeSinceLastRequest);

  return {
    limit: RATE_LIMITS.VIDEO_GENERATION_PER_HOUR,
    remaining: Math.max(0, RATE_LIMITS.VIDEO_GENERATION_PER_HOUR - entry.count),
    resetTime: new Date(entry.resetTime),
    cooldownRemaining: Math.ceil(cooldownRemaining / 1000),
  };
}

// ============================================
// Legacy class-based rate limiter (for routes.ts credit system)
// ============================================

interface LegacyRateLimitEntry {
  lastGeneration: number;
  videoCount: number;
}

class RateLimiter {
  private limitMap: Map<string, LegacyRateLimitEntry>;
  private readonly cooldownMs: number;

  constructor(cooldownHours: number = 3) {
    this.limitMap = new Map();
    this.cooldownMs = cooldownHours * 60 * 60 * 1000; // 3 hours in ms
  }

  /**
   * Check if an IP address can generate a video
   * @param ipAddress - User's IP address
   * @param isPaid - Whether user paid to skip the line
   * @returns { allowed: boolean, remainingMinutes?: number }
   */
  canGenerate(ipAddress: string, isPaid: boolean = false): { allowed: boolean; remainingMinutes?: number } {
    // Payment bypasses cooldown
    if (isPaid) {
      return { allowed: true };
    }

    const entry = this.limitMap.get(ipAddress);

    if (!entry) {
      // First time user - allow
      return { allowed: true };
    }

    const now = Date.now();
    const timeSinceLastGen = now - entry.lastGeneration;

    if (timeSinceLastGen < this.cooldownMs) {
      // Still in cooldown period
      const remainingMs = this.cooldownMs - timeSinceLastGen;
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      return { allowed: false, remainingMinutes };
    }

    // Cooldown expired - allow
    return { allowed: true };
  }

  /**
   * Record a video generation
   * @param ipAddress - User's IP address
   */
  recordGeneration(ipAddress: string): void {
    const entry = this.limitMap.get(ipAddress);

    if (entry) {
      entry.lastGeneration = Date.now();
      entry.videoCount++;
    } else {
      this.limitMap.set(ipAddress, {
        lastGeneration: Date.now(),
        videoCount: 1,
      });
    }
  }

  /**
   * Get usage stats for an IP
   * @param ipAddress - User's IP address
   */
  getStats(ipAddress: string): { videoCount: number; lastGeneration: Date | null } {
    const entry = this.limitMap.get(ipAddress);

    if (!entry) {
      return { videoCount: 0, lastGeneration: null };
    }

    return {
      videoCount: entry.videoCount,
      lastGeneration: new Date(entry.lastGeneration),
    };
  }

  /**
   * Clean up old entries (run periodically)
   * Removes entries older than 24 hours
   */
  cleanup(): void {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const entries = Array.from(this.limitMap.entries());
    for (const [ip, entry] of entries) {
      if (now - entry.lastGeneration > oneDayMs) {
        this.limitMap.delete(ip);
      }
    }
  }
}

// Export singleton instance for legacy credit system
export const rateLimiter = new RateLimiter(3); // 3-hour cooldown

// Run cleanup every hour
setInterval(() => {
  rateLimiter.cleanup();
}, 60 * 60 * 1000);
