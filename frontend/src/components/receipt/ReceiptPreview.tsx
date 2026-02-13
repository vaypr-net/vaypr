import { format } from "date-fns";
import { ReceiptData } from "@/types/receipt";

interface ReceiptPreviewProps {
  data: ReceiptData;
  previewId?: string;
}

export function ReceiptPreview({ data, previewId = "receipt-preview" }: ReceiptPreviewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card p-8 max-w-md mx-auto print:shadow-none" id={previewId}>
      {/* Header */}
      <div className="text-center mb-6">
        {data.logo ? (
          <img 
            src={data.logo} 
            alt="Company Logo" 
            className="object-contain mx-auto mb-3 transition-transform"
            style={{ 
              height: `${3.5 * (data.logoScale || 1)}rem`,
              transform: `scale(${data.logoScale || 1})`,
              transformOrigin: 'center'
            }}
          />
        ) : (
          <div className="h-20 w-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm mx-auto mb-3">
            Your Logo
          </div>
        )}
        <h1 
          className="text-2xl font-bold"
          style={{ color: data.titleColor || undefined }}
        >
          RECEIPT VOUCHER
        </h1>
        <p className="text-muted-foreground text-sm mt-1">#{data.receiptNumber || "---"}</p>
      </div>

      {/* Date */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">Date</p>
        <p className="font-medium text-foreground">{formatDate(data.receiptDate)}</p>
      </div>

      {/* Received From */}
      <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Received From</p>
        <p className="font-semibold text-foreground text-lg">{data.receivedFrom || "---"}</p>
      </div>

      {/* Amount */}
      <div className="text-center py-6 border-y border-border mb-6">
        <p className="text-sm text-muted-foreground mb-1">Amount Received</p>
        <p 
          className="text-3xl font-bold"
          style={{ color: data.amountColor || undefined }}
        >
          {data.currencySymbol} {data.amount.toFixed(2)}
        </p>
        {data.paymentMethod && (
          <p className="text-sm text-muted-foreground mt-2">via {data.paymentMethod}</p>
        )}
      </div>

      {/* Reason */}
      {data.reason && (
        <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">For</p>
          <p className="font-semibold text-foreground text-lg">{data.reason}</p>
        </div>
      )}

      {/* Company Footer */}
      {(data.companyName || data.companyAddress || data.companyPhone) && (
        <div className="mt-6 pt-4 border-t border-border text-center text-[10px] text-muted-foreground">
          <p className="font-medium text-foreground">{data.companyName}</p>
          <p>{[data.companyAddress, data.companyPhone].filter(Boolean).join(" • ")}</p>
        </div>
      )}
    </div>
  );
}
