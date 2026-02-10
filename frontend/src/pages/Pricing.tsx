import { PricingSection } from '@/components/landing/PricingSection';

/**
 * Pricing Page
 * Simple page that displays all available plans using the PricingSection component
 * 
 * Flow:
 * 1. User navigates to /pricing
 * 2. See all plans (Free, Pro, Business, Enterprise)
 * 3. Click "Get Started" or "Choose Plan"
 * 4. If Free: redirects to dashboard or signup
 * 5. If Paid: requires login, then goes to Stripe checkout
 */
export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <PricingSection />
    </div>
  );
}
