import { format } from "date-fns";
import { QuoteData } from "@/types/quote";

interface QuotePreviewProps {
  data: QuoteData;
  previewId?: string;
}

export function QuotePreview({ data, previewId = "quote-preview" }: QuotePreviewProps) {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * data.discount) / 100;
  const calculatedGrandTotal = subtotal - discountAmount + data.deliveryFee;
  const grandTotal = data.useManualGrandTotal ? data.manualGrandTotal : calculatedGrandTotal;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card p-8 max-w-2xl mx-auto print:shadow-none" id={previewId}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {data.logo ? (
            <img 
              src={data.logo} 
              alt="Company Logo" 
              className="max-w-[200px] w-auto h-auto object-contain transition-transform origin-top-left"
              style={{ 
                maxHeight: `${6 * (data.logoScale || 1)}rem`,
                transform: `scale(${data.logoScale || 1})` 
              }}
            />
          ) : (
            <div className="h-16 w-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
              Your Logo
            </div>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold" style={{ color: data.tableHeaderColor }}>QUOTE</h1>
          <p className="text-muted-foreground mt-1">#{data.quoteNumber || "---"}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Quote Date</p>
          <p className="font-medium text-foreground">{formatDate(data.quoteDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valid Until</p>
          <p className="font-medium text-foreground">{formatDate(data.validUntil)}</p>
        </div>
      </div>

      {/* Client */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Quote For</p>
        <p className="font-medium text-foreground">{data.billTo.name || "Client Name"}</p>
        {data.billTo.phone && <p className="text-muted-foreground">{data.billTo.phone}</p>}
        {(data.billTo.area || data.billTo.block || data.billTo.street || data.billTo.house) && (
          <p className="text-muted-foreground">
            {[
              data.billTo.area && `Area: ${data.billTo.area}`,
              data.billTo.block && `Block: ${data.billTo.block}`,
              data.billTo.street && `Street: ${data.billTo.street}`,
              data.billTo.house && `House: ${data.billTo.house}`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        {data.billTo.other && <p className="text-muted-foreground">{data.billTo.other}</p>}
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr 
              className="border-b border-border"
              style={{ backgroundColor: data.tableHeaderColor, color: '#fff' }}
            >
              <th className="text-left py-3 px-2 text-sm font-semibold">Description</th>
              {!data.hideQuantity && <th className="text-center py-3 px-2 text-sm font-semibold">Qty</th>}
              {!data.hideUnitPrice && <th className="text-right py-3 px-2 text-sm font-semibold">Price</th>}
              {!data.hideTotalCost && <th className="text-right py-3 px-2 text-sm font-semibold">Total</th>}
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No items added
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 px-2 text-foreground">{item.description || "-"}</td>
                  {!data.hideQuantity && <td className="py-3 px-2 text-center text-foreground">{item.quantity}</td>}
                  {!data.hideUnitPrice && (
                    <td className="py-3 px-2 text-right text-foreground">
                      {data.currencySymbol} {item.unitPrice.toFixed(2)}
                    </td>
                  )}
                  {!data.hideTotalCost && (
                    <td className="py-3 px-2 text-right font-medium text-foreground">
                      {data.currencySymbol} {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          {!data.hideSubTotal && (
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>{data.currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount ({data.discount}%)</span>
              <span>-{data.currencySymbol} {discountAmount.toFixed(2)}</span>
            </div>
          )}
          {data.deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>{data.currencySymbol} {data.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border font-semibold text-lg text-foreground">
            <span>Total</span>
            <span style={{ color: data.tableHeaderColor }}>{data.currencySymbol} {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {data.showPaymentTerms && data.paymentTerms && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-1">Terms & Conditions</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.paymentTerms}</p>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-1">Notes</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}

      {/* Payment Method */}
      {data.showPaymentMethod && data.paymentMethodType && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-1">Payment Method</p>
          <p className="text-sm text-muted-foreground">
            {data.paymentMethodType === 'cash' && 'Cash'}
            {data.paymentMethodType === 'bank_transfer' && 'Bank Transfer'}
            {data.paymentMethodType === 'cheque' && 'Cheque'}
            {data.paymentMethodType === 'online_payment' && 'Online Payment'}
          </p>
        </div>
      )}

      {/* Bank Account */}
      {data.showBankAccount && (data.bankAccount.bankName || data.bankAccount.accountName || data.bankAccount.iban) && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-1">Bank Details</p>
          <div className="text-sm text-muted-foreground space-y-1">
            {data.bankAccount.bankName && <p>Bank: {data.bankAccount.bankName}</p>}
            {data.bankAccount.accountName && <p>Account Name: {data.bankAccount.accountName}</p>}
            {data.bankAccount.iban && <p>IBAN: {data.bankAccount.iban}</p>}
          </div>
        </div>
      )}

      {/* Footer */}
      {(data.companyFooter.companyName || data.companyFooter.address || data.companyFooter.officePhone || data.companyFooter.websiteEmail) && (
        <div className="pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{data.companyFooter.companyName}</p>
          <p>
            {[data.companyFooter.address, data.companyFooter.officePhone, data.companyFooter.websiteEmail]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      )}
    </div>
  );
}
