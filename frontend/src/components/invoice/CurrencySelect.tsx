import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/types/invoice";

interface CurrencySelectProps {
  value: string;
  onChange: (code: string, symbol: string) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const handleChange = (code: string) => {
    const currency = currencies.find((c) => c.code === code);
    if (currency) {
      onChange(code, currency.symbol);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Select Currency</h3>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.name} ({currency.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
