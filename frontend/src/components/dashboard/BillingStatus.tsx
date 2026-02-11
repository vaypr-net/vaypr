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
      {/* Current Plan Status Card - Enhanced */}
      {currentPlan?.price === 0 ? (
        // Free Plan - Premium Upgrade Prompt
        <Card className="p-8 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 transition-all">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium mb-2">
                  Free Plan
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Unlock All Features
                </h2>
                <p className="text-muted-foreground">
                  Upgrade to Pro to access unlimited features and boost your productivity
                </p>
              </div>
              <Button 
                onClick={() => navigate('/pricing')}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>

            {/* Benefits Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 border border-blue-200/30 dark:border-blue-500/20">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-bold text-foreground">5 Invoices</p>
              </div>
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 border border-green-200/30 dark:border-green-500/20">
                <p className="text-xs text-muted-foreground">With Pro</p>
                <p className="font-bold text-green-600">∞ Invoices</p>
              </div>
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 border border-blue-200/30 dark:border-blue-500/20">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-bold text-foreground">5 Clients</p>
              </div>
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 border border-green-200/30 dark:border-green-500/20">
                <p className="text-xs text-muted-foreground">With Pro</p>
                <p className="font-bold text-green-600">∞ Clients</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        // Paid Plan - Standard Status
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
      )}

      {/* Features List - Compact & Clean */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Plan Features</h3>
        
        {currentPlan?.price === 0 ? (
          // Free plan - Compact checklist
          <div className="space-y-2">
            {planFeatures['Free']?.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
            
            {/* Upgrade CTA */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9"
                size="sm"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Upgrade to Unlimited
              </Button>
            </div>
          </div>
        ) : (
          // Paid plan - Compact grid
          <div className="grid grid-cols-2 gap-2">
            {planFeatures[currentPlan?.name || 'Free']?.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">{feature}</span>
              </div>
            ))}
          </div>
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
