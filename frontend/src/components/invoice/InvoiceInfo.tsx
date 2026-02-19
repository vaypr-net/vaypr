import { Input } from "@/components/ui/input";
import { DocumentDateInput } from "@/components/ui/document-date-input";
import { Label } from "@/components/ui/label";

interface InvoiceInfoProps {
  invoiceNumber: string;
  invoiceDate: string;
  onInvoiceNumberChange: (value: string) => void;
  onInvoiceDateChange: (value: string) => void;
}

export function InvoiceInfo({
  invoiceNumber,
  invoiceDate,
  onInvoiceNumberChange,
  onInvoiceDateChange,
}: InvoiceInfoProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Invoice Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            placeholder="INV-001"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <DocumentDateInput
            id="invoiceDate"
            value={invoiceDate}
            onChange={onInvoiceDateChange}
          />
        </div>
      </div>
    </div>
  );
}
