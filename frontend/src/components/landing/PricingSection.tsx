import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CURRENCY_CONFIG } from "@/config/currency.config";
import { ReferralCodeModal } from "@/components/billing/ReferralCodeModal";

interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  status: string;
  features: string[];
  limits: {
    invoices: number;
    quotes: number;
    clients: number;
    teamMembers: number;
    storage: string;
    receipts: number;
    recurringInvoices: number;
    expenseTracking: boolean;
    invoiceTemplates: string;
  };
  isPopular: boolean;
}

const FREE_PLAN_DESCRIPTION =
  "Perfect for freelancers and small businesses just getting started with professional invoicing.";
const BUSINESS_PLAN_DESCRIPTION =
  "Ideal for growing businesses that need full access to invoicing, quotes, and expense tracking.";

const staticFreePlanFallback: Plan = {
  _id: "static-free-plan",
  name: "Free",
  price: 0,
  currency: CURRENCY_CONFIG.displayCurrency,
  interval: "monthly",
  status: "active",
  features: [
    "Up to 3 Invoices per month",
    "Up to 2 Quotes per month",
    "Up to 3 Receipts per month",
    "10 Clients",
    "1 Recurring Subscription",
    "Up to 5 Expense Tracking",
    "1 Custom Template",
  ],
  limits: {
    invoices: 3,
    quotes: 2,
    clients: 10,
    teamMembers: 1,
    storage: "1GB",
    receipts: 3,
    recurringInvoices: 1,
    expenseTracking: true,
    invoiceTemplates: "1",
  },
  isPopular: false,
};

