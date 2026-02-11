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
      {/* Current Plan Status Card - Compact */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-4">
              <h2 className="text-lg font-bold text-foreground">
                Current Plan: <span className="text-primary text-xl">{currentPlan?.name || 'Free'}</span>
              </h2>
              
              {/* Current Plan Price - Inline */}
              {currentPlan && currentPlan.price > 0 && (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-primary">
                    KWD {currentPlan.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
                  </div>
                  {subscription?.billingCycle === 'yearly' && (
                    <div className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted rounded">
                      ~KWD {(currentPlan.price / 12).toFixed(2)}/mo
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Renewal Date and Status */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              {isActive && renewalDate && (
                <p className="text-muted-foreground">
                  Renews: <span className="font-semibold text-foreground">{renewalDate}</span>
                </p>
              )}

              {subscription?.status === 'past_due' && (
                <p className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Payment failed
                </p>
              )}

              {subscription?.status === 'canceled' && (
                <p className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Subscription canceled
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 ml-8">
            {isActive && currentPlan?.price > 0 ? (
              <>
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  size="sm"
                  className="text-xs whitespace-nowrap"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>

                <Button 
                  onClick={() => setShowCancelDialog(true)}
                  variant="destructive"
                  size="sm"
                  className="text-xs whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/pricing')}
                size="sm"
                className="text-xs whitespace-nowrap"
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Choose Plan
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Features List */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-foreground">Your Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planFeatures[currentPlan?.name || 'Free']?.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
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
