import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * CANCEL PAGE - When user cancels Stripe checkout
 * 
 * Flow:
 * 1. User is in Stripe Checkout
 * 2. Clicks "Back" or "Cancel" button
 * 3. Redirected to: /billing/cancel
 * 4. Shows message and options to continue
 */
export default function BillingCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-background p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">Checkout Canceled</h1>
          <p className="text-xl text-muted-foreground">
            You've exited the payment process. Your subscription was not activated.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <h2 className="font-bold text-lg text-foreground mb-4">What happened?</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span>No charges were made to your card</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span>Your account remains on the Free plan</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span>You can retry the upgrade anytime</span>
            </li>
          </ul>
        </div>

        {/* Why Cancel Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-blue-900">Having second thoughts?</h3>
          <p className="text-sm text-blue-900 mb-4">
            Here are some reasons to upgrade to Pro:
          </p>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>✅ Unlimited invoices & quotes (vs 5/month on Free)</li>
            <li>✅ Support up to 50 clients (vs 5 on Free)</li>
            <li>✅ Custom branding for professional look</li>
            <li>✅ API access for automation</li>
            <li>✅ Advanced analytics & insights</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Retry Upgrade */}
          <Button
            onClick={() => navigate('/pricing')}
            size="lg"
            className="w-full"
          >
            Try Upgrading Again
          </Button>

          {/* Back to Dashboard */}
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>

          {/* Continue on Free Plan */}
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full"
          >
            Continue on Free Plan
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help?{' '}
            <a href="/contact" className="text-primary underline hover:no-underline font-semibold">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
