import { formatDateDMY } from "@/lib/document-date";
import { InvoiceData } from "@/types/invoice";

interface InvoicePreviewProps {
  data: InvoiceData;
  previewId?: string;
}

export function InvoicePreview({ data, previewId = "invoice-preview" }: InvoicePreviewProps) {
  // kept simple rendering to match existing muted dot styling
  const subtotal = data.items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    const price = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
    return sum + (qty * price);
  }, 0);
  const discountAmount = (subtotal * (data.discount || 0)) / 100;
  const calculatedGrandTotal = subtotal - discountAmount + (data.deliveryFee || 0);
  const grandTotal = data.useManualGrandTotal ? (data.manualGrandTotal || 0) : calculatedGrandTotal;

  const formatDate = (dateStr: string) => formatDateDMY(dateStr) || "-";

  const formatCurrency = (amount: number) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `${data.currency} ${validAmount.toFixed(2)}`;
  };

  const showQuantity = !data.hideQuantity;
  const showUnitPrice = !data.hideUnitPrice;
  const showTotalCost = !data.hideTotalCost;
  const visibleColumnCount =
    1 + (showQuantity ? 1 : 0) + (showUnitPrice ? 1 : 0) + (showTotalCost ? 1 : 0);

  return (
    <div className="bg-background max-w-2xl mx-auto print:shadow-none" id={previewId}>
      {/* Document Container */}
      <div className="bg-card p-8">
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
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2" style={{ color: data.tableHeaderColor || '#000000' }}>Invoice</h2>
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

        {/* Items Table */}
        <div className="mb-8 print:mb-8" style={{ width: '100%', overflow: 'visible' }}>
          <table className="w-full text-sm border-collapse" style={{ width: '100%' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              {showQuantity && <col style={{ width: '15%' }} />}
              {showUnitPrice && <col style={{ width: '18%' }} />}
              {showTotalCost && <col style={{ width: '17%' }} />}
            </colgroup>
            <thead>
              <tr 
                className="text-white"
                style={{ backgroundColor: data.tableHeaderColor || '#000000' }}
              >
                <th className="text-left py-3 px-4 font-semibold" style={{ width: '50%' }}>Item description</th>
                {showQuantity && (
                  <th className="text-center py-3 px-3 font-semibold" style={{ width: '15%' }}>
                    Qty.
                  </th>
                )}
                {showUnitPrice && (
                  <th className="text-right py-3 px-3 font-semibold" style={{ width: '18%' }}>
                    Unit Price
                  </th>
                )}
                {showTotalCost && (
                  <th className="text-right py-3 px-4 font-semibold" style={{ width: '17%' }}>
                    Total Cost
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td 
                    colSpan={visibleColumnCount}
                    className="py-6 text-center text-muted-foreground border-b border-border"
                  >
                    No items added
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-4 px-4 text-foreground break-words" style={{ width: '50%' }}>
                      {item.description || "-"}
                    </td>
                    {showQuantity && (
                      <td className="py-4 px-3 text-center text-foreground" style={{ width: '15%' }}>
                        {item.quantity || 0}
                      </td>
                    )}
                    {showUnitPrice && (
                      <td className="py-4 px-3 text-right text-foreground" style={{ width: '18%' }}>
                        {formatCurrency(item.unitPrice || 0)}
                      </td>
                    )}
                    {showTotalCost && (
                      <td className="py-4 px-4 text-right text-foreground" style={{ width: '17%' }}>
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Method & Bank Details & Totals Row */}
        <div className="flex justify-between items-start gap-4 mb-8">
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
              <div className="bg-muted/30 rounded-md p-2.5 border border-border/50">
                <p className="font-semibold text-foreground mb-1.5 text-sm">Payment Terms</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{data.paymentTerms}</p>
              </div>
            )}
            {data.showBankAccount && (data.bankAccount.bankName || data.bankAccount.accountName || data.bankAccount.iban) && (
              <div className="bg-muted/30 rounded-md p-2.5 border border-border/50">
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
                      <span className="text-muted-foreground">Account: </span>
                      {data.bankAccount.accountName}
                    </p>
                  )}
                  {data.bankAccount.iban && (
                    <p className="text-foreground font-mono break-all">
                      <span className="text-muted-foreground font-sans">IBAN: </span>
                      {data.bankAccount.iban}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="text-sm space-y-1 text-right flex-shrink-0">
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
              <span className="font-bold text-base" style={{ color: data.tableHeaderColor || '#000000' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Company Footer Details */}
        {(data.companyFooter.companyName || data.companyFooter.address || data.companyFooter.officePhone || data.companyFooter.websiteEmail) && (
          <div className="border-t border-border pt-6">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 whitespace-nowrap">
              {data.companyFooter.companyName && (
                <span className="font-semibold text-foreground">{data.companyFooter.companyName}</span>
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
