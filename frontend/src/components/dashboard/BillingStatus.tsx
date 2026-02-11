import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { billingService } from '@/api/services/billing.service';
import { Check, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import CancelSubscriptionDialog from '@/components/billing/CancelSubscriptionDialog';

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
      {/* Current Plan Status Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Current Plan: <span className="text-primary">{currentPlan?.name || 'Free'}</span>
            </h2>
            
            {isActive && renewalDate && (
              <p className="text-sm text-muted-foreground">
                Renews on: <span className="font-semibold">{renewalDate}</span>
              </p>
            )}

            {subscription?.status === 'past_due' && (
              <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                Payment failed - update payment method
              </p>
            )}

            {subscription?.status === 'canceled' && (
              <p className="text-sm text-yellow-600 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                Subscription canceled
              </p>
            )}
          </div>

          {/* Current Plan Price */}
          {currentPlan && currentPlan.price > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                KWD {currentPlan.price.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                per {subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Features List */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-foreground">Your Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planFeatures[currentPlan?.name || 'Free']?.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {isActive && currentPlan?.price > 0 ? (
          <>
            {/* For paid users - show upgrade and manage options */}
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="flex-1 min-w-fit"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>

            {/* Cancel Subscription Button */}
            <Button 
              onClick={() => setShowCancelDialog(true)}
              variant="destructive"
              className="flex-1 min-w-fit"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          </>
        ) : (
          <>
            {/* For free users - show choose plan button */}
            <Button 
              onClick={() => navigate('/pricing')}
              className="flex-1"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Choose a Plan
            </Button>
          </>
        )}
      </div>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
