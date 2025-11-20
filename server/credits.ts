// Credit tracking system for paid video generation
// Tracks video credits per user (IP-based for now, move to user IDs later)

interface CreditEntry {
  credits: number;
  lastUpdated: Date;
}

class CreditManager {
  private creditMap: Map<string, CreditEntry>;

  constructor() {
    this.creditMap = new Map();
  }

  /**
   * Get credit balance for a user
   * @param userId - User identifier (IP address or user ID)
   * @returns Number of credits remaining
   */
  getCredits(userId: string): number {
    const entry = this.creditMap.get(userId);
    return entry ? entry.credits : 0;
  }

  /**
   * Add credits to a user's balance
   * @param userId - User identifier
   * @param amount - Number of credits to add
   */
  addCredits(userId: string, amount: number): void {
    const entry = this.creditMap.get(userId);

    if (entry) {
      entry.credits += amount;
      entry.lastUpdated = new Date();
    } else {
      this.creditMap.set(userId, {
        credits: amount,
        lastUpdated: new Date(),
      });
    }

    console.log(`Added ${amount} credits to ${userId}. New balance: ${this.getCredits(userId)}`);
  }

  /**
   * Deduct credits from a user's balance
   * @param userId - User identifier
   * @param amount - Number of credits to deduct (default 1)
   * @returns True if deduction was successful, false if insufficient credits
   */
  deductCredit(userId: string, amount: number = 1): boolean {
    const currentCredits = this.getCredits(userId);

    if (currentCredits < amount) {
      console.log(`Insufficient credits for ${userId}. Has ${currentCredits}, needs ${amount}`);
      return false;
    }

    const entry = this.creditMap.get(userId)!;
    entry.credits -= amount;
    entry.lastUpdated = new Date();

    console.log(`Deducted ${amount} credit(s) from ${userId}. Remaining: ${entry.credits}`);
    return true;
  }

  /**
   * Check if user has enough credits
   * @param userId - User identifier
   * @param amount - Number of credits required (default 1)
   * @returns True if user has enough credits
   */
  hasCredits(userId: string, amount: number = 1): boolean {
    return this.getCredits(userId) >= amount;
  }

  /**
   * Get detailed credit information for a user
   * @param userId - User identifier
   */
  getCreditInfo(userId: string): { credits: number; lastUpdated: Date | null } {
    const entry = this.creditMap.get(userId);
    return {
      credits: entry ? entry.credits : 0,
      lastUpdated: entry ? entry.lastUpdated : null,
    };
  }

  /**
   * Clean up old credit entries (optional maintenance)
   * Removes entries with 0 credits that haven't been used in 30 days
   */
  cleanup(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const [userId, entry] of this.creditMap.entries()) {
      if (entry.credits === 0 && entry.lastUpdated < thirtyDaysAgo) {
        this.creditMap.delete(userId);
        console.log(`Cleaned up expired credit entry for ${userId}`);
      }
    }
  }

  /**
   * Get total number of users with credits
   */
  getUserCount(): number {
    return this.creditMap.size;
  }

  /**
   * Get total credits across all users
   */
  getTotalCredits(): number {
    let total = 0;
    for (const entry of this.creditMap.values()) {
      total += entry.credits;
    }
    return total;
  }
}

// Export singleton instance
export const creditManager = new CreditManager();

// Run cleanup every 24 hours
setInterval(() => {
  creditManager.cleanup();
}, 24 * 60 * 60 * 1000);

// Product SKU constants
export const PRODUCTS = {
  // One-time purchases
  THREE_PACK: {
    name: '3 Videos',
    credits: 3,
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_ID_3 || 'price_1SV2ciJCeMRgqWWrvLHmFjBP',
    type: 'one_time' as const,
  },
  TEN_PACK: {
    name: '10 Videos',
    credits: 10,
    price: 19.99,
    priceId: process.env.STRIPE_PRICE_ID_10 || 'price_1SV2gfJCeMRgqWWr1l4nFBiX',
    type: 'one_time' as const,
  },
  TWENTY_FIVE_PACK: {
    name: '25 Videos',
    credits: 25,
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_25 || 'price_1SV2iqJCeMRgqWWra9IveyBL',
    type: 'one_time' as const,
    popular: true, // Mark as best value
  },
} as const;

// Helper to get product by price ID
export function getProductByPriceId(priceId: string) {
  for (const [key, product] of Object.entries(PRODUCTS)) {
    if (product.priceId === priceId) {
      return product;
    }
  }
  return null;
}
