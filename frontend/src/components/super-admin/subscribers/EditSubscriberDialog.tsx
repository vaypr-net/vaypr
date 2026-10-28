import { useGetPlans } from '@/hooks/api/useBillingPlans';
import { useEffect, useState } from "react";
import { Subscriber } from "@/api/services/subscriber.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasPaidAccess } from './SubscriberManagementDialog';
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, XCircle } from "lucide-react";
import { useUpdateSubscriber } from "@/hooks/api/useSubscribers";

interface EditSubscriberDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEndPaidAccess: (subscriber: Subscriber) => void;
}


export function EditSubscriberDialog({
  subscriber,
  open,
  onOpenChange,
  onEndPaidAccess,
}: EditSubscriberDialogProps) {
  const { data: plansData } = useGetPlans('active', 500);
  const availablePlans = (plansData?.items || []).slice().sort((a, b) => (a.price < 0 ? Infinity : a.price) - (b.price < 0 ? Infinity : b.price)).map(plan => plan.name);
  const [name, setName] = useState(subscriber?.name || "");
  const [email, setEmail] = useState(subscriber?.email || "");
  const [mobile, setMobile] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(subscriber?.plan || "");
  const updateSubscriberMutation = useUpdateSubscriber();

  // Reset form when subscriber changes
  useEffect(() => {
    if (subscriber) {
      setName(subscriber.name);
      setEmail(subscriber.email);
      setSelectedPlan(subscriber.plan);
    }
  }, [subscriber]);

  const currentPlanIndex = availablePlans.indexOf(subscriber?.plan || "");
  const selectedPlanIndex = availablePlans.indexOf(selectedPlan);
  const isUpgrade = selectedPlanIndex > currentPlanIndex;
  const isDowngrade = selectedPlanIndex < currentPlanIndex;

  const mapPlanToStatus = (planName: string): "active" | "free" => {
    return planName.toLowerCase() === "free" ? "free" : "active";
  };

  const handleSave = async () => {
    if (!subscriber) return;
    await updateSubscriberMutation.mutateAsync({
      id: subscriber._id,
      data: {
        name,
        email,
        ...(selectedPlan !== subscriber.plan ? { plan: selectedPlan, status: mapPlanToStatus(selectedPlan) } : {}),
      },
    });
    toast.success("Subscriber profile updated successfully");
    onOpenChange(false);
  };

  const handlePlanChange = (direction: "upgrade" | "downgrade") => {
    const currentIndex = availablePlans.indexOf(selectedPlan);
    if (direction === "upgrade" && currentIndex < availablePlans.length - 1) {
      setSelectedPlan(availablePlans[currentIndex + 1]);
    } else if (direction === "downgrade" && currentIndex > 0) {
      setSelectedPlan(availablePlans[currentIndex - 1]);
    }
  };

  if (!subscriber) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscriber Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Profile Information */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <Separator />

            {/* Plan Management */}
            <div className="space-y-3">
              <Label>Subscription Plan</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan !== subscriber.plan && (
                <p className="text-sm text-muted-foreground">
                  {isUpgrade ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      Upgrading from {subscriber.plan} to {selectedPlan}
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" />
                      Downgrading from {subscriber.plan} to {selectedPlan}
                    </span>
                  )}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePlanChange("upgrade")}
                  disabled={selectedPlanIndex >= availablePlans.length - 1}
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Upgrade Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePlanChange("downgrade")}
                  disabled={selectedPlanIndex <= 0}
                >
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Downgrade Plan
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Paid Access</Label>
              <p className="text-sm text-muted-foreground">Access changes and refunds are managed separately.</p>
              {hasPaidAccess(subscriber) && <Button variant="destructive" className="w-full" onClick={() => onEndPaidAccess(subscriber)}><XCircle className="w-4 h-4 mr-2" />End Paid Access</Button>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateSubscriberMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
