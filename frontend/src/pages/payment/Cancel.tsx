import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-orange-500/5 to-background flex items-center justify-center">
      <div className="max-w-md text-center p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-orange-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            If you encountered any issues during checkout, please try again or contact our support team.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/pricing')} className="flex-1">
            Try Again
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Need help? Contact us at support@vaypr.com
        </p>
      </div>
    </div>
  );
}
