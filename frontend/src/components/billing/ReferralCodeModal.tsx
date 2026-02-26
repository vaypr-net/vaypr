import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift } from 'lucide-react';

interface ReferralCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (referralCode?: string) => void;
  isLoading?: boolean;
}

export function ReferralCodeModal({
  open,
  onOpenChange,
  onContinue,
  isLoading = false,
}: ReferralCodeModalProps) {
  const [referralCode, setReferralCode] = useState('');

  const handleContinue = () => {
    // Trim and pass the referral code (empty string if not provided)
    onContinue(referralCode.trim() || undefined);
  };

  const handleSkip = () => {
    setReferralCode('');
    onContinue(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Have a Referral Code?</DialogTitle>
          </div>
          <DialogDescription>
            If you have a referral code from an affiliate, enter it below to get started.
            This is optional and you can skip this step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="uppercase"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">What is a referral code?</p>
            <p>
              Referral codes are provided by our affiliates. If someone referred you to our platform,
              they may have shared a code with you.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
