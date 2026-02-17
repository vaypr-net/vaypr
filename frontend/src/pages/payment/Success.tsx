import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/api/axios';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setVerifying(false);
      return;
    }

    // Verify the session with backend
    const verifySession = async () => {
      try {
        const response = await axiosInstance.get(
          `/billing/verify-session/${sessionId}`
        );
        
        setSessionDetails(response.data);
        setVerifying(false);
      } catch (err: any) {
        console.error('Session verification error:', err);
        setError(err.response?.data?.message || 'Failed to verify payment');
        setVerifying(false);
      }
    };

    // Delay verification slightly to ensure webhook has processed
    const timer = setTimeout(() => {
      verifySession();
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verifying your payment...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your subscription</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-red-500/5 to-background flex items-center justify-center">
        <div className="max-w-md text-center p-8 bg-card border border-border rounded-lg shadow-lg">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Verification Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/pricing')} variant="outline">
              Back to Pricing
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-green-500/5 to-background flex items-center justify-center">
      <div className="max-w-md text-center p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Payment Successful! 🎉</h1>
        <p className="text-muted-foreground mb-6">
          {sessionDetails?.message || 'Your subscription is now active.'}
        </p>

        {sessionDetails && (
          <div className="bg-muted p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">Subscription Details:</p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold">Status:</span>{' '}
                <span className="text-green-600 capitalize">{sessionDetails.status}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Subscription ID:</span>{' '}
                <span className="font-mono text-xs">{sessionDetails.subscriptionId}</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/dashboard')} className="w-48">
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
