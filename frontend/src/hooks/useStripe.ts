import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getStripe, createCheckoutSession, createPortalSession, fetchSubscription, type Subscription } from '@/lib/stripe'

export const useStripe = () => {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const redirectToCheckout = useCallback(async (priceId: string) => {
    try {
      setLoading(true)
      
      // Create checkout session and get the URL
      const checkoutUrl = await createCheckoutSession(priceId)
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout process. Please try again.')
      setLoading(false)
    }
  }, [])

  const redirectToPortal = useCallback(async () => {
    try {
      setLoading(true)
      
      // Create portal session
      const portalUrl = await createPortalSession()
      
      // Redirect to portal
      window.location.href = portalUrl
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to access billing portal. Please try again.')
      setLoading(false)
    }
  }, [])

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const sub = await fetchSubscription()
      setSubscription(sub)
      return sub
    } catch (error) {
      console.error('Failed to load subscription:', error)
      toast.error('Failed to load subscription data')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    subscription,
    redirectToCheckout,
    redirectToPortal,
    loadSubscription,
    setSubscription
  }
}