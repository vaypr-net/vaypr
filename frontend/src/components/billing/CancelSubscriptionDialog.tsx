import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Loader,
  Check,
} from 'lucide-react';
import { billingService } from '@/api/services/billing.service';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CancellationReason,
  CancellationConfirmationResponse,
} from '@/api/services/billing.service';

interface CancellationStep {
  step: 'initial' | 'method' | 'preview' | 'feedback' | 'processing' | 'confirmation';
}

interface CancellationPreview {
  method: string;
  currentPlan: string;
  daysRemaining: number;
  periodEndDate: string;
  estimatedRefundAmount: number;
  currency: string;
  refundMessage: string;
}

/**
 * CancelSubscriptionDialog - Professional subscription cancellation flow
 * 
 * Flow:
 * 1. Ask why they're canceling (optional)
 * 2. Show cancellation method options (immediate or at period end)
 * 3. Show preview with refund/end date
 * 4. Confirm cancellation
 * 5. Show confirmation with next steps
 */
export default function CancelSubscriptionDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState<CancellationStep['step']>('initial');
  const [cancellationMethod, setCancellationMethod] = useState<'immediate' | 'at_period_end'>('immediate');
  const [refundStrategy, setRefundStrategy] = useState<'full_prorated' | 'account_credit' | 'no_refund'>('full_prorated');
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [confirmation, setConfirmation] = useState<CancellationConfirmationResponse | null>(null);
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const response = await billingService.getCancellationReasons();
        setReasons(response.reasons || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load cancellation reasons');
      }
    })();
  }, [isOpen]);

  /**
   * Step 1: Initial screen - Ask why they're canceling
   */
  const handleContinueFromInitial = () => {
    setCurrentStep('method');
  };

  /**
   * Step 2: Select cancellation method
   */
  const handleSelectMethod = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch cancellation preview
      const response = await billingService.getCancellationPreview(cancellationMethod);
      setPreview(response);
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 3: Confirm and proceed to feedback (optional)
   */
  const handleConfirmMethod = () => {
    if (reason === 'other' && !feedback) {
      setError('Please provide additional feedback');
      return;
    }
    setCurrentStep('feedback');
  };

  /**
   * Step 4: Submit cancellation request
   */
  const handleSubmitCancellation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentStep('processing');

      // Call cancel API
      const response = await billingService.cancelSubscription({
        method: cancellationMethod,
        refundStrategy,
        reason: reason || undefined,
        feedback: feedback || undefined,
      });
      setConfirmation(response);

      // Force immediate refetch of all subscription and billing related caches
      // This ensures the dashboard, profile, and settings all update immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['subscription'] }),
        queryClient.refetchQueries({ queryKey: ['billing', 'me'] }),
        queryClient.refetchQueries({ queryKey: ['billing', 'history'] }),
        queryClient.refetchQueries({ queryKey: ['user'] }),
        queryClient.refetchQueries({ queryKey: ['auth'] }),
      ]);

      setCurrentStep('confirmation');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel subscription');
      setCurrentStep('feedback');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close dialog and navigate
   */
  const handleClose = () => {
    if (currentStep === 'confirmation') {
      onClose();
      // Optional: Navigate to dashboard
      navigate('/dashboard');
    } else {
      onClose();
      // Reset form
      setCurrentStep('initial');
      setReason('');
      setFeedback('');
      setConfirmation(null);
      setPreview(null);
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* ==================== STEP 1: INITIAL - Why are you canceling? ==================== */}
      {currentStep === 'initial' && (
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">We'd like to understand your decision</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Before you go...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  You'll lose access to all Pro features at the end of your billing period. Consider
                  pausing your subscription instead.
                </p>
              </CardContent>
            </Card>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                Why are you canceling? (Optional)
              </p>
              <RadioGroup value={reason} onValueChange={setReason}>
                <div className="space-y-3">
                  {reasons.map((option) => (
                    <div key={option.value} className="flex items-center gap-3">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {reason === 'other' && (
              <div>
                <Label htmlFor="initial-feedback" className="text-sm font-semibold">
                  Tell us more (required for "Other")
                </Label>
                <Textarea
                  id="initial-feedback"
                  placeholder="Your feedback helps us improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleContinueFromInitial} className="gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* ==================== STEP 2: SELECT CANCELLATION METHOD ==================== */}
      {currentStep === 'method' && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>How would you like to cancel?</DialogTitle>
            <DialogDescription>
              Choose when you want your subscription to end
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* At Period End Option */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                cancellationMethod === 'at_period_end'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setCancellationMethod('at_period_end')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Keep Access Until Period Ends</CardTitle>
                    <CardDescription className="mt-2">
                      Your subscription will remain active until your next billing date. No refund will be issued.
                    </CardDescription>
                  </div>
                  {cancellationMethod === 'at_period_end' && (
                    <Check className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>Best option for stability</span>
                </div>
              </CardContent>
            </Card>

            {/* Immediate Cancel Option */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                cancellationMethod === 'immediate'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setCancellationMethod('immediate')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Cancel Now</CardTitle>
                    <CardDescription className="mt-2">
                      Access ends immediately. You'll receive a prorated refund for unused days within 5-7 business days.
                    </CardDescription>
                  </div>
                  {cancellationMethod === 'immediate' && (
                    <Check className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>Get refund option</span>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4 text-sm text-red-700">
                  {error}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep('initial')}>
              Back
            </Button>
            <Button
              onClick={handleSelectMethod}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader className="w-4 h-4 animate-spin" />}
              View Details
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* ==================== STEP 3: PREVIEW & CONFIRMATION ==================== */}
      {currentStep === 'preview' && preview && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review your cancellation</DialogTitle>
            <DialogDescription>
              Here's what will happen to your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
              <CardHeader>
                <CardTitle className="text-lg">Cancellation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Current Plan:</span>
                  <span className="font-semibold">{preview.currentPlan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Cancellation Method:</span>
                  <span className="font-semibold">
                    {cancellationMethod === 'immediate' ? 'Immediate' : 'At Period End'}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Access Until:</span>
                    <span className="font-semibold text-blue-600">
                      {new Date(preview.periodEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {cancellationMethod === 'immediate' && preview.estimatedRefundAmount > 0 && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-900 font-semibold">Estimated Refund:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {preview.estimatedRefundAmount.toFixed(2)} {preview.currency}
                      </span>
                    </div>
                    <p className="text-sm text-green-800 mt-2">{preview.refundMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What You'll Lose */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">What you'll lose access to:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✗ Unlimited invoices & quotes</li>
                  <li>✗ Advanced analytics</li>
                  <li>✗ API access</li>
                  <li>✗ Custom branding</li>
                  <li>✓ You'll be downgraded to Free plan (limited features)</li>
                </ul>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4 text-sm text-red-700">
                  {error}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep('method')}>
              Back
            </Button>
            <Button
              onClick={handleConfirmMethod}
              variant="destructive"
              disabled={isLoading}
              className="gap-2"
            >
              Continue Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* ==================== STEP 4: FEEDBACK (OPTIONAL) ==================== */}
      {currentStep === 'feedback' && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Any final thoughts?</DialogTitle>
            <DialogDescription>
              This helps us improve our product (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <Textarea
              placeholder="Tell us what we could have done better... (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-32"
            />

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4 text-sm text-red-700">
                  {error}
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Note:</strong> You can re-activate your subscription anytime by upgrading again. Your
                  data will be preserved.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep('preview')}>
              Back
            </Button>
            <Button
              onClick={handleSubmitCancellation}
              disabled={isLoading}
              variant="destructive"
              className="gap-2"
            >
              {isLoading && <Loader className="w-4 h-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* ==================== STEP 5: PROCESSING ==================== */}
      {currentStep === 'processing' && (
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader className="w-12 h-12 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Processing your cancellation...</h3>
            <p className="text-sm text-muted-foreground">
              Please don't close this dialog
            </p>
          </div>
        </DialogContent>
      )}

      {/* ==================== STEP 6: CONFIRMATION ==================== */}
      {currentStep === 'confirmation' && confirmation && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">✓ Subscription Canceled</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
              <CardTitle className="text-green-900">Cancellation Confirmed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-green-800">
                <p>{confirmation.message}</p>
                <p>
                  {cancellationMethod === 'immediate'
                    ? 'Your access has ended immediately.'
                    : `You will have access until ${confirmation.accessUntilDate ? new Date(confirmation.accessUntilDate).toLocaleDateString() : 'the end of your billing period'}.`}
                </p>
                {typeof confirmation.refundAmount === 'number' && confirmation.refundAmount > 0 && (
                  <p>
                    Refund: {confirmation.refundAmount.toFixed(2)} {confirmation.refundCurrency} ({confirmation.refundStatus})
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What happens next:</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary min-w-6">1.</span>
                    <span>Your account has been downgraded to the Free plan</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary min-w-6">2.</span>
                    <span>
                      {cancellationMethod === 'immediate'
                        ? 'Your refund will be processed within 5-7 business days'
                        : 'Keep using Pro features until your billing period ends'}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary min-w-6">3.</span>
                    <span>You can always upgrade again whenever you're ready</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary min-w-6">4.</span>
                    <span>Your data and invoices remain safe</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
