import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * SUCCESS PAGE - After user completes Stripe payment
 * 
 * Flow:
 * 1. User completes payment on Stripe
 * 2. Stripe redirects to: /billing/success?session_id=cs_test_...
 * 3. Waits for webhook to process
 * 4. Invalidates subscription cache so dashboard gets fresh data
 * 5. Navigates to dashboard
 */
export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const navigateToDashboard = async () => {
      try {
        // Wait for webhook to process (Stripe is fast but not instant)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Force immediate refetch of ALL related caches after subscription update
        // This ensures user data, plan limits, and domain access are all refreshed
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['subscription'] }),
          queryClient.refetchQueries({ queryKey: ['billing', 'me'] }),
          queryClient.refetchQueries({ queryKey: ['billing', 'history'] }),
          queryClient.refetchQueries({ queryKey: ['user'] }),
          queryClient.refetchQueries({ queryKey: ['auth'] }),
          queryClient.refetchQueries({ queryKey: ['domain-usage'] }),
          queryClient.refetchQueries({ queryKey: ['user-domains'] }),
        ]);

        // Navigate to dashboard - it will fetch the updated subscription
        navigate('/dashboard');
      } catch (err) {
        console.error('Error processing payment:', err);
        navigate('/dashboard');
      }
    };

    navigateToDashboard();
  }, [sessionId, queryClient, navigate]);

  // Just show a loading message while we process and navigate
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background">
      <div className="text-center space-y-4">
        <Loader className="w-12 h-12 animate-spin text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Completing your subscription...</h2>
        <p className="text-muted-foreground">
          We're processing your payment and updating your account. You'll be redirected to your dashboard shortly.
        </p>
      </div>
    </div>
  );
}
