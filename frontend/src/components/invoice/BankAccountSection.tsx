import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2 } from "lucide-react";

interface BankAccount {
  bankName: string;
  accountName: string;
  iban: string;
}

interface BankAccountSectionProps {
  showBankAccount: boolean;
  bankAccount: BankAccount;
  onToggle: (show: boolean) => void;
  onChange: (bankAccount: BankAccount) => void;
}

export function BankAccountSection({
  showBankAccount,
  bankAccount,
  onToggle,
  onChange,
}: BankAccountSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bank Account Details</h3>
            <p className="text-sm text-muted-foreground">
              Show bank transfer information on your invoice
            </p>
          </div>
        </div>
        <Switch checked={showBankAccount} onCheckedChange={onToggle} />
      </div>

      {showBankAccount && (
        <div className="grid gap-4 pt-2 pl-11 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="e.g., National Bank of Kuwait"
              value={bankAccount.bankName}
              onChange={(e) => onChange({ ...bankAccount, bankName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Number</Label>
            <Input
              id="accountName"
              placeholder="e.g., 1234567890"
              value={bankAccount.accountName}
              onChange={(e) => onChange({ ...bankAccount, accountName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN Number</Label>
            <Input
              id="iban"
              placeholder="e.g., KW81CBKU0000000000001234560101"
              value={bankAccount.iban}
              onChange={(e) => onChange({ ...bankAccount, iban: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
