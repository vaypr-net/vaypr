/**
 * COMPLETE FLOW: LOGIN → DASHBOARD → UPGRADE
 * 
 * This shows how to integrate billing into your dashboard and manage features
 */

// ==================== Step 1: DASHBOARD INTEGRATION ====================

import { BillingStatus } from '@/components/dashboard/BillingStatus';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureGate, LimitedFeatureBanner } from '@/components/billing/FeatureGate';

export function DashboardPage() {
  const { planName, isActive } = useBillingStatus();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground">
          Current Plan: <span className="font-semibold text-primary">{planName}</span>
          {isActive && <span className="ml-2 text-green-600">✅ Active</span>}
        </p>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="billing">Billing & Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <StatCard
              title="Total Invoices"
              value="24"
              subtitle="Created this month"
              canAccess={true}
            />
            <StatCard
              title="Pending Payments"
              value="KWD 450"
              subtitle="Awaiting payment"
              canAccess={true}
            />
            <StatCard
              title="Team Members"
              value="1"
              subtitle="Add more with Pro"
              canAccess={planName !== 'Free'}
              upgradeText="Pro plan required"
            />
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceSection />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Step 2: FEATURE-GATED COMPONENT ====================

function InvoiceSection() {
  const { canInvoices, planName } = useBillingStatus();
  const [invoiceCount, setInvoiceCount] = React.useState(5);
  const maxInvoices = planName === 'Free' ? 5 : 999;

  return (
    <div className="space-y-4">
      {/* Usage Banner for Free Plan */}
      {planName === 'Free' && (
        <LimitedFeatureBanner
          current={invoiceCount}
          max={maxInvoices}
          feature="invoices"
          upgradeLink
        />
      )}

      {/* Feature Gate */}
      <FeatureGate feature="invoices" requiredPlan="Pro">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Your Invoices</h3>

          {/* Invoice List */}
          <div className="grid gap-4">
            {/* Mock invoice items */}
            {[1, 2, 3].map((inv) => (
              <div key={inv} className="p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">Invoice #INV-{inv}</p>
                    <p className="text-sm text-muted-foreground">KWD {100 * inv}.00</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            + Create Invoice
          </button>
        </div>
      </FeatureGate>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  canAccess: boolean;
  upgradeText?: string;
}

function StatCard({ title, value, subtitle, canAccess, upgradeText }: StatCardProps) {
  return (
    <div className="p-6 rounded-lg border bg-card">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-bold mb-1">{canAccess ? value : '?'}</p>
      {canAccess ? (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      ) : (
        <p className="text-xs text-amber-600 font-semibold">{upgradeText}</p>
      )}
    </div>
  );
}

// ==================== Step 3: COMPLETE USER JOURNEY ====================

/**
 * 📍 USER JOURNEY AFTER LOGIN:
 * 
 * 1. User logs in successfully
 *    ↓
 * 2. Redirected to dashboard (this page)
 *    ↓
 * 3. Sees current plan: "Free" (from useBillingStatus hook)
 *    ↓
 * 4. If Free plan:
 *    - See limited features (5 invoices max)
 *    - See usage bar: "5 / 5 invoices"
 *    - Cannot access Team Members feature
 *    - See "Upgrade" buttons
 *    ↓
 * 5. Click "Upgrade Now" button:
 *    - Redirects to /pricing
 *    - Can select Monthly/Yearly
 *    - Click "Get Started" on Pro/Business
 *    ↓
 * 6. Redirect to Stripe Checkout
 *    - Enter card: 4242 4242 4242 4242
 *    - Complete payment
 *    ↓
 * 7. Webhook activates subscription (backend)
 *    - Updates user.planId = Pro
 *    - Updates user.subscriptionStatus = "active"
 *    - Creates Transaction record
 *    ↓
 * 8. User redirected to /billing/success
 *    - Shows confirmation message
 *    - Has link back to dashboard
 *    ↓
 * 9. User returns to dashboard
 *    - useBillingStatus refetches data
 *    - Now shows: "Pro" plan
 *    - All features unlocked
 *    - See "Manage Subscription" button
 *    - Can access custom branding, API, etc.
 */

// ==================== Step 4: USAGE IN FEATURE COMPONENTS ====================

/**
 * Example: How to use in your Invoices component
 */
export function ExampleInvoicesPage() {
  const { canInvoices, planName } = useBillingStatus();

  // Show different UI based on plan
  return (
    <FeatureGate feature="invoices" requiredPlan="Pro">
      <div>
        <h1>Invoices</h1>
        <p>You're on the {planName} plan</p>
        {/* Invoice functionality */}
      </div>
    </FeatureGate>
  );
}

/**
 * Example: How to check feature access without feature gate
 */
export function ExampleCustomBrandingPage() {
  const { canCustomBranding, planName } = useBillingStatus();

  if (!canCustomBranding) {
    return (
      <div className="p-8 text-center">
        <h2>Custom Branding</h2>
        <p>Available on Pro plan and above. You're currently on {planName}.</p>
        <button onClick={() => navigate('/pricing')}>Upgrade Now</button>
      </div>
    );
  }

  return <CustomBrandingSettings />;
}

/**
 * Example: How to show usage limits
 */
export function ExampleClientsPage() {
  const { planName } = useBillingStatus();
  const [clientCount, setClientCount] = React.useState(42);
  const maxClients = planName === 'Free' ? 5 : planName === 'Pro' ? 50 : 999;

  return (
    <div>
      <LimitedFeatureBanner
        current={clientCount}
        max={maxClients}
        feature="clients"
        upgradeLink={clientCount >= maxClients}
      />
      {/* Clients list */}
    </div>
  );
}

// ==================== Step 5: BILLING PAGE IN DASHBOARD ====================

/**
 * Full Billing Settings Page accessible from Dashboard
 * Contains:
 * - Current Plan info
 * - Usage stats
 * - Billing Portal link (Manage Subscription)
 * - Upgrade options
 * - Payment method (from Stripe)
 * - Invoice history
 */
export function BillingSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your plan, payment method, and billing settings
        </p>
      </div>

      <BillingStatus />
    </div>
  );
}
