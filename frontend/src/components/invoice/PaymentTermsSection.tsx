import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PaymentTermsSectionProps {
  showPaymentTerms: boolean;
  paymentTerms: string;
  onToggle: (show: boolean) => void;
  onChange: (terms: string) => void;
}

export function PaymentTermsSection({
  showPaymentTerms,
  paymentTerms,
  onToggle,
  onChange,
}: PaymentTermsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Payment Terms</h3>
          <p className="text-sm text-muted-foreground">
            Add terms and conditions for payment
          </p>
        </div>
        <Switch
          checked={showPaymentTerms}
          onCheckedChange={onToggle}
        />
      </div>

      {showPaymentTerms && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="paymentTerms">Terms & Conditions</Label>
          <Textarea
            id="paymentTerms"
            placeholder="e.g., Payment is due within 30 days of invoice date. Late payments may incur a 2% monthly fee..."
            value={paymentTerms}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      )}
    </div>
  );
}