// Static Enterprise Plan - Hardcoded (same as before)
const staticEnterprisePlan = {
  name: "Enterprise",
  description: "For larger organizations needing custom solutions, dedicated support, and advanced features.",
  features: [
    "Everything in Business",
    "Graphic Designer For Templates",
    "Ai Integration System",
    "API Access",
    "Dedicated Account Manager",
    "Smart Financial Analytics",
    "Advanced Expense Tracking",
    "White-label Options",
  ],
  cta: "Book a Call",
};

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_CONFIG.displayCurrency); // Default to KWD
  const showCurrencySelector = false;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null); // Track which plan is being checked out
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null); // Store plan for referral modal
  const [showReferralModal, setShowReferralModal] = useState(false); // Control referral modal
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const supportedCurrencies = CURRENCY_CONFIG.supportedCurrencies;

  const getPlanDescription = (plan: Plan): string => {
    const normalizedName = plan.name.toLowerCase();

    if (plan.price === 0 || normalizedName.includes("free") || normalizedName.includes("starter")) {
      return FREE_PLAN_DESCRIPTION;
    }

    if (normalizedName.includes("business")) {
      return BUSINESS_PLAN_DESCRIPTION;
    }

    return plan.features?.[0] || `${plan.name} plan for your business.`;
  };

  const isBusinessPlan = (plan: Plan): boolean => {
    return plan.name.toLowerCase().includes("business");
  };

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
        const response = await fetch(`${apiBaseUrl}/billing-plans`);
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        const apiPlans: Plan[] = data.items || [];
        const hasFreePlan = apiPlans.some((plan) => {
          const normalizedName = plan.name.toLowerCase();
          return plan.price === 0 || normalizedName.includes("free") || normalizedName.includes("starter");
        });

        setPlans(hasFreePlan ? apiPlans : [staticFreePlanFallback, ...apiPlans]);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle Get Started button click - SIMPLE FLOW
  const handleGetStarted = async (plan: Plan) => {
    console.log('=== GET STARTED CLICKED ===');
    console.log('Plan:', plan.name, 'Price:', plan.price);
    
    // FREE PLAN - Direct navigation
    if (plan.price === 0) {
      if (user) {
        console.log('Free plan + logged in → dashboard');
        navigate('/dashboard');
      } else {
        console.log('Free plan + not logged in → signup');
        navigate('/signup');
      }
      return;
    }

    // PAID PLAN - Require authentication
    if (!user) {
      // Not logged in → go to login, then come back to /pricing
      console.log('Paid plan + not logged in → redirect to login with /pricing as next');
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    // User is logged in → show referral code modal first
    console.log('Paid plan + logged in → showing referral modal');
    setSelectedPlan(plan);
    setShowReferralModal(true);
  };

  // Process checkout with optional referral code
  const handleProceedWithCheckout = async (referralCode?: string) => {
    if (!selectedPlan) return;
    
    console.log('=== PROCEEDING WITH CHECKOUT ===');
    console.log('Plan:', selectedPlan.name);
    console.log('Referral Code:', referralCode || 'None');
    
    setShowReferralModal(false);
    setCheckoutLoading(selectedPlan._id);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const url = `${apiBaseUrl}/billing/checkout-session`;
      
      // Get token from localStorage (since useAuth might have issues)
      const token = localStorage.getItem('accessToken');
      console.log('Token from localStorage:', token ? '✅ Found' : '❌ Missing');

      if (!token) {
        console.error('No token in localStorage, redirecting to login');
        navigate('/login', { state: { from: '/pricing' } });
        return;
      }

      console.log('Creating checkout session for:', selectedPlan.name);
      
      const requestBody: any = {
        planId: selectedPlan._id,
        billingCycle: isYearly ? 'yearly' : 'monthly',
        currency: selectedCurrency,
      };

      // Add referral code if provided
      if (referralCode) {
        requestBody.referralCode = referralCode;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checkout error:', errorText);
        throw new Error(`Checkout failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Got checkout URL:', data.url ? 'YES' : 'NO');
      
      if (data.url) {
        console.log('🔄 Redirecting to Stripe checkout...');
        window.location.href = data.url;
      } else {
        console.error('No URL in response');
        alert('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('❌ Checkout error:', err.message);
      alert(`Error: ${err.message}`);
      setCheckoutLoading(null);
    }
  };

  // Handle Book a Call button click
  const handleBookCall = () => {
    // Open contact form or modal
    navigate('/contact');
  };

  // Calculate yearly price with 15% discount
  // Formula: (monthlyPrice * 12) * 0.85 = yearly price with 15% savings
  const calculateYearlyPrice = (monthlyPrice: number): number => {
    return Math.round((monthlyPrice * 12 * 0.85) * 100) / 100;
  };

  // Get display price based on billing cycle
  const getDisplayPrice = (plan: Plan): number => {
    if (plan.price === 0) return 0;
    if (isYearly) {
      return calculateYearlyPrice(plan.price);
    }
    return plan.price;
  };

  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <p className="text-muted-foreground">Loading pricing plans...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || plans.length === 0) {
    return (
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-6">
              {error ? (
                <svg className="w-20 h-20 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-20 h-20 mx-auto text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {error ? 'Unable to Load Plans' : 'No Plans Exist Yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {error
                ? 'We encountered an issue loading the pricing plans. Please try again later.'
                : 'No pricing plans have been created yet. Please check back later.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Loading
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Filter out Enterprise plan from API if it exists, show all other plans
  // The hardcoded Enterprise plan will be rendered separately
  const displayPlans = plans.filter(p => p.name !== "Enterprise");
  const firstPaidPlanId = displayPlans.find((plan) => plan.price > 0)?._id;

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#f7f7fb]">
      {/* Background */}
      <div className="absolute inset-0 bg-[#f7f7fb]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Choose your right plan!
          </h2>
          <p className="text-[#6b6b76] text-lg">
            Select from best plans, ensuring a perfect match. Need more or less?
            <br />
            Customize your subscription for a seamless fit!
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-[#ececf3] rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                !isYearly
                  ? "bg-[#7c4dff] text-white shadow-sm"
                  : "text-[#6b6b76] hover:text-[#1c1c26]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                isYearly
                  ? "bg-[#7c4dff] text-white shadow-sm"
                  : "text-[#6b6b76] hover:text-[#1c1c26]"
              )}
            >
              Yearly (save 15%)
            </button>
          </div>
        </div>

        {/* Currency Selector */}
        {showCurrencySelector && (
          <div className="flex justify-center mt-8 mb-12">
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-2">
              <span className="text-sm font-medium text-foreground px-3">Currency:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayPlans.map((plan, index) => {
            const price = getDisplayPrice(plan);
            const formattedPrice = price === 0 ? 'Free' : (Number.isInteger(price) ? price.toString() : price.toFixed(2));

            // Highlight the intended center paid plan even if backend flags/name vary (e.g. "premium")
            if (plan.isPopular || isBusinessPlan(plan) || plan._id === firstPaidPlanId) {
              return (
                <div key={plan._id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="rounded-2xl border border-primary flex justify-center shadow-[0_10px_24px_hsl(var(--primary)/0.18)]">
                    <div className="relative p-8 rounded-2xl bg-[#fcfbff] w-full">
                      <div className="mb-6">
                        <span className="inline-block px-4 py-1.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-[0_6px_14px_hsl(var(--primary)/0.35)]">
                          {plan.name}
                        </span>
                      </div>

                      <p className="text-[#6b6b76] text-sm mb-6 min-h-[60px]">
                        {getPlanDescription(plan)}
                      </p>

                      <div className="mb-8">
                        {plan.price === 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-[#151520]">Free</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-4xl font-bold text-[#151520]">{selectedCurrency}{formattedPrice}</span>
                              <span className="text-xs text-[#6b6b76]">/{isYearly ? 'year' : 'month'}</span>
                            </div>
                            {isYearly && <p className="text-xs text-green-600 font-medium mt-2">Save 15% annually</p>}
                          </div>
                        )}
                      </div>

                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-[#7c4dff] flex-shrink-0 mt-0.5" />
                            <span className="text-[#2a2a35] text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleGetStarted(plan)}
                        disabled={checkoutLoading === plan._id}
                        className="w-full bg-primary hover:bg-primary/90 border border-primary text-primary-foreground py-3 rounded-lg"
                      >
                        {checkoutLoading === plan._id ? 'Processing...' : 'Get Started'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Non-featured plans
            return (
              <div
                key={plan._id}
                className="relative p-8 rounded-2xl transition-all duration-300 bg-white border border-[#e5e5ef] hover:border-[#d8d8e6]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-6">
                  <span className="inline-block px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#f0f0f4] text-[#1f1f2a] border border-[#e6e6ef]">
                    {plan.name}
                  </span>
                </div>

                <p className="text-[#6b6b76] text-sm mb-6 min-h-[60px]">
                  {getPlanDescription(plan)}
                </p>

                <div className="mb-8">
                  {plan.price === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#151520]">Free</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-[#151520]">{selectedCurrency}{formattedPrice}</span>
                        <span className="text-xs text-[#6b6b76]">/{isYearly ? 'year' : 'month'}</span>
                      </div>
                      {isYearly && <p className="text-xs text-green-600 font-medium mt-2">Save 15% annually</p>}
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#7c4dff] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2a2a35] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button onClick={() => handleGetStarted(plan)} disabled={checkoutLoading === plan._id} className="w-full bg-white border border-[#e5e5ef] hover:bg-[#f7f7fb] text-[#151520] py-3 rounded-lg">
                  {checkoutLoading === plan._id ? 'Processing...' : 'Get Started'}
                </Button>
              </div>
            );
          })}

          {/* Static Enterprise Card - Hardcoded (Same as before) */}
          <div
            className="relative p-8 rounded-2xl transition-all duration-300 bg-white border border-[#e5e5ef] hover:border-[#d8d8e6]"
            style={{ animationDelay: `${displayPlans.length * 0.1}s` }}
          >
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#f0f0f4] text-[#1f1f2a] border border-[#e6e6ef]">
                {staticEnterprisePlan.name}
              </span>
            </div>

            {/* Description */}
            <p className="text-[#6b6b76] text-sm mb-6 min-h-[60px]">
              {staticEnterprisePlan.description}
            </p>

            {/* Price - Let's Talk */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#151520]">Let's Talk!</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {staticEnterprisePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#7c4dff] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2a2a35] text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button - Book a Call */}
            <Button
              onClick={handleBookCall}
              className="w-full bg-[#11111c] text-white hover:bg-[#0c0c15]"
            >
              {staticEnterprisePlan.cta}
            </Button>
          </div>
        </div>
      </div>

      {/* Referral Code Modal */}
      <ReferralCodeModal
        open={showReferralModal}
        onOpenChange={setShowReferralModal}
        onContinue={handleProceedWithCheckout}
        isLoading={!!checkoutLoading}
      />
    </section>
  );
}
