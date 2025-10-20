import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, type PlanData } from '@/lib/stripe'

interface PricingCardProps {
  plan: PlanData
  isCurrentPlan?: boolean
  isLoading?: boolean
  onSelectPlan: (priceId: string) => void
}

export const PricingCard = ({ plan, isCurrentPlan = false, isLoading = false, onSelectPlan }: PricingCardProps) => {
  const handleSelectPlan = () => {
    if (!isCurrentPlan && !isLoading) {
      onSelectPlan(plan.stripePriceId)
    }
  }

  return (
    <Card className={`relative ${isCurrentPlan ? 'border-blue-500 shadow-lg' : ''}`}>
      {isCurrentPlan && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Current Plan
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSelectPlan}
          disabled={isCurrentPlan || isLoading}
          variant={isCurrentPlan ? 'outline' : 'default'}
        >
          {isLoading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            `Choose ${plan.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}