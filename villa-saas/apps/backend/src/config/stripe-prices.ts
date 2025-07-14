// Configuration des prix Stripe pour les abonnements
// Ces IDs doivent être créés dans le dashboard Stripe

export const STRIPE_PRICES = {
  // Plan Starter - 40$/mois - 1 propriété
  STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
  
  // Plan Standard - 80$/mois - 3 propriétés
  STANDARD_MONTHLY: process.env.STRIPE_PRICE_STANDARD_MONTHLY || 'price_standard_monthly',
  
  // Propriété supplémentaire - 15$/mois
  EXTRA_PROPERTY: process.env.STRIPE_PRICE_EXTRA_PROPERTY || 'price_extra_property',
} as const;

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 40,
    priceId: STRIPE_PRICES.STARTER_MONTHLY,
    features: {
      properties: 1,
      iCalSync: true,
      analytics: 'basic',
      support: 'email',
    },
  },
  STANDARD: {
    id: 'standard', 
    name: 'Standard',
    price: 80,
    priceId: STRIPE_PRICES.STANDARD_MONTHLY,
    features: {
      properties: 3,
      iCalSync: true,
      analytics: 'advanced',
      support: 'priority',
      extraPropertyPrice: 15,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceId: null,
    features: {
      properties: 'unlimited',
      iCalSync: true,
      analytics: 'advanced',
      support: '24/7',
      api: true,
      customFeatures: true,
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;