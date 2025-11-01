// Promo code system for giving free credits
// Tracks promo code redemptions per user

interface PromoCode {
  code: string;
  credits: number;
  maxRedemptions?: number; // Total times code can be used (undefined = unlimited)
  expiresAt?: Date;
  description: string;
}

interface Redemption {
  userId: string;
  code: string;
  redeemedAt: Date;
  credits: number;
}

class PromoCodeManager {
  private promoCodes: Map<string, PromoCode>;
  private redemptions: Map<string, Set<string>>; // code -> Set of userIds who redeemed

  constructor() {
    this.promoCodes = new Map();
    this.redemptions = new Map();

    // Initialize default promo codes
    this.initializeDefaultCodes();
  }

  /**
   * Initialize default promo codes
   */
  private initializeDefaultCodes() {
    // Social media tracking codes - 5 free videos each
    this.addPromoCode({
      code: 'FACEBOOK',
      credits: 5,
      description: 'Facebook ad source - 5 free video generations',
    });

    this.addPromoCode({
      code: 'LINKEDIN',
      credits: 5,
      description: 'LinkedIn ad source - 5 free video generations',
    });

    this.addPromoCode({
      code: 'INSTAGRAM',
      credits: 5,
      description: 'Instagram ad source - 5 free video generations',
    });

    this.addPromoCode({
      code: 'TWITTER',
      credits: 5,
      description: 'Twitter ad source - 5 free video generations',
    });
  }

  /**
   * Add a new promo code
   */
  addPromoCode(promoCode: PromoCode): void {
    const code = promoCode.code.toUpperCase();
    this.promoCodes.set(code, {
      ...promoCode,
      code,
    });
    this.redemptions.set(code, new Set());
    console.log(`✨ Promo code added: ${code} (${promoCode.credits} credits)`);
  }

  /**
   * Remove a promo code
   */
  removePromoCode(code: string): boolean {
    const upperCode = code.toUpperCase();
    const deleted = this.promoCodes.delete(upperCode);
    this.redemptions.delete(upperCode);
    if (deleted) {
      console.log(`🗑️  Promo code removed: ${upperCode}`);
    }
    return deleted;
  }

  /**
   * Validate and redeem a promo code
   * @returns Object with success status, credits awarded, and error message if any
   */
  redeemCode(
    userId: string,
    code: string
  ): { success: boolean; credits?: number; error?: string; message?: string } {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);

    // Check if code exists
    if (!promoCode) {
      return {
        success: false,
        error: 'Invalid promo code',
      };
    }

    // Check if expired
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return {
        success: false,
        error: 'This promo code has expired',
      };
    }

    // Check if user already redeemed this code
    const redemptionSet = this.redemptions.get(upperCode)!;
    if (redemptionSet.has(userId)) {
      return {
        success: false,
        error: 'You have already used this promo code',
      };
    }

    // Check if max redemptions reached
    if (promoCode.maxRedemptions && redemptionSet.size >= promoCode.maxRedemptions) {
      return {
        success: false,
        error: 'This promo code has reached its redemption limit',
      };
    }

    // Redeem the code
    redemptionSet.add(userId);

    console.log(`🎉 Promo code redeemed: ${upperCode} by ${userId} (+${promoCode.credits} credits)`);

    return {
      success: true,
      credits: promoCode.credits,
      message: `Success! ${promoCode.credits} credits added to your account.`,
    };
  }

  /**
   * Check if a user has redeemed a specific code
   */
  hasRedeemed(userId: string, code: string): boolean {
    const upperCode = code.toUpperCase();
    const redemptionSet = this.redemptions.get(upperCode);
    return redemptionSet ? redemptionSet.has(userId) : false;
  }

  /**
   * Get promo code info (without exposing redemption data)
   */
  getPromoCodeInfo(code: string): { valid: boolean; credits?: number; description?: string } {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);

    if (!promoCode) {
      return { valid: false };
    }

    // Check if expired
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return { valid: false };
    }

    // Check if max redemptions reached
    const redemptionSet = this.redemptions.get(upperCode)!;
    if (promoCode.maxRedemptions && redemptionSet.size >= promoCode.maxRedemptions) {
      return { valid: false };
    }

    return {
      valid: true,
      credits: promoCode.credits,
      description: promoCode.description,
    };
  }

  /**
   * Get statistics for a promo code
   */
  getPromoCodeStats(code: string): {
    exists: boolean;
    totalRedemptions?: number;
    maxRedemptions?: number;
    credits?: number;
  } {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);

    if (!promoCode) {
      return { exists: false };
    }

    const redemptionSet = this.redemptions.get(upperCode)!;

    return {
      exists: true,
      totalRedemptions: redemptionSet.size,
      maxRedemptions: promoCode.maxRedemptions,
      credits: promoCode.credits,
    };
  }

  /**
   * List all active promo codes (admin function)
   */
  listAllCodes(): Array<{
    code: string;
    credits: number;
    description: string;
    redemptions: number;
    maxRedemptions?: number;
  }> {
    const codes: Array<any> = [];

    for (const [code, promoCode] of this.promoCodes.entries()) {
      const redemptionSet = this.redemptions.get(code)!;
      codes.push({
        code,
        credits: promoCode.credits,
        description: promoCode.description,
        redemptions: redemptionSet.size,
        maxRedemptions: promoCode.maxRedemptions,
      });
    }

    return codes;
  }
}

// Export singleton instance
export const promoCodeManager = new PromoCodeManager();
