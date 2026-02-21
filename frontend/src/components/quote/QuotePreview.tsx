import { formatDateDMY } from "@/lib/document-date";
import { QuoteData } from "@/types/quote";

interface QuotePreviewProps {
  data: QuoteData;
  previewId?: string;
}

export function QuotePreview({ data, previewId = "quote-preview" }: QuotePreviewProps) {
  // kept simple rendering to match existing muted dot styling
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * data.discount) / 100;
  const calculatedGrandTotal = subtotal - discountAmount + data.deliveryFee;
  const normalizedManualGrandTotal = Number(data.manualGrandTotal) || 0;
  const hasQuantifiableItems = data.items.some(
    (item) => Number(item.quantity) > 0 || Number(item.unitPrice) > 0,
  );
  const useManualGrandTotal =
    data.useManualGrandTotal && (normalizedManualGrandTotal > 0 || !hasQuantifiableItems);
  const grandTotal = useManualGrandTotal ? normalizedManualGrandTotal : calculatedGrandTotal;

  const formatDate = (dateStr: string) => formatDateDMY(dateStr) || "-";

  const showQuantity = !data.hideQuantity;
  const showUnitPrice = !data.hideUnitPrice;
  const showTotalCost = !data.hideTotalCost;

  // Calculate dynamic column widths based on visible columns
  const getColumnWidths = () => {
    const visibleCols = [showQuantity, showUnitPrice, showTotalCost].filter(Boolean).length;
    if (visibleCols === 0) return { desc: '100%', qty: '0%', price: '0%', total: '0%' };
    if (visibleCols === 1) return { desc: '65%', qty: showQuantity ? '35%' : '0%', price: showUnitPrice ? '35%' : '0%', total: showTotalCost ? '35%' : '0%' };
    if (visibleCols === 2) {
      return {
        desc: '50%',
        qty: showQuantity ? '25%' : '0%',
        price: showUnitPrice ? '25%' : '0%',
        total: showTotalCost ? '25%' : '0%',
      };
    }
    return { desc: '40%', qty: '20%', price: '20%', total: '20%' };
  };
  const colWidths = getColumnWidths();
  const hiddenStyle: React.CSSProperties = { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 };

  return (
    <div className="bg-card rounded-xl shadow-card p-8 max-w-2xl mx-auto print:shadow-none print:min-h-[270mm] print:flex print:flex-col" id={previewId}>
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

      {/* Items Table - All 4 columns always rendered for html2canvas compatibility */}
      <div className="mb-8 print:mb-8" style={{ width: '100%', overflow: 'visible' }}>
        <table className="w-full text-sm" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: colWidths.desc }} />
            <col style={{ width: colWidths.qty }} />
            <col style={{ width: colWidths.price }} />
            <col style={{ width: colWidths.total }} />
          </colgroup>
          <thead>
            <tr 
              className="border-b border-border"
              style={{ backgroundColor: data.tableHeaderColor, color: '#fff' }}
            >
              <th className="text-left py-3 px-2 text-sm font-semibold">Description</th>
              <th className={showQuantity ? "text-center py-3 px-2 text-sm font-semibold" : ""} style={!showQuantity ? hiddenStyle : {}}>
                {showQuantity ? 'Qty' : ''}
              </th>
              <th className={showUnitPrice ? "text-right py-3 px-2 text-sm font-semibold" : ""} style={!showUnitPrice ? hiddenStyle : {}}>
                {showUnitPrice ? 'Price' : ''}
              </th>
              <th className={showTotalCost ? "text-right py-3 px-2 text-sm font-semibold" : ""} style={!showTotalCost ? hiddenStyle : {}}>
                {showTotalCost ? 'Total' : ''}
              </th>
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
                  <td className="py-3 px-2 text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word', lineHeight: '1.5', hyphens: 'auto' }}>
                    {item.description || "-"}
                  </td>
                  <td className={showQuantity ? "py-3 px-2 text-center text-foreground" : ""} style={!showQuantity ? hiddenStyle : {}}>
                    {showQuantity ? (item.quantity || 0) : ''}
                  </td>
                  <td className={showUnitPrice ? "py-3 px-2 text-right text-foreground" : ""} style={!showUnitPrice ? hiddenStyle : {}}>
                    {showUnitPrice ? `${data.currencySymbol} ${(item.unitPrice || 0).toFixed(2)}` : ''}
                  </td>
                  <td className={showTotalCost ? "py-3 px-2 text-right font-medium text-foreground" : ""} style={!showTotalCost ? hiddenStyle : {}}>
                    {showTotalCost ? `${data.currencySymbol} ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}` : ''}
                  </td>
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
          <p className="text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.4' }}>{data.paymentTerms}</p>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-1">Notes</p>
          <p className="text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.4' }}>{data.notes}</p>
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
        <div className="pt-6 border-t border-border print:mt-auto">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 whitespace-nowrap">
            {data.companyFooter.companyName && (
              <span className="font-semibold text-foreground">{data.companyFooter.companyName}</span>
            )}
            {([data.companyFooter.address, data.companyFooter.officePhone, data.companyFooter.websiteEmail].filter(Boolean) as string[]).length > 0 && (
              <span className="text-muted-foreground">• {([data.companyFooter.address, data.companyFooter.officePhone, data.companyFooter.websiteEmail].filter(Boolean) as string[]).join(' • ')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
