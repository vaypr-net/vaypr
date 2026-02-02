import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Percent, Tag, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  linkedAffiliate: string;
  status: "active" | "expired" | "disabled";
}

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
  affiliates: { id: string; name: string }[];
  onSave: (data: Coupon) => void;
}

const generateCode = () => {
  const prefixes = ["SUMMER", "WINTER", "SPRING", "FALL", "PROMO", "FLASH", "VIP", "SAVE"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 50) + 10;
  return `${prefix}${num}`;
};

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
};

export function CouponDialog({ open, onOpenChange, coupon, affiliates, onSave }: CouponDialogProps) {
  const [formData, setFormData] = useState<Omit<Coupon, "id">>({
    code: "",
    discountType: "percentage",
    discountValue: 20,
    usageLimit: 100,
    usedCount: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    linkedAffiliate: "",
    status: "active",
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        validFrom: formatDateForInput(coupon.validFrom),
        validUntil: formatDateForInput(coupon.validUntil),
        linkedAffiliate: coupon.linkedAffiliate,
        status: coupon.status,
      });
    } else {
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: 20,
        usageLimit: 100,
        usedCount: 0,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        linkedAffiliate: "",
        status: "active",
      });
    }
  }, [coupon, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: coupon?.id || crypto.randomUUID(),
      ...formData,
    });
    onOpenChange(false);
  };

  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateCode() }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <DialogTitle>{coupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          </div>
          <DialogDescription>
            Generate a discount code for your customers
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="E.G., SUMMER20"
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

          <div className="space-y-2">
            <Label>Discount Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, discountType: "percentage" }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  formData.discountType === "percentage"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formData.discountType === "percentage" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Percent className="w-5 h-5" />
                </div>
                <span className="font-medium">Percentage</span>
                <span className="text-sm text-muted-foreground">e.g., 20% off</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, discountType: "fixed" }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  formData.discountType === "fixed"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formData.discountType === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Tag className="w-5 h-5" />
                </div>
                <span className="font-medium">Fixed Amount</span>
                <span className="text-sm text-muted-foreground">e.g., 5 KD off</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountValue">Discount Value *</Label>
            <div className="relative">
              <Input
                id="discountValue"
                type="number"
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {formData.discountType === "percentage" ? "%" : "KD"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedAffiliate">Linked Affiliate (Optional)</Label>
              <Select value={formData.linkedAffiliate || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, linkedAffiliate: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select affiliate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {affiliates.map((aff) => (
                    <SelectItem key={aff.id} value={aff.id}>{aff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="status">Active Status</Label>
              <p className="text-sm text-muted-foreground">Enable this coupon for use</p>
            </div>
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? "active" : "disabled" }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {coupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
