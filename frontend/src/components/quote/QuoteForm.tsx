import { Input } from "@/components/ui/input";
import { DocumentDateInput } from "@/components/ui/document-date-input";
import { Label } from "@/components/ui/label";
import { QuoteData } from "@/types/quote";

interface QuoteFormProps {
  data: QuoteData;
  onChange: (data: QuoteData) => void;
}

export function QuoteForm({ data, onChange }: QuoteFormProps) {
  const updateField = <K extends keyof QuoteData>(field: K, value: QuoteData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Quote Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quoteNumber">Quote Number</Label>
          <Input
            id="quoteNumber"
            placeholder="QT-001"
            value={data.quoteNumber}
            onChange={(e) => updateField("quoteNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quoteDate">Quote Date</Label>
          <DocumentDateInput
            id="quoteDate"
            value={data.quoteDate}
            onChange={(value) => updateField("quoteDate", value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid Until</Label>
          <DocumentDateInput
            id="validUntil"
            value={data.validUntil}
            onChange={(value) => updateField("validUntil", value)}
          />
        </div>
      </div>
    </div>
  );
}
