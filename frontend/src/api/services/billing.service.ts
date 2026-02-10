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

// ==================== SERVICE ====================

const BASE_URL = '/billing';

export const billingService = {
  /**
   * Create a checkout session for subscription upgrade
   * Returns URL to redirect user to Stripe Checkout
   */
  async createCheckoutSession(
    planId: string,
    billingCycle: 'monthly' | 'yearly',
  ): Promise<CheckoutSessionResponse> {
    const response = await axios.post<CheckoutSessionResponse>(
      `${BASE_URL}/checkout-session`,
      {
        planId,
        billingCycle,
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
};
