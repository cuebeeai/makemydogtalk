// Product price IDs from environment or defaults
export const PRODUCTS = {
  JUMP_LINE: {
    name: 'Jump The Line',
    credits: 1,
    price: 4.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_JUMP_LINE || 'price_1QgUXjP7UuXbTqJwxHQ1jyb4',
  },
  THREE_PACK: {
    name: '3 Video Pack',
    credits: 3,
    price: 11.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_THREE_PACK || 'price_1QgUYGP7UuXbTqJw4zDvREjV',
  },
};
