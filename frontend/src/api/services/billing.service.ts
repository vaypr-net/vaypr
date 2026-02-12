import axios from '../axios';

// ==================== TYPES ====================

export interface CheckoutSessionRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface SubscriptionInfo {
  plan: {
    _id: string;
    name: string;
    price: number;
    limits: any;
  } | null;
  status: string;
  billingCycle: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null;
  subscriptionStartedAt: string | null;
}

export interface CancellationPreviewResponse {
  method: 'immediate' | 'at_period_end';
  currentPlan: string;
  daysRemaining: number;
  periodEndDate: string;
  estimatedRefundAmount: number;
  currency: string;
  refundMessage: string;
}

export interface CancelSubscriptionRequest {
  method: 'immediate' | 'at_period_end';
  refundStrategy: 'full_prorated' | 'account_credit' | 'no_refund';
  reason?: string;
  feedback?: string;
}

export interface CancellationConfirmationResponse {
  subscriptionId: string;
  cancellationDate: string;
  accessUntilDate?: string;
  refundAmount: number;
  refundCurrency: string;
  refundStatus: string;
  message: string;
}

export interface CancellationReason {
  value: string;
  label: string;
}

export interface CancellationReasonsResponse {
  reasons: CancellationReason[];
}

// ==================== SERVICE ====================

const BASE_URL = '/billing';

export const billingService = {
  /**
   * Create a checkout session for subscription upgrade
   * Returns URL to redirect user to Stripe Checkout
   * @param planId - The billing plan ID
   * @param billingCycle - 'monthly' or 'yearly'
   * @param currency - Optional currency code (USD, AED, QAR, etc.). Defaults to USD
   */
  async createCheckoutSession(
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    currency: string = 'USD',
  ): Promise<CheckoutSessionResponse> {
    const response = await axios.post<CheckoutSessionResponse>(
      `${BASE_URL}/checkout-session`,
      {
        planId,
        billingCycle,
        currency,
      },
    );
    return response.data;
  },

  /**
   * Create a billing portal session for subscription management
   * Returns URL to redirect user to Stripe Billing Portal
   */
  async createBillingPortalSession(): Promise<BillingPortalResponse> {
    const response = await axios.post<BillingPortalResponse>(
      `${BASE_URL}/portal`,
      {},
    );
    return response.data;
  },

  /**
   * Get current subscription info for logged-in user
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const response = await axios.get<SubscriptionInfo>(`${BASE_URL}/me`);
    return response.data;
  },

  /**
   * Get available cancellation reasons
   */
  async getCancellationReasons(): Promise<CancellationReasonsResponse> {
    const response = await axios.get<CancellationReasonsResponse>(
      `${BASE_URL}/cancellation-reasons`,
    );
    return response.data;
  },

  /**
   * Get cancellation preview to show what will happen
   * Shows refund amount, end date, etc.
   */
  async getCancellationPreview(
    method: 'immediate' | 'at_period_end',
  ): Promise<CancellationPreviewResponse> {
    const response = await axios.post<CancellationPreviewResponse>(
      `${BASE_URL}/cancellation-preview`,
      { method },
    );
    return response.data;
  },

  /**
   * Cancel user's subscription
   * Handles refunds based on strategy
   */
  async cancelSubscription(
    data: CancelSubscriptionRequest,
  ): Promise<CancellationConfirmationResponse> {
    const response = await axios.post<CancellationConfirmationResponse>(
      `${BASE_URL}/cancel`,
      data,
    );
    return response.data;
  },
};
