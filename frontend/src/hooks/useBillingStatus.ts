import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { billingService } from '@/api/services/billing.service';

export interface UseBillingStatusReturn {
  isLoading: boolean;
  planName: string | null;
  subscriptionStatus: string | null;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  billingCycle: 'monthly' | 'yearly' | null;
  renewalDate: Date | null;
  canAccessFeature: (feature: string) => boolean;
  canInvoices: boolean;
  canQuotes: boolean;
  canClients: boolean;
  canTeamMembers: boolean;
  canCustomBranding: boolean;
  canAPIAccess: boolean;
}

/**
 * Hook to check user's subscription status and feature access
 * 
 * Usage:
 * const { isActive, canAccessFeature, canInvoices } = useBillingStatus();
 * 
 * if (!canInvoices) {
 *   return <UpgradeNeeded feature="invoices" />;
 * }
 */
export function useBillingStatus(): UseBillingStatusReturn {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => billingService.getSubscriptionInfo(),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const planName = subscription?.plan?.name || 'Free';
  const status = subscription?.status || 'free';
  const isActive = status === 'active' || status === 'trialing';
  const isTrialing = status === 'trialing';
  const isPastDue = status === 'past_due';
  const isCanceled = status === 'canceled';

  // Feature access based on plan
  const featureAccess: Record<string, Record<string, boolean>> = {
    Free: {
      invoices: true, // Limited
      quotes: true, // Limited
      clients: true, // Limited
      teamMembers: false,
      customBranding: false,
      apiAccess: false,
      expenseTracking: false,
      recurringInvoices: false,
    },
    Pro: {
      invoices: true, // Unlimited
      quotes: true, // Unlimited
      clients: true, // Limited to 50
      teamMembers: false,
      customBranding: true,
      apiAccess: true,
      expenseTracking: true,
      recurringInvoices: true,
    },
    Business: {
      invoices: true,
      quotes: true,
      clients: true, // Unlimited
      teamMembers: true,
      customBranding: true,
      apiAccess: true,
      expenseTracking: true,
      recurringInvoices: true,
    },
    Enterprise: {
      invoices: true,
      quotes: true,
      clients: true,
      teamMembers: true,
      customBranding: true,
      apiAccess: true,
      expenseTracking: true,
      recurringInvoices: true,
    },
  };

  const currentFeatures = featureAccess[planName] || featureAccess['Free'];

  return {
    isLoading,
    planName,
    subscriptionStatus: status,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    billingCycle: subscription?.billingCycle as 'monthly' | 'yearly' | null,
    renewalDate: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
    canAccessFeature: (feature: string) => currentFeatures[feature] ?? false,
    canInvoices: currentFeatures.invoices,
    canQuotes: currentFeatures.quotes,
    canClients: currentFeatures.clients,
    canTeamMembers: currentFeatures.teamMembers,
    canCustomBranding: currentFeatures.customBranding,
    canAPIAccess: currentFeatures.apiAccess,
  };
}
