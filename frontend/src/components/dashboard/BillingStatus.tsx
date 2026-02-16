import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { billingService } from '@/api/services/billing.service';
import { Check, AlertCircle, ArrowRight, LogOut, Zap } from 'lucide-react';
import { useState } from 'react';
import CancelSubscriptionDialog from '@/components/billing/CancelSubscriptionDialog';
import { CURRENCY_CONFIG } from '@/config/currency.config';

interface BillingPlan {
  _id: string;
  name: string;
  price: number;
  priceInAED?: number;
  priceInDisplayCurrency?: number;
  displayCurrency?: string;
  interval: string;
  features?: string[];
  limits: {
    invoices?: number;
    quotes?: number;
    clients?: number;
    teamMembers?: number;
    storage?: string;
    receipts?: number;
    recurringInvoices?: number;
    expenseTracking?: boolean;
    invoiceTemplates?: string;
  };
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
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

  // Generate plan features dynamically from API data
  const getPlanFeatures = (): string[] => {
    // If plan has features from API, use those
    if (currentPlan?.features && currentPlan.features.length > 0) {
      return currentPlan.features;
    }

    // Fallback: Generate features from limits if no features provided
    if (currentPlan?.limits) {
      const { limits } = currentPlan;
      const features: string[] = [];

      // Invoices
      if (limits.invoices !== undefined) {
        features.push(
          limits.invoices === -1 || limits.invoices >= 9999
            ? 'Unlimited invoices'
            : `Up to ${limits.invoices} invoices/month`
        );
      }

      // Quotes
      if (limits.quotes !== undefined) {
        features.push(
          limits.quotes === -1 || limits.quotes >= 9999
            ? 'Unlimited quotes'
            : `Up to ${limits.quotes} quotes/month`
        );
      }

      // Clients
      if (limits.clients !== undefined) {
        features.push(
          limits.clients === -1 || limits.clients >= 9999
            ? 'Unlimited clients'
            : `Up to ${limits.clients} clients`
        );
      }

      // Templates
      if (limits.invoiceTemplates) {
        features.push(
          limits.invoiceTemplates === 'unlimited' || limits.invoiceTemplates === 'all'
            ? 'All templates'
            : 'Basic templates'
        );
      }

      // Receipts
      if (limits.receipts && (limits.receipts === -1 || limits.receipts > 0)) {
        features.push(
          limits.receipts === -1 || limits.receipts >= 9999
            ? 'Unlimited receipts'
            : `Up to ${limits.receipts} receipts/month`
        );
      }

      // Recurring Invoices
      if (limits.recurringInvoices && (limits.recurringInvoices === -1 || limits.recurringInvoices > 0)) {
        features.push(
          limits.recurringInvoices === -1 || limits.recurringInvoices >= 9999
            ? 'Unlimited recurring invoices'
            : `Up to ${limits.recurringInvoices} recurring invoices`
        );
      }

      // Expense Tracking
      if (limits.expenseTracking) {
        features.push('Expense tracking');
      }

      // Team Members
      if (limits.teamMembers && limits.teamMembers > 1) {
        features.push(
          limits.teamMembers === -1 || limits.teamMembers >= 9999
            ? 'Unlimited team members'
            : `Up to ${limits.teamMembers} team members`
        );
      }

      // Storage
      if (limits.storage) {
        features.push(`${limits.storage} storage`);
      }

      return features;
    }

    // Ultimate fallback for free plan
    return [
      'Up to 5 invoices/month',
      'Up to 5 quotes/month',
      'Up to 5 clients',
      'Basic templates',
      'Community support',
    ];
  };

  const displayFeatures = getPlanFeatures();

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-primary/5 border-primary/25">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Current Plan:{' '}
              <span className="text-primary">{currentPlan?.name || 'Free'}</span>
              {isActive && currentPlan?.price > 0 && (
                <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Active
                </span>
              )}
            </h2>
            {currentPlan && currentPlan.price > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {CURRENCY_CONFIG.displayCurrency}{' '}
                {(currentPlan.priceInDisplayCurrency || (currentPlan.price * CURRENCY_CONFIG.conversionRate)).toFixed(2)}
                /{subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            )}
            {isActive && renewalDate && currentPlan?.price > 0 && (
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
            {/* Show "Upgrade" button if on Free plan */}
            {!isActive || currentPlan?.price === 0 ? (
              <Button onClick={() => navigate('/pricing')} size="sm" className="bg-primary">
                <Zap className="w-4 h-4 mr-2" />
                {currentPlan?.price === 0 ? 'Upgrade to Paid Plan' : 'Choose Plan'}
              </Button>
            ) : (
              /* Show "Upgrade Plan" for active subscribers if you want them to switch plans
                 Currently hidden - uncomment if you want this feature */
              null
            )}
            
            {/* Cancel button for active paid subscriptions */}
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
        <div 
          className={`grid gap-x-8 gap-y-3 ${
            displayFeatures.length <= 3 
              ? 'grid-cols-1' 
              : displayFeatures.length <= 6 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {displayFeatures.length > 0 ? (
            displayFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-relaxed">{feature}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4">
              <p className="text-sm text-muted-foreground">No features available for this plan</p>
            </div>
          )}
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
