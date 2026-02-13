import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CURRENCY_CONFIG } from "@/config/currency.config";

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null); // Track which plan is being checked out
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const supportedCurrencies = CURRENCY_CONFIG.supportedCurrencies;

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
        const response = await fetch(`${apiBaseUrl}/billing-plans`);
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        setPlans(data.items || []);
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

    // User is logged in → proceed with checkout
    console.log('Paid plan + logged in → initiating checkout');
    setCheckoutLoading(plan._id);

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

      console.log('Creating checkout session for:', plan.name);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan._id,
          billingCycle: isYearly ? 'yearly' : 'monthly',
          currency: selectedCurrency,
        }),
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

  if (error) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Filter out Enterprise plan from API if it exists, show all other plans
  // The hardcoded Enterprise plan will be rendered separately
  const displayPlans = plans.filter(p => p.name !== "Enterprise");

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Choose your right plan!
          </h2>
          <p className="text-muted-foreground text-lg">
            Select from best plans, ensuring a perfect match. Need more or less?
            <br />
            Customize your subscription for a seamless fit!
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                !isYearly
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                isYearly
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly (save 15%)
            </button>
          </div>
        </div>

        {/* Currency Selector */}
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayPlans.map((plan, index) => (
            <div
              key={plan._id}
              className={cn(
                "relative p-8 rounded-2xl transition-all duration-300 hover-lift",
                plan.isPopular
                  ? "bg-card border-2 border-primary shadow-xl"
                  : "bg-card border border-border hover:border-primary/30"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Badge */}
              <div className="mb-6">
                <span
                  className={cn(
                    "inline-block px-4 py-1.5 rounded-lg text-sm font-semibold",
                    plan.isPopular
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border border-border"
                  )}
                >
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div className="mb-8">
                {plan.price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">Free</span>
                  </div>
                ) : (
                  <div>
                    {/* Show KWD Price (plan.price is already in KWD from backend) */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-foreground">
                        {getDisplayPrice(plan).toFixed(2)}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        {selectedCurrency}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      /{isYearly ? "year" : "month"}
                    </span>
                    {selectedCurrency !== CURRENCY_CONFIG.displayCurrency && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (Billing in {selectedCurrency} at checkout)
                      </p>
                    )}
                    {isYearly && (
                      <p className="text-xs text-green-600 font-medium mt-2">
                        Save 15% annually
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleGetStarted(plan)}
                disabled={checkoutLoading === plan._id}
                className={cn(
                  "w-full",
                  plan.isPopular
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-transparent border border-border hover:bg-muted"
                )}
                variant={plan.isPopular ? "default" : "outline"}
              >
                {checkoutLoading === plan._id ? 'Processing...' : 'Get Started'}
              </Button>
            </div>
          ))}

          {/* Static Enterprise Card - Hardcoded (Same as before) */}
          <div
            className="relative p-8 rounded-2xl transition-all duration-300 hover-lift bg-card border border-border hover:border-primary/30"
            style={{ animationDelay: `${displayPlans.length * 0.1}s` }}
          >
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-lg text-sm font-semibold bg-muted text-foreground border border-border">
                {staticEnterprisePlan.name}
              </span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6 min-h-[60px]">
              {staticEnterprisePlan.description}
            </p>

            {/* Price - Let's Talk */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">Let's Talk!</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {staticEnterprisePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button - Book a Call */}
            <Button
              onClick={handleBookCall}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {staticEnterprisePlan.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
