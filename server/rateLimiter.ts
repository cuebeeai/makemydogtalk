// Rate limiter for video generation
// Tracks last generation time per IP address

interface RateLimitEntry {
  lastGeneration: number;
  videoCount: number;
}

class RateLimiter {
  private limitMap: Map<string, RateLimitEntry>;
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

    for (const [ip, entry] of this.limitMap.entries()) {
      if (now - entry.lastGeneration > oneDayMs) {
        this.limitMap.delete(ip);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(3); // 3-hour cooldown

// Run cleanup every hour
setInterval(() => {
  rateLimiter.cleanup();
}, 60 * 60 * 1000);
