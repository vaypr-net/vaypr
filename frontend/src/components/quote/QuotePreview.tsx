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
    <div 
      className="bg-card rounded-xl shadow-card p-8 max-w-2xl mx-auto print:shadow-none print:block print:min-h-0" 
      id={previewId}
      dir="ltr"
      style={{ direction: 'ltr', textAlign: 'left' }}
    >
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
      <div className="mt-6 mb-8 print:mb-8" style={{ width: '100%', overflow: 'visible' }}>
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

      {/* Payment Method & Bank Details & Totals Row */}
      <div className="flex justify-between items-start gap-4 mb-8 print:block" data-pdf-avoid-break="true">
        {/* Payment Method & Bank Details & Payment Terms */}
        <div className="space-y-3 flex-shrink min-w-0 max-w-[55%]">
          {data.showPaymentMethod && data.paymentMethodType && (
            <div>
              <p className="font-semibold text-foreground mb-1">Payment Method</p>
              <p className="text-sm text-foreground">
                {data.paymentMethodType === 'cash' && 'Cash'}
                {data.paymentMethodType === 'bank_transfer' && 'Bank Transfer'}
                {data.paymentMethodType === 'cheque' && 'Cheque'}
                {data.paymentMethodType === 'online_payment' && 'Online Payment'}
              </p>
            </div>
          )}
          {data.showPaymentTerms && data.paymentTerms && (
            <div className="bg-muted/30 rounded-md p-2.5 border border-border/50" data-pdf-avoid-break="true">
              <p className="font-semibold text-foreground mb-1.5 text-sm">Payment Terms</p>
              <p className="text-xs text-muted-foreground" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.4' }}>{data.paymentTerms}</p>
            </div>
          )}
          {data.showBankAccount && (data.bankAccount.bankName || data.bankAccount.accountName || data.bankAccount.iban) && (
            <div className="bg-muted/30 rounded-md p-2.5 border border-border/50" data-pdf-avoid-break="true">
              <p className="font-semibold text-foreground mb-1.5 text-sm">Bank Transfer Details</p>
              <div className="text-xs space-y-0.5">
                {data.bankAccount.bankName && (
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Bank: </span>
                    {data.bankAccount.bankName}
                  </p>
                )}
                {data.bankAccount.accountName && (
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Account Number: </span>
                    {data.bankAccount.accountName}
                  </p>
                )}
                {data.bankAccount.iban && (
                  <p className="text-foreground font-mono" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <span className="text-muted-foreground font-sans">IBAN Number: </span>
                    {data.bankAccount.iban}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="text-sm space-y-1 text-right flex-shrink-0" data-pdf-avoid-break="true">
          {!data.hideSubTotal && (
            <div className="flex justify-end gap-4 whitespace-nowrap">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="text-foreground">{data.currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div className="flex justify-end gap-4 whitespace-nowrap">
              <span className="text-muted-foreground">Discount ({data.discount}%):</span>
              <span className="text-foreground">-{data.currencySymbol} {discountAmount.toFixed(2)}</span>
            </div>
          )}
          {data.deliveryFee > 0 && (
            <div className="flex justify-end gap-4 whitespace-nowrap">
              <span className="text-muted-foreground">Delivery Fee:</span>
              <span className="text-foreground">{data.currencySymbol} {data.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-end gap-4 pt-1 whitespace-nowrap">
            <span className="font-bold text-foreground">Total:</span>
            <span className="font-bold text-base" style={{ color: data.tableHeaderColor }}>{data.currencySymbol} {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-6 p-4 bg-secondary/50 rounded-lg" data-pdf-avoid-break="true">
          <p className="text-sm font-semibold text-foreground mb-1">Notes</p>
          <p className="text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.4' }}>{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      {(data.companyFooter.companyName || data.companyFooter.address || data.companyFooter.officePhone || data.companyFooter.websiteEmail) && (
        <div className="pt-6 mt-10 border-t border-border" data-pdf-avoid-break="true">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {data.companyFooter.companyName && (
              <span className="text-muted-foreground">{data.companyFooter.companyName}</span>
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
