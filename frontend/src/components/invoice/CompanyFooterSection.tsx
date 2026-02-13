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

  // Filter phone input to only allow numbers and + symbol
  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  // Filter email/website input with proper format validation
  const filterEmailWebsiteInput = (value: string): string => {
    // Only allow valid email/website characters
    let filtered = value.replace(/[^a-zA-Z0-9@.\-_/:]/g, '');
    
    // Remove invalid patterns like consecutive characters without @ or .
    // Valid formats: example@domain.com or www.example.com or example.com
    // Invalid: 636363hhh (no @ or . in proper position)
    
    return filtered;
  };

  const isValidEmailOrWebsite = (value: string): boolean => {
    if (!value.trim()) return true; // Empty is allowed
    
    // Valid email: user@domain.com
    const emailRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    
    // Valid website: example.com or www.example.com or https://example.com
    const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    
    return emailRegex.test(value) || websiteRegex.test(value);
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
            onChange={(e) => handleChange("officePhone", filterPhoneInput(e.target.value))}
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
            placeholder="example@domain.com or www.example.com"
            value={footer.websiteEmail}
            onChange={(e) => handleChange("websiteEmail", filterEmailWebsiteInput(e.target.value))}
            className={footer.websiteEmail && !isValidEmailOrWebsite(footer.websiteEmail) ? "border-red-500" : ""}
          />
          {footer.websiteEmail && !isValidEmailOrWebsite(footer.websiteEmail) && (
            <p className="text-xs text-red-600">
              Please enter a valid email (user@domain.com) or website (example.com)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
