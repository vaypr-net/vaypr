import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, AlertCircle } from "lucide-react";
import { Affiliate } from "@/api/services/affiliate.service";
import { cn } from "@/lib/utils";

interface AddAffiliateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate?: Affiliate | null;
  onSave: (data: Partial<Affiliate>) => void;
}

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d+\s\-()]*$/;
  return phoneRegex.test(phone);
};

const filterPhoneInput = (value: string): string => {
  return value.replace(/[^\d+\s\-()]/g, "");
};

export function AddAffiliateDialog({ open, onOpenChange, affiliate, onSave }: AddAffiliateDialogProps) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || "",
    email: affiliate?.email || "",
    phone: affiliate?.phone || "",
    code: affiliate?.code || "",
    tier: affiliate?.tier || "Bronze",
    status: affiliate?.status || "active",
  });

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!open) return;

    setFormData({
      name: affiliate?.name || "",
      email: affiliate?.email || "",
      phone: affiliate?.phone || "",
      code: affiliate?.code || "",
      tier: affiliate?.tier || "Bronze",
      status: affiliate?.status || "active",
    });
    setPhoneError("");
    setEmailError("");
  }, [affiliate, open]);

  const handleEmailChange = (value: string) => {
    const sanitizedValue = value.replace(/\s/g, "");
    setFormData(prev => ({ ...prev, email: sanitizedValue }));
    
    if (sanitizedValue && !validateEmail(sanitizedValue)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    const filteredValue = filterPhoneInput(value);
    setFormData(prev => ({ ...prev, phone: filteredValue }));

    if (!validatePhone(filteredValue)) {
      setPhoneError("Phone can only contain numbers, +, spaces, hyphens, and parentheses");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Only send editable fields (name, email, phone, code, tier, status)
    // Backend manages referrals, earnings, pending automatically
    onSave(formData);
    onOpenChange(false);
    setFormData({ name: "", email: "", phone: "", code: "", tier: "Bronze", status: "active" });
    setPhoneError("");
    setEmailError("");
  };

  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateCode() }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{affiliate ? "Edit Affiliate" : "Add New Affiliate"}</DialogTitle>
          <DialogDescription>
            {affiliate ? "Update affiliate partner details" : "Create a new affiliate partner account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter affiliate name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={cn(
                "transition-colors",
                emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              )}
              required
            />
            {emailError && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              placeholder="+965 XXXX XXXX"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={cn(
                "transition-colors",
                phoneError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              )}
            />
            {phoneError && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {phoneError}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="E.G., PARTNER20"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleGenerateCode} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Commission Tier</Label>
              <Select value={formData.tier} onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "active" | "inactive" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.email || !!emailError}>
              {affiliate ? "Save Changes" : "Add Affiliate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
