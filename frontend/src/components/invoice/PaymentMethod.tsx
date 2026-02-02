import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethodType } from "@/types/invoice";

interface PaymentMethodProps {
  showPaymentMethod: boolean;
  paymentMethodType: PaymentMethodType;
  onToggle: (show: boolean) => void;
  onMethodChange: (method: PaymentMethodType) => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online_payment', label: 'Online Payment' },
] as const;

export function PaymentMethod({ 
  showPaymentMethod, 
  paymentMethodType, 
  onToggle, 
  onMethodChange 
}: PaymentMethodProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Payment Method</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="showPaymentMethod" className="text-sm text-muted-foreground">
            Show on invoice
          </Label>
          <Switch
            id="showPaymentMethod"
            checked={showPaymentMethod}
            onCheckedChange={onToggle}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Select the payment method to display on the document
      </p>
      {showPaymentMethod && (
        <div className="space-y-2">
          <Label htmlFor="paymentMethodType">Payment Method</Label>
          <Select 
            value={paymentMethodType} 
            onValueChange={(value: PaymentMethodType) => onMethodChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
