import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useStripe } from '@/hooks/useStripe'
import { PricingCard } from '@/components/billing/PricingCard'
import { SubscriptionCard } from '@/components/billing/SubscriptionCard'
import { STRIPE_CONFIG, type Subscription } from '@/lib/stripe'

export const BillingPage = () => {
  const { loading, subscription, redirectToCheckout, redirectToPortal, loadSubscription } = useStripe()
  const [urlParams] = useState(new URLSearchParams(window.location.search))

  // Load subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: loadSubscription,
    retry: false
  })

  // Handle URL parameters for success/cancel states
  useEffect(() => {
    if (urlParams.get('success') === 'true') {
      toast.success('Payment successful! Your subscription is now active.')
      // Remove the success parameter from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    if (urlParams.get('canceled') === 'true') {
      toast.error('Payment was canceled. You can try again anytime.')
      // Remove the canceled parameter from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [urlParams])

  const handleSelectPlan = async (priceId: string) => {
    await redirectToCheckout(priceId)
  }

  const handleManageSubscription = async () => {
    await redirectToPortal()
  }

  const getCurrentPlanId = (subscription: Subscription | null) => {
    if (!subscription) return null
    
    // Find the plan that matches the subscription's price ID
    const planEntry = Object.entries(STRIPE_CONFIG.PLANS).find(
      ([, plan]) => plan.stripePriceId === subscription.stripe_price_id
    )
    
    return planEntry ? planEntry[0] : null
  }

  const currentPlanId = getCurrentPlanId(subscriptionData)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription, view billing history, and update payment methods.
        </p>
      </div>

      {/* Current Subscription Section */}
      {subscriptionData && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <SubscriptionCard
            subscription={subscriptionData}
            isLoading={loading}
            onManageSubscription={handleManageSubscription}
          />
        </div>
      )}

      {/* No Subscription Message */}
      {!isLoadingSubscription && !subscriptionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">No Active Subscription</h3>
              <p className="text-blue-700 mt-1">
                Choose a plan below to get started with our premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="mt-2 text-gray-600">
            Select the perfect plan for your business needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(STRIPE_CONFIG.PLANS).map(([planId, plan]) => (
            <PricingCard
              key={planId}
              plan={plan}
              isCurrentPlan={currentPlanId === planId}
              isLoading={loading}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Choose Our Premium Plans?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Advanced Analytics</h4>
              <p className="text-sm text-gray-600">Get detailed insights into your business performance</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Priority Support</h4>
              <p className="text-sm text-gray-600">Get help when you need it with dedicated support</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Custom Integrations</h4>
              <p className="text-sm text-gray-600">Connect with your favorite tools and services</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Unlimited Storage</h4>
              <p className="text-sm text-gray-600">Never worry about running out of space</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Advanced Security</h4>
              <p className="text-sm text-gray-600">Keep your data safe with enterprise-grade security</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">24/7 Monitoring</h4>
              <p className="text-sm text-gray-600">Round-the-clock system monitoring and alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• All plans include a 14-day free trial</p>
          <p>• Cancel anytime with no hidden fees</p>
          <p>• Secure payments processed by Stripe</p>
          <p>• Automatic billing on your chosen cycle</p>
          <p>• Prorated charges when upgrading or downgrading</p>
        </div>
      </div>
    </div>
  )
}