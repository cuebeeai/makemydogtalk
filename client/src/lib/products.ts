// Product price IDs from environment or defaults
export const PRODUCTS = {
  // One-time purchases
  THREE_PACK: {
    name: '3 Videos',
    credits: 3,
    price: 9.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_3 || 'price_1SV2ciJCeMRgqWWrvLHmFjBP',
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
  TWENTY_FIVE_PACK: {
    name: '25 Videos',
    credits: 25,
    price: 29.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_25 || 'price_1SV2iqJCeMRgqWWra9IveyBL',
    type: 'one_time' as const,
    description: 'Most popular choice',
    popular: true, // Mark as best value
  },
};
