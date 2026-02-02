import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogoUpload } from "@/components/invoice/LogoUpload";
import { LogoSizeControl } from "@/components/invoice/LogoSizeControl";
import { CurrencySelect } from "@/components/invoice/CurrencySelect";
import { ClientSelector } from "@/components/invoice/ClientSelector";
import { ReceiptData } from "@/types/receipt";

const paymentMethods = [
  { value: "Cash", label: "Cash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Online Payment", label: "Online Payment" },
  { value: "Cheque", label: "Cheque" },
];

interface ReceiptFormProps {
  data: ReceiptData;
  onChange: (data: ReceiptData) => void;
}

export function ReceiptForm({ data, onChange }: ReceiptFormProps) {
  const updateField = <K extends keyof ReceiptData>(field: K, value: ReceiptData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Logo & Currency */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-6">
        <LogoUpload
          logo={data.logo}
          onLogoChange={(logo) => updateField("logo", logo)}
        />
        {data.logo && (
          <LogoSizeControl
            value={data.logoScale}
            onChange={(logoScale) => updateField("logoScale", logoScale)}
          />
        )}
        <div className="border-t border-border pt-6">
          <CurrencySelect
            value={data.currency}
            onChange={(currency, currencySymbol) =>
              onChange({ ...data, currency, currencySymbol })
            }
          />
        </div>
      </section>

      {/* Receipt Info */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Receipt Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <Input
              id="receiptNumber"
              placeholder="RV-001"
              value={data.receiptNumber}
              onChange={(e) => updateField("receiptNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptDate">Date</Label>
            <Input
              id="receiptDate"
              type="date"
              value={data.receiptDate}
              onChange={(e) => updateField("receiptDate", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Received From */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Received From</h3>
        <ClientSelector
          value={data.receivedFrom}
          onChange={(name) => updateField("receivedFrom", name)}
          label="Customer Name"
        />
      </section>

      {/* Payment Details */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={data.amount || ""}
              onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={data.paymentMethod}
              onValueChange={(value) => updateField("paymentMethod", value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">For / Reason</Label>
          <Textarea
            id="reason"
            placeholder="Payment for..."
            value={data.reason}
            onChange={(e) => updateField("reason", e.target.value)}
          />
        </div>
      </section>

      {/* Company Info */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Your company"
              value={data.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone</Label>
            <Input
              id="companyPhone"
              placeholder="Company phone"
              value={data.companyPhone}
              onChange={(e) => updateField("companyPhone", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Input
              id="companyAddress"
              placeholder="Company address"
              value={data.companyAddress}
              onChange={(e) => updateField("companyAddress", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Color Customization */}
      <section className="bg-card rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Color Customization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titleColor">Title Color (HEX)</Label>
            <div className="flex gap-2">
              <Input
                id="titleColor"
                placeholder="#000000"
                value={data.titleColor}
                onChange={(e) => updateField("titleColor", e.target.value)}
              />
              <input
                type="color"
                value={data.titleColor || "#000000"}
                onChange={(e) => updateField("titleColor", e.target.value)}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountColor">Amount Color (HEX)</Label>
            <div className="flex gap-2">
              <Input
                id="amountColor"
                placeholder="#000000"
                value={data.amountColor}
                onChange={(e) => updateField("amountColor", e.target.value)}
              />
              <input
                type="color"
                value={data.amountColor || "#000000"}
                onChange={(e) => updateField("amountColor", e.target.value)}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
