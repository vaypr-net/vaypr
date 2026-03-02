import { formatDateDMY } from "@/lib/document-date";
import { ReceiptData } from "@/types/receipt";

interface ReceiptPreviewProps {
  data: ReceiptData;
  previewId?: string;
  compact?: boolean;
}

export function ReceiptPreview({ data, previewId = "receipt-preview", compact = false }: ReceiptPreviewProps) {
  const appendDot = (s?: string) => {
    if (!s) return s;
    const trimmed = s.trim();
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  };
  // kept simple rendering to match existing muted dot styling
  const formatDate = (dateStr: string) => formatDateDMY(dateStr) || "-";

  return (
    <div
      className={`bg-card rounded-xl shadow-card mx-auto print:shadow-none print:max-w-full print:p-3 ${compact ? 'p-5 max-w-[320px]' : 'p-8 max-w-md'}`}
      id={previewId}
    >
      {/* Header */}
      <div className={`text-center print:mb-2 ${compact ? 'mb-2.5' : 'mb-3'}`}>
        {data.logo ? (
          <img 
            src={data.logo} 
            alt="Company Logo" 
            className={`object-contain mx-auto transition-transform print:mb-1 ${compact ? 'mb-1.5' : 'mb-2'}`}
            style={{ 
              height: `${(compact ? 2.6 : 3.5) * (data.logoScale || 1)}rem`,
              transform: `scale(${data.logoScale || 1})`,
              transformOrigin: 'center',
              maxHeight: compact ? '40px' : '50px'
            }}
          />
        ) : (
          <div className={`bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs mx-auto print:h-12 print:w-20 print:mb-1 ${compact ? 'h-12 w-20 mb-1.5' : 'h-16 w-24 mb-2'}`}>
            Your Logo
          </div>
        )}
        <h1 
          className={`font-bold print:text-xs ${compact ? 'text-sm' : 'text-base'}`}
          style={{ color: data.titleColor || undefined }}
        >
          RECEIPT VOUCHER
        </h1>
        <p className={`text-muted-foreground mt-0.5 print:text-[10px] print:mt-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>#{data.receiptNumber || "---"}</p>
      </div>

      {/* Date */}
      <div className={`text-center print:mb-1.5 ${compact ? 'mb-2.5' : 'mb-3'}`}>
        <p className={`text-muted-foreground print:text-[10px] ${compact ? 'text-[11px]' : 'text-xs'}`}>Date</p>
        <p className={`font-medium text-foreground print:text-xs ${compact ? 'text-[11px]' : 'text-xs'}`}>{formatDate(data.receiptDate)}</p>
      </div>

      {/* Received From */}
      <div className={`bg-secondary/30 rounded-lg text-center print:p-2 print:mb-1.5 ${compact ? 'p-2.5 mb-2.5' : 'p-3 mb-3'}`}>
        <p className={`text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>Received From</p>
        <p className={`font-semibold text-foreground print:text-xs ${compact ? 'text-sm leading-tight' : 'text-sm'}`}>{data.receivedFrom || "---"}</p>
      </div>

      {/* Amount */}
      <div className={`text-center border-y border-border print:py-2 print:mb-1.5 ${compact ? 'py-2.5 mb-2.5' : 'py-3 mb-3'}`}>
        <p className={`text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>Amount Received</p>
        <p 
          className={`font-bold print:text-base ${compact ? 'text-lg leading-tight' : 'text-xl'}`}
          style={{ color: data.amountColor || undefined }}
        >
          {data.currencySymbol} {data.amount.toFixed(2)}
        </p>
        {data.paymentMethod && (
          <p className={`text-muted-foreground print:text-[10px] print:mt-0.5 ${compact ? 'text-[11px] mt-0.5' : 'text-xs mt-1'}`}>via {data.paymentMethod}</p>
        )}
      </div>

      {/* Reason */}
      {data.reason && (
        <div className={`bg-secondary/30 rounded-lg text-center print:p-2 print:mb-1.5 ${compact ? 'p-2.5 mb-2.5' : 'p-3 mb-3'}`}>
          <p className={`text-muted-foreground mb-0.5 print:text-[10px] print:mb-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>For</p>
          <p className={`font-semibold text-foreground print:text-xs ${compact ? 'text-sm leading-tight' : 'text-sm'}`}>{data.reason}</p>
        </div>
      )}

      {/* Company Footer */}
      {(data.companyName || data.companyAddress || data.companyPhone) && (
        <div className={`border-t border-border print:mt-2 print:pt-1 ${compact ? 'mt-2 pt-1.5' : 'mt-3 pt-2'}`}>
          <div className={`text-muted-foreground flex items-center justify-center gap-2 whitespace-nowrap print:text-[7px] ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
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
