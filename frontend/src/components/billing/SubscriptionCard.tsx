import { CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  formatPrice, 
  getSubscriptionStatusColor, 
  getSubscriptionStatusLabel, 
  getPlanById,
  type Subscription 
} from '@/lib/stripe'

interface SubscriptionCardProps {
  subscription: Subscription
  isLoading?: boolean
  onManageSubscription: () => void
}

export const SubscriptionCard = ({ subscription, isLoading = false, onManageSubscription }: SubscriptionCardProps) => {
  // Find the plan details based on the price ID
  const planId = Object.keys(getPlanById as any).find(key => 
    (getPlanById as any)[key]?.stripePriceId === subscription.stripe_price_id
  )
  const plan = planId ? getPlanById(planId as any) : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isActive = subscription.status === 'active'
  const isPastDue = subscription.status === 'past_due'
  const isCanceled = subscription.status === 'canceled'

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing details
            </CardDescription>
          </div>
          <Badge 
            className={`${getSubscriptionStatusColor(subscription.status)} text-white`}
          >
            {getSubscriptionStatusLabel(subscription.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {plan && (
          <div>
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-sm text-gray-600">{plan.description}</p>
            <p className="text-2xl font-bold mt-2">
              {formatPrice(plan.price)}
              <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Current Period</p>
              <p className="text-sm text-gray-600">
                {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Canceling</p>
                <p className="text-sm text-gray-600">
                  Ends {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
          )}
        </div>

        {isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-red-700">Payment Required</p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Your subscription is past due. Please update your payment method to continue service.
            </p>
          </div>
        )}

        {isCanceled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Subscription Canceled</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Your subscription has been canceled. You can reactivate it at any time.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={onManageSubscription}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Manage Subscription'}
        </Button>
      </CardFooter>
    </Card>
  )
}