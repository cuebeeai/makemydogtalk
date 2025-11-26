// Product price IDs from environment or defaults
export const PRODUCTS = {
  // One-time purchases
  THREE_PACK: {
    name: '3 Videos',
    credits: 3,
    price: 14.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_3 || 'price_1SWKdMJCeMRgqWWrfiNOA95r',
    type: 'one_time' as const,
    description: 'Perfect for trying it out',
  },
  TEN_PACK: {
    name: '10 Videos',
    credits: 10,
    price: 19.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_10 || 'price_1SV2gfJCeMRgqWWr1l4nFBiX',
    type: 'one_time' as const,
    description: 'Great for regular use',
  },
  // Subscription plans
  MONTHLY_SUBSCRIPTION: {
    name: '20 Videos/Month',
    credits: 20,
    price: 29.99,
    priceId: import.meta.env.VITE_STRIPE_20_MONTHLY || 'price_1SWLnSJCeMRgqWWri3D2xtx3a',
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Consistent monthly content',
  },
  ANNUAL_SUBSCRIPTION: {
    name: '240 Videos/Year',
    credits: 240,
    price: 299.99,
    priceId: import.meta.env.VITE_STRIPE_299_ANNUAL || 'price_1SWLnSJCeMRgqWWreuJXxTNG',
    type: 'subscription' as const,
    interval: 'year' as const,
    description: 'Best value - save $60/year',
    popular: true, // Mark as best value
  },
};
