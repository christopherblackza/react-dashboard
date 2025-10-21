import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripe configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  PLANS: {
    STARTER: {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: 29,
      interval: 'month',
      stripePriceId: 'price_1SKRejEBIvM6Lq7zS7NLNGZP', // Replace with actual Stripe price ID
      features: [
        'Up to 5 team members',
        'Basic reporting',
        'Email support',
        '10GB storage'
      ]
    },
    PROFESSIONAL: {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced features for growing businesses',
      price: 99,
      interval: 'month',
      stripePriceId: 'price_1SKRgJEBIvM6Lq7zovyjPfgS', // Replace with actual Stripe price ID
      features: [
        'Up to 25 team members',
        'Advanced reporting & analytics',
        'Priority support',
        '100GB storage',
        'Custom integrations',
        'Advanced permissions'
      ]
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      price: 299,
      interval: 'month',
      stripePriceId: 'price_1SKRgfEBIvM6Lq7zLHQXdKtk', // Replace with actual Stripe price ID
      features: [
        'Unlimited team members',
        'Custom reporting & analytics',
        '24/7 dedicated support',
        'Unlimited storage',
        'Custom integrations',
        'Advanced security features',
        'SLA guarantee',
        'Custom onboarding'
      ]
    }
  },
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    INCOMPLETE: 'incomplete',
    INCOMPLETE_EXPIRED: 'incomplete_expired',
    PAST_DUE: 'past_due',
    TRIALING: 'trialing',
    UNPAID: 'unpaid'
  }
} as const

// Types
export type PlanId = keyof typeof STRIPE_CONFIG.PLANS
export type SubscriptionStatus = typeof STRIPE_CONFIG.SUBSCRIPTION_STATUS[keyof typeof STRIPE_CONFIG.SUBSCRIPTION_STATUS]

export interface PlanFeature {
  name: string
  included: boolean
}

export interface PlanData {
  id: string
  name: string
  description: string
  price: number
  interval: string
  stripePriceId: string
  features: readonly string[]
}

export interface Subscription {
  id: string
  org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

// Stripe instance
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)
  }
  return stripePromise
}

// Helper functions
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export const getPlanById = (planId: PlanId): PlanData | null => {
  const plan = STRIPE_CONFIG.PLANS[planId]
  return plan || null
}

export const getSubscriptionStatusColor = (status: string): string => {
  switch (status) {
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.ACTIVE:
      return 'bg-green-500'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.TRIALING:
      return 'bg-blue-500'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.PAST_DUE:
      return 'bg-yellow-500'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.CANCELED:
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED:
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.UNPAID:
      return 'bg-red-500'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.INCOMPLETE:
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}

export const getSubscriptionStatusLabel = (status: string): string => {
  switch (status) {
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.ACTIVE:
      return 'Active'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.TRIALING:
      return 'Trial'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.PAST_DUE:
      return 'Past Due'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.CANCELED:
      return 'Canceled'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.INCOMPLETE:
      return 'Incomplete'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED:
      return 'Expired'
    case STRIPE_CONFIG.SUBSCRIPTION_STATUS.UNPAID:
      return 'Unpaid'
    default:
      return 'Unknown'
  }
}

// Stripe API functions
export const createCheckoutSession = async (priceId: string) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const response = await fetch(`${apiUrl}/billing/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}/billing?success=true`,
      cancelUrl: `${window.location.origin}/billing?canceled=true`,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}

export const createPortalSession = async () => {
  // First, get the subscription to retrieve the customer ID
  const subscription = await fetchSubscription()
  
  if (!subscription || !subscription.stripe_customer_id) {
    throw new Error('No active subscription found. Please subscribe to a plan first.')
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const response = await fetch(`${apiUrl}/billing/portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${window.location.origin}/billing`,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create portal session')
  }

  const { url } = await response.json()
  return url
}

export const fetchSubscription = async (): Promise<Subscription | null> => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const response = await fetch(`${apiUrl}/billing/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
  
  if (response.status === 404) {
    return null
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch subscription')
  }

  const subscriptions = await response.json()
  return subscriptions.length > 0 ? subscriptions[0] : null
}