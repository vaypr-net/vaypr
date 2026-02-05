import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { CommissionPlan as ApiCommissionPlan } from "@/api/services/affiliate.service";

// Extend API type with optional id for compatibility with old dialogs
export interface CommissionPlan extends ApiCommissionPlan {
  id?: string;
}

// Form data type - only editable fields
type CommissionPlanFormData = {
  name: string;
  subscriptionPlan: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  couponCode?: string;
  couponDiscount?: number;
  cookieWindow: number;
  minPayout: number;
  isActive: boolean;
};

interface CommissionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: CommissionPlan | null;
  onSave: (data: CommissionPlan) => void;
}

const generateCode = () => {
  const prefixes = ["SAVE", "DISC", "PROMO", "GET"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 50) + 10;
  return `${prefix}${num}`;
};

export function CommissionPlanDialog({ open, onOpenChange, plan, onSave }: CommissionPlanDialogProps) {
  const [formData, setFormData] = useState<CommissionPlanFormData>({
    name: "",
    subscriptionPlan: "Starter",
    commissionType: "percentage",
    commissionValue: 10,
    couponCode: "",
    couponDiscount: 10,
    cookieWindow: 30,
    minPayout: 50,
    isActive: true,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        subscriptionPlan: plan.subscriptionPlan,
        commissionType: plan.commissionType,
        commissionValue: plan.commissionValue,
        couponCode: plan.couponCode,
        couponDiscount: plan.couponDiscount,
        cookieWindow: plan.cookieWindow,
        minPayout: plan.minPayout,
        isActive: plan.isActive,
      });
    } else {
      setFormData({
        name: "",
        subscriptionPlan: "Starter",
        commissionType: "percentage",
        commissionValue: 10,
        couponCode: "",
        couponDiscount: 10,
        cookieWindow: 30,
        minPayout: 50,
        isActive: true,
      });
    }
  }, [plan, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Don't send id field - backend manages it
    onSave(formData);
    onOpenChange(false);
  };

  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, couponCode: generateCode() }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Commission Plan" : "Create Commission Plan"}</DialogTitle>
          <DialogDescription>
            Set up a new commission structure with linked coupon
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              placeholder="e.g., Gold Partner Program"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
            <Select value={formData.subscriptionPlan} onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionPlan: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
                <SelectItem value="All Plans">All Plans</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commissionType">Commission Type</Label>
              <Select value={formData.commissionType} onValueChange={(value: "percentage" | "fixed") => setFormData(prev => ({ ...prev, commissionType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (KD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionValue">Commission Value</Label>
              <div className="relative">
                <Input
                  id="commissionValue"
                  type="number"
                  min="0"
                  value={formData.commissionValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: Number(e.target.value) }))}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {formData.commissionType === "percentage" ? "%" : "KD"}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  id="couponCode"
                  placeholder="E.G., SAVE20"
                  value={formData.couponCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateCode}>
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponDiscount">Coupon Discount (%)</Label>
              <Input
                id="couponDiscount"
                type="number"
                min="0"
                max="100"
                value={formData.couponDiscount}
                onChange={(e) => setFormData(prev => ({ ...prev, couponDiscount: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cookieWindow">Cookie Window (days)</Label>
              <Input
                id="cookieWindow"
                type="number"
                min="1"
                value={formData.cookieWindow}
                onChange={(e) => setFormData(prev => ({ ...prev, cookieWindow: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPayout">Min Payout (KD)</Label>
              <Input
                id="minPayout"
                type="number"
                min="0"
                value={formData.minPayout}
                onChange={(e) => setFormData(prev => ({ ...prev, minPayout: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-muted-foreground">Enable this commission plan</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {plan ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
