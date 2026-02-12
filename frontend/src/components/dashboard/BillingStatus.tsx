import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { billingService } from '@/api/services/billing.service';
import { Check, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import CancelSubscriptionDialog from '@/components/billing/CancelSubscriptionDialog';
import { CURRENCY_CONFIG } from '@/config/currency.config';

interface BillingPlan {
  _id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: any;
  stripeMonthlyPriceId: string;
  stripeYearlyPriceId: string;
}

export function BillingStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch current subscription info
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => billingService.getSubscriptionInfo(),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading subscription info...</div>;
  }

  const currentPlan = subscription?.plan;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  // Plan features mapping
  const planFeatures: Record<string, string[]> = {
    Free: [
      'Up to 5 invoices/month',
      'Up to 5 quotes/month',
      'Up to 5 clients',
      'Basic templates',
      'Community support',
    ],
    Pro: [
      'Unlimited invoices',
      'Unlimited quotes',
      'Up to 50 clients',
      'All templates',
      'Email support',
      'Custom branding',
      'API access',
    ],
    Business: [
      'Everything in Pro',
      'Unlimited clients',
      'Team management',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
    ],
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-primary/5 border-primary/25">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              Current Plan: <span className="text-primary">{currentPlan?.name || 'Free'}</span>
            </h2>
            {currentPlan && currentPlan.price > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan.displayCurrency || CURRENCY_CONFIG.displayCurrency}{' '}
                {(currentPlan.priceInDisplayCurrency || currentPlan.price).toFixed(2)}
                /{subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            )}
            {isActive && renewalDate && (
              <p className="text-sm text-muted-foreground mt-1">Renews: {renewalDate}</p>
            )}
            {subscription?.status === 'past_due' && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                Payment failed
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button onClick={() => navigate('/pricing')} size="sm">
              <ArrowRight className="w-4 h-4 mr-2" />
              Choose Plan
            </Button>
            {isActive && currentPlan?.price > 0 && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="destructive"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3">
          {(planFeatures[currentPlan?.name || 'Free'] || planFeatures.Free).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
