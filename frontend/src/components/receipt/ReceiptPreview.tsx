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
    <div className="bg-card rounded-xl shadow-card p-8 max-w-md mx-auto print:shadow-none print:max-w-full print:p-3" id={previewId}>
      {/* Header */}
      <div className="text-center mb-3 print:mb-2">
        {data.logo ? (
          <img 
            src={data.logo} 
            alt="Company Logo" 
            className="object-contain mx-auto mb-2 transition-transform print:mb-1"
            style={{ 
              height: `${3.5 * (data.logoScale || 1)}rem`,
              transform: `scale(${data.logoScale || 1})`,
              transformOrigin: 'center',
              maxHeight: '50px'
            }}
          />
        ) : (
          <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs mx-auto mb-2 print:h-12 print:w-20 print:mb-1">
            Your Logo
          </div>
        )}
        <h1 
          className="text-base font-bold print:text-xs"
          style={{ color: data.titleColor || undefined }}
        >
          RECEIPT VOUCHER
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5 print:text-[10px] print:mt-0.5">#{data.receiptNumber || "---"}</p>
      </div>

      {/* Date */}
      <div className="text-center mb-3 print:mb-1.5">
        <p className="text-xs text-muted-foreground print:text-[10px]">Date</p>
        <p className="font-medium text-foreground text-xs print:text-xs">{formatDate(data.receiptDate)}</p>
      </div>

      {/* Received From */}
      <div className="bg-secondary/30 rounded-lg p-3 mb-3 text-center print:p-2 print:mb-1.5">
        <p className="text-xs text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5">Received From</p>
        <p className="font-semibold text-foreground text-sm print:text-xs">{data.receivedFrom || "---"}</p>
      </div>

      {/* Amount */}
      <div className="text-center py-3 border-y border-border mb-3 print:py-2 print:mb-1.5">
        <p className="text-xs text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5">Amount Received</p>
        <p 
          className="text-xl font-bold print:text-base"
          style={{ color: data.amountColor || undefined }}
        >
          {data.currencySymbol} {data.amount.toFixed(2)}
        </p>
        {data.paymentMethod && (
          <p className="text-xs text-muted-foreground mt-1 print:text-[10px] print:mt-0.5">via {data.paymentMethod}</p>
        )}
      </div>

      {/* Reason */}
      {data.reason && (
        <div className="bg-secondary/30 rounded-lg p-3 mb-3 text-center print:p-2 print:mb-1.5">
          <p className="text-xs text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5">For</p>
          <p className="font-semibold text-foreground text-sm print:text-xs">{data.reason}</p>
        </div>
      )}

      {/* Company Footer */}
      {(data.companyName || data.companyAddress || data.companyPhone) && (
        <div className="mt-3 pt-2 border-t border-border print:mt-2 print:pt-1">
          <div className="text-[8px] text-muted-foreground flex items-center justify-center gap-2 whitespace-nowrap print:text-[7px]">
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
