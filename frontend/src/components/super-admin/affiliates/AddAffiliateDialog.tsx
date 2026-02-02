import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { Affiliate } from "@/data/mockData";

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

export function AddAffiliateDialog({ open, onOpenChange, affiliate, onSave }: AddAffiliateDialogProps) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || "",
    email: affiliate?.email || "",
    phone: affiliate?.phone || "",
    code: affiliate?.code || "",
    tier: affiliate?.tier || "Bronze",
    status: affiliate?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      referrals: affiliate?.referrals || 0,
      earnings: affiliate?.earnings || 0,
      pending: affiliate?.pending || 0,
    });
    onOpenChange(false);
    setFormData({ name: "", email: "", phone: "", code: "", tier: "Bronze", status: "active" });
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
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              placeholder="+965 XXXX XXXX"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
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
            <Button type="submit">
              {affiliate ? "Save Changes" : "Add Affiliate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
