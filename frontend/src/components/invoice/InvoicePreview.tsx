import { formatDateDMY } from "@/lib/document-date";
import { InvoiceData } from "@/types/invoice";

interface InvoicePreviewProps {
  data: InvoiceData;
  previewId?: string;
}

export function InvoicePreview({ data, previewId = "invoice-preview" }: InvoicePreviewProps) {
  const resolvedTableHeaderColor =
    typeof data.tableHeaderColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(data.tableHeaderColor.trim())
      ? data.tableHeaderColor
      : "#000000";

  // kept simple rendering to match existing muted dot styling
  const subtotal = data.items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    const price = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
    return sum + (qty * price);
  }, 0);
  const discountAmount = (subtotal * (data.discount || 0)) / 100;
  const calculatedGrandTotal = subtotal - discountAmount + (data.deliveryFee || 0);
  const normalizedManualGrandTotal = Number(data.manualGrandTotal) || 0;
  const hasQuantifiableItems = data.items.some(
    (item) => Number(item.quantity) > 0 || Number(item.unitPrice) > 0,
  );
  const useManualGrandTotal =
    data.useManualGrandTotal && (normalizedManualGrandTotal > 0 || !hasQuantifiableItems);
  const grandTotal = useManualGrandTotal ? normalizedManualGrandTotal : calculatedGrandTotal;

  const formatDate = (dateStr: string) => formatDateDMY(dateStr) || "-";

  const formatCurrency = (amount: number) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `${data.currency} ${validAmount.toFixed(2)}`;
  };

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

  return (
    <div 
      className="bg-background max-w-2xl mx-auto print:shadow-none" 
      id={previewId}
      dir="ltr"
      style={{ direction: 'ltr', textAlign: 'left' }}
    >
      {/* Document Container */}
      <div className="bg-card p-8 print:block print:min-h-0">
        {/* Header - Logo left, Invoice info right */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo / Company Name */}
          <div className="max-w-[200px]">
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
            ) : data.companyFooter.companyName ? (
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {data.companyFooter.companyName}
              </h1>
            ) : (
              <div className="h-20 w-40 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm font-medium">
                Your Logo
              </div>
            )}
          </div>

          {/* Invoice Title & Meta */}
          <div className="text-right self-start">
            <h2 className="text-2xl font-bold mb-2" style={{ color: resolvedTableHeaderColor }}>Invoice</h2>
            <div className="text-sm space-y-0.5">
              <p className="text-foreground">
                <span className="text-muted-foreground">Invoice#: </span>
                <span className="font-medium">{data.invoiceNumber || "---"}</span>
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Invoice Date: </span>
                {formatDate(data.invoiceDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Billed To Section - Gray Box */}
        <div className="bg-muted/50 rounded-sm p-6 mb-8">
          <p className="font-semibold text-foreground mb-2">Billed to</p>
          <div className="text-sm text-foreground space-y-0.5">
            <p>{data.billTo.name || "Customer Name"}</p>
            {(data.billTo.area || data.billTo.block || data.billTo.street || data.billTo.house) && (
              <p>
                {[
                  data.billTo.area,
                  data.billTo.block && `Block ${data.billTo.block}`,
                  data.billTo.street && `Street ${data.billTo.street}`,
                  data.billTo.house && `House ${data.billTo.house}`,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
            {data.billTo.phone && <p>{data.billTo.phone}</p>}
            {data.billTo.other && <p>{data.billTo.other}</p>}
          </div>
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
                className="text-white"
                style={{ backgroundColor: resolvedTableHeaderColor }}
              >
                <th className="text-left py-3 px-4 font-semibold" style={{ verticalAlign: 'middle' }}>Item description</th>
                <th className={showQuantity ? "text-center py-3 px-3 font-semibold" : ""} style={!showQuantity ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : { verticalAlign: 'middle' }}>
                  {showQuantity ? 'Qty.' : ''}
                </th>
                <th className={showUnitPrice ? "text-right py-3 px-3 font-semibold" : ""} style={!showUnitPrice ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : { verticalAlign: 'middle' }}>
                  {showUnitPrice ? 'Unit Price' : ''}
                </th>
                <th className={showTotalCost ? "text-right py-3 px-4 font-semibold" : ""} style={!showTotalCost ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : { verticalAlign: 'middle' }}>
                  {showTotalCost ? 'Total Cost' : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td 
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground border-b border-border"
                  >
                    No items added
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-4 px-4 text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word', lineHeight: '1.5', hyphens: 'auto' }}>
                      {item.description || "-"}
                    </td>
                    <td className={showQuantity ? "py-4 px-3 text-center text-foreground" : ""} style={!showQuantity ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : {}}>
                      {showQuantity ? (item.quantity || 0) : ''}
                    </td>
                    <td className={showUnitPrice ? "py-4 px-3 text-right text-foreground" : ""} style={!showUnitPrice ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : {}}>
                      {showUnitPrice ? formatCurrency(item.unitPrice || 0) : ''}
                    </td>
                    <td className={showTotalCost ? "py-4 px-4 text-right text-foreground" : ""} style={!showTotalCost ? { padding: 0, fontSize: 0, overflow: 'hidden', border: 'none', lineHeight: 0 } : {}}>
                      {showTotalCost ? formatCurrency((item.quantity || 0) * (item.unitPrice || 0)) : ''}
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
            {!data.hideSubTotal && !data.useManualGrandTotal && (
              <div className="flex justify-end gap-4 whitespace-nowrap">
                <span className="text-muted-foreground">Sub Total:</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>
            )}
            {!data.useManualGrandTotal && data.discount > 0 && (
              <div className="flex justify-end gap-4 whitespace-nowrap">
                <span className="text-muted-foreground">Discount ({data.discount}%):</span>
                <span className="text-foreground">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {!data.useManualGrandTotal && data.deliveryFee > 0 && (
              <div className="flex justify-end gap-4 whitespace-nowrap">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span className="text-foreground">{formatCurrency(data.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-end gap-4 pt-1 whitespace-nowrap">
              <span className="font-bold text-foreground">Grand Total:</span>
              <span className="font-bold text-base" style={{ color: resolvedTableHeaderColor }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Company Footer Details */}
        {(data.companyFooter.companyName || data.companyFooter.address || data.companyFooter.officePhone || data.companyFooter.websiteEmail) && (
          <div className="border-t border-border pt-6 mt-10" data-pdf-avoid-break="true">
            <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {data.companyFooter.companyName && (
                <span className="text-muted-foreground">{data.companyFooter.companyName}</span>
              )}
              {([data.companyFooter.address, data.companyFooter.officePhone, data.companyFooter.websiteEmail]
                .filter(Boolean) as string[]).length > 0 && (
                <span className="text-muted-foreground">• {([data.companyFooter.address, data.companyFooter.officePhone, data.companyFooter.websiteEmail].filter(Boolean) as string[]).join(' • ')}</span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
