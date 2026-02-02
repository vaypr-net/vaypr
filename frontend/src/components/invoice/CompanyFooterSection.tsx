import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyFooter } from "@/types/invoice";

interface CompanyFooterSectionProps {
  footer: CompanyFooter;
  onChange: (footer: CompanyFooter) => void;
}

export function CompanyFooterSection({ footer, onChange }: CompanyFooterSectionProps) {
  const handleChange = (field: keyof CompanyFooter, value: string) => {
    onChange({ ...footer, [field]: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Company Footer Details</h3>
      <p className="text-sm text-muted-foreground">
        Add your company details to display in the footer (e.g., "Company Name, Address - Office: Phone - Website")
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="Your company name"
            value={footer.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="officePhone">Office Phone</Label>
          <Input
            id="officePhone"
            placeholder="Office phone number"
            value={footer.officePhone}
            onChange={(e) => handleChange("officePhone", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyAddress">Address</Label>
          <Input
            id="companyAddress"
            placeholder="Company address"
            value={footer.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteEmail">Website/Email</Label>
          <Input
            id="websiteEmail"
            placeholder="Website or email"
            value={footer.websiteEmail}
            onChange={(e) => handleChange("websiteEmail", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
