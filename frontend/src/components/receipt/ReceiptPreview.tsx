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
      className={`bg-card rounded-xl shadow-card mx-auto print:shadow-none print:max-w-full print:p-3 ${compact ? 'p-5 max-w-[300px]' : 'p-6 max-w-md'}`}
      id={previewId}
      dir="ltr"
      style={{ direction: 'ltr', textAlign: 'left' }}
    >
      {/* Header */}
      <div className={`text-center print:mb-1.5 ${compact ? 'mb-3' : 'mb-4'}`}>
        {data.logo ? (
          <img 
            src={data.logo} 
            alt="Company Logo" 
            crossOrigin="anonymous"
            className={`object-contain mx-auto transition-transform print:mb-1 ${compact ? 'mb-1.5' : 'mb-2'}`}
            style={{ 
              height: `${(compact ? 2.2 : 2.8) * (data.logoScale || 1)}rem`,
              transform: `scale(${data.logoScale || 1})`,
              transformOrigin: 'center',
              maxHeight: compact ? '35px' : '42px'
            }}
          />
        ) : (
          <div className={`bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs mx-auto print:h-10 print:w-16 print:mb-1 ${compact ? 'h-10 w-16 mb-1.5' : 'h-12 w-20 mb-2'}`}>
            Your Logo
          </div>
        )}
        <h1 
          className={`font-bold print:text-[11px] ${compact ? 'text-base' : 'text-lg'}`}
          style={{ color: data.titleColor || undefined }}
        >
          RECEIPT VOUCHER
        </h1>
        <p className={`text-muted-foreground mt-1 print:text-[9px] print:mt-0 ${compact ? 'text-xs' : 'text-sm'}`}>#{data.receiptNumber || "---"}</p>
      </div>

      {/* Date */}
      <div className={`text-center print:mb-1.5 ${compact ? 'mb-3' : 'mb-4'}`}>
        <p className={`text-muted-foreground mb-1 print:text-[9px] ${compact ? 'text-sm' : 'text-sm'}`}>Date</p>
        <p className={`font-medium text-foreground print:text-[11px] ${compact ? 'text-sm' : 'text-base'}`}>{formatDate(data.receiptDate)}</p>
      </div>

      {/* Received From */}
      <div className={`bg-secondary/30 rounded-lg text-center print:p-1.5 print:mb-1.5 ${compact ? 'p-3 mb-3' : 'p-3.5 mb-4'}`}>
        <p className={`text-muted-foreground mb-1 print:text-[9px] print:mb-0 ${compact ? 'text-sm' : 'text-sm'}`}>Received From</p>
        <p className={`font-semibold text-foreground print:text-[11px] ${compact ? 'text-sm leading-tight' : 'text-base leading-tight'}`}>{data.receivedFrom || "---"}</p>
      </div>

      {/* Amount */}
      <div className={`text-center border-y border-border print:py-1.5 print:mb-1.5 ${compact ? 'py-3 mb-3' : 'py-4 mb-4'}`}>
        <p className={`text-muted-foreground mb-1 print:text-[9px] print:mb-0 ${compact ? 'text-sm' : 'text-sm'}`}>Amount Received</p>
        <p 
          className={`font-bold print:text-sm ${compact ? 'text-xl leading-tight' : 'text-2xl'}`}
          style={{ color: data.amountColor || undefined }}
        >
          {data.currencySymbol} {data.amount.toFixed(2)}
        </p>
        {data.paymentMethod && (
          <p className={`text-muted-foreground print:text-[9px] print:mt-0 ${compact ? 'text-xs mt-1' : 'text-sm mt-1'}`}>via {data.paymentMethod}</p>
        )}
      </div>

      {/* Reason */}
      {data.reason && (
        <div className={`bg-secondary/30 rounded-lg text-center print:p-1.5 print:mb-1.5 ${compact ? 'p-3 mb-3' : 'p-3.5 mb-4'}`}>
          <p className={`text-muted-foreground mb-1 print:text-[9px] print:mb-0 ${compact ? 'text-sm' : 'text-sm'}`}>For</p>
          <p className={`font-semibold text-foreground print:text-[11px] ${compact ? 'text-sm leading-tight' : 'text-base leading-tight'}`}>{data.reason}</p>
        </div>
      )}

      {/* Company Footer */}
      {(data.companyName || data.companyAddress || data.companyPhone) && (
        <div className={`border-t border-border print:mt-1.5 print:pt-1 ${compact ? 'mt-3 pt-2' : 'mt-4 pt-2.5'}`}>
          <div className={`text-muted-foreground flex items-center justify-center gap-1.5 whitespace-nowrap print:text-[7px] ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
            {data.companyName && (
              <span className="text-muted-foreground">{data.companyName}</span>
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
