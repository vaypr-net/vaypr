import { formatDateDMY } from "@/lib/document-date";
import { ReceiptData } from "@/types/receipt";

interface ReceiptPreviewProps {
  data: ReceiptData;
  previewId?: string;
}

export function ReceiptPreview({ data, previewId = "receipt-preview" }: ReceiptPreviewProps) {
  const appendDot = (s?: string) => {
    if (!s) return s;
    const trimmed = s.trim();
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  };
  // kept simple rendering to match existing muted dot styling
  const formatDate = (dateStr: string) => formatDateDMY(dateStr) || "-";

  return (
    <div className="bg-card rounded-xl shadow-card p-8 max-w-md mx-auto print:shadow-none print:max-w-full print:p-6" id={previewId}>
      {/* Header */}
      <div className="text-center mb-6">
        {data.logo ? (
          <img 
            src={data.logo} 
            alt="Company Logo" 
            className="object-contain mx-auto mb-3 transition-transform print:mb-2"
            style={{ 
              height: `${3.5 * (data.logoScale || 1)}rem`,
              transform: `scale(${data.logoScale || 1})`,
              transformOrigin: 'center'
            }}
          />
        ) : (
          <div className="h-20 w-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm mx-auto mb-3 print:h-16 print:w-24">
            Your Logo
          </div>
        )}
        <h1 
          className="text-2xl font-bold print:text-xl"
          style={{ color: data.titleColor || undefined }}
        >
          RECEIPT VOUCHER
        </h1>
        <p className="text-muted-foreground text-sm mt-1 print:text-xs">#{data.receiptNumber || "---"}</p>
      </div>

      {/* Date */}
      <div className="text-center mb-6 print:mb-3">
        <p className="text-sm text-muted-foreground print:text-xs">Date</p>
        <p className="font-medium text-foreground print:text-sm">{formatDate(data.receiptDate)}</p>
      </div>

      {/* Received From */}
      <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center print:p-3 print:mb-3">
        <p className="text-sm text-muted-foreground mb-1 print:text-xs print:mb-0.5">Received From</p>
        <p className="font-semibold text-foreground text-lg print:text-base">{data.receivedFrom || "---"}</p>
      </div>

      {/* Amount */}
      <div className="text-center py-6 border-y border-border mb-6 print:py-4 print:mb-3">
        <p className="text-sm text-muted-foreground mb-1 print:text-xs print:mb-0.5">Amount Received</p>
        <p 
          className="text-3xl font-bold print:text-2xl"
          style={{ color: data.amountColor || undefined }}
        >
          {data.currencySymbol} {data.amount.toFixed(2)}
        </p>
        {data.paymentMethod && (
          <p className="text-sm text-muted-foreground mt-2 print:text-xs print:mt-1">via {data.paymentMethod}</p>
        )}
      </div>

      {/* Reason */}
      {data.reason && (
        <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center print:p-3 print:mb-3">
          <p className="text-sm text-muted-foreground mb-1 print:text-xs print:mb-0.5">For</p>
          <p className="font-semibold text-foreground text-lg print:text-base">{data.reason}</p>
        </div>
      )}

      {/* Company Footer */}
      {(data.companyName || data.companyAddress || data.companyPhone) && (
        <div className="mt-6 pt-4 border-t border-border print:mt-3 print:pt-2">
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-2 whitespace-nowrap print:text-[8px]">
            {data.companyName && (
              <span className="font-semibold text-foreground">{data.companyName}</span>
            )}
            {([data.companyAddress, data.companyPhone].filter(Boolean) as string[]).length > 0 && (
              <span className="text-muted-foreground">• {([data.companyAddress, data.companyPhone].filter(Boolean) as string[]).join(' • ')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
