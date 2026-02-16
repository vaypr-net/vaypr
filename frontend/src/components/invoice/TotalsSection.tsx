import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InvoiceItem } from "@/types/invoice";

interface TotalsSectionProps {
  items: InvoiceItem[];
  discount: number;
  deliveryFee: number;
  currencySymbol: string;
  currency: string;
  onDiscountChange: (value: number) => void;
  onDeliveryFeeChange: (value: number) => void;
  hideSubTotal?: boolean;
  useManualGrandTotal?: boolean;
  manualGrandTotal?: number;
  onHideSubTotalChange?: (hide: boolean) => void;
  onUseManualGrandTotalChange?: (use: boolean) => void;
  onManualGrandTotalChange?: (value: number) => void;
}

export function TotalsSection({
  items,
  discount,
  deliveryFee,
  currencySymbol,
  currency,
  onDiscountChange,
  onDeliveryFeeChange,
  hideSubTotal = false,
  useManualGrandTotal = false,
  manualGrandTotal = 0,
  onHideSubTotalChange,
  onUseManualGrandTotalChange,
  onManualGrandTotalChange,
}: TotalsSectionProps) {
  const subtotal = items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    const price = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
    return sum + (qty * price);
  }, 0);
  const discountAmount = (subtotal * (discount || 0)) / 100;
  const calculatedGrandTotal = subtotal - discountAmount + (deliveryFee || 0);
  const grandTotal = useManualGrandTotal ? (manualGrandTotal || 0) : calculatedGrandTotal;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Totals</h3>
      
      {/* Display Options */}
      {onHideSubTotalChange && onUseManualGrandTotalChange && (
        <div className="flex flex-wrap gap-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              id="hideSubTotal"
              checked={hideSubTotal}
              onCheckedChange={onHideSubTotalChange}
            />
            <Label htmlFor="hideSubTotal" className="text-sm cursor-pointer">
              Hide Sub Total
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="useManualGrandTotal"
              checked={useManualGrandTotal}
              onCheckedChange={onUseManualGrandTotalChange}
            />
            <Label htmlFor="useManualGrandTotal" className="text-sm cursor-pointer">
              Enter Grand Total Manually
            </Label>
          </div>
        </div>
      )}
      
      <div className="space-y-3 max-w-md">
        {!hideSubTotal && (
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Sub Total ({currency}):</span>
            <span className="font-medium text-foreground">
              {currencySymbol} {subtotal.toFixed(2)}
            </span>
          </div>
        )}

        {!useManualGrandTotal && (
          <>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="discount" className="text-muted-foreground whitespace-nowrap">
                Discount (%) (Optional):
              </Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                className="w-24 text-right"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="deliveryFee" className="text-muted-foreground whitespace-nowrap">
                Delivery Fee ({currency}) (Optional):
              </Label>
              <Input
                id="deliveryFee"
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => onDeliveryFeeChange(parseFloat(e.target.value) || 0)}
                className="w-24 text-right"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-lg font-semibold text-foreground">Grand Total ({currency}):</span>
          {useManualGrandTotal && onManualGrandTotalChange ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={manualGrandTotal}
              onChange={(e) => onManualGrandTotalChange(parseFloat(e.target.value) || 0)}
              className="w-32 text-right font-bold"
            />
          ) : (
            <span className="text-xl font-bold text-primary">
              {currencySymbol} {grandTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
