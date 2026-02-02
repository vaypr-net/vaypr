import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Copy, Trash2, Check, Star, Users, X, Phone } from "lucide-react";
import { mockPlans, Plan } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function formatPlanPrice(value: number) {
  if (value === 0) return "Free";
  if (value === -1) return "Let's Talk!";
  return `KD${value}`;
}

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onDuplicate: (plan: Plan) => void;
}

function PlanCard({ plan, onEdit, onDelete, onDuplicate }: PlanCardProps) {
  const isEnterprise = plan.price === -1;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-admin relative flex flex-col ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="w-3 h-3 mr-1" /> Most Popular
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <Badge variant={plan.isPopular ? "default" : "outline"} className={plan.isPopular ? "bg-primary" : ""}>
          {plan.name}
        </Badge>
        <StatusBadge status={plan.status === "active" ? "active" : "inactive"} />
      </div>

      <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
        {plan.price === 0 && "Perfect for freelancers and small businesses just getting started with professional invoicing."}
        {plan.price > 0 && plan.price !== -1 && "Ideal for growing businesses that need full access to invoicing, quotes, and expense tracking."}
        {plan.price === -1 && "For larger organizations needing custom solutions, dedicated support, and advanced features."}
      </p>

      <div className="mb-6">
        <p className="text-4xl font-bold">
          {formatPlanPrice(plan.price)}
          {plan.price > 0 && plan.price !== -1 && <span className="text-base font-normal text-muted-foreground">/month</span>}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Users className="w-4 h-4" />
        <span>{plan.subscriberCount.toLocaleString()} subscribers</span>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className={`w-full py-3 rounded-lg text-center font-medium mb-4 ${
          plan.isPopular 
            ? 'bg-primary text-primary-foreground' 
            : isEnterprise 
              ? 'bg-foreground text-background' 
              : 'bg-secondary text-secondary-foreground border border-border'
        }`}>
          {isEnterprise ? (
            <span className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> Book a Call
            </span>
          ) : "Get Started"}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(plan)}>
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDuplicate(plan)}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(plan)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    interval: "monthly" as "monthly" | "yearly",
    status: "active" as "active" | "hidden" | "archived",
    features: "",
    invoices: "",
    quotes: "",
    clients: "",
    storage: "",
    receipts: "",
    recurringInvoices: "",
    expenseTracking: false,
    invoiceTemplates: "Basic",
    isPopular: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      interval: "monthly",
      status: "active",
      features: "",
      invoices: "",
      quotes: "",
      clients: "",
      storage: "",
      receipts: "",
      recurringInvoices: "",
      expenseTracking: false,
      invoiceTemplates: "Basic",
      isPopular: false,
    });
  };

  const openEditDialog = (plan: Plan) => {
    setFormData({
      name: plan.name,
      price: plan.price === -1 ? "-1" : plan.price.toString(),
      interval: plan.interval,
      status: plan.status,
      features: plan.features.join("\n"),
      invoices: plan.limits.invoices.toString(),
      quotes: plan.limits.quotes.toString(),
      clients: plan.limits.clients.toString(),
      storage: plan.limits.storage,
      receipts: plan.limits.receipts.toString(),
      recurringInvoices: plan.limits.recurringInvoices.toString(),
      expenseTracking: plan.limits.expenseTracking,
      invoiceTemplates: plan.limits.invoiceTemplates,
      isPopular: plan.isPopular || false,
    });
    setEditingPlan(plan);
  };

  const handleSave = () => {
    const newPlan: Plan = {
      id: editingPlan?.id || Date.now().toString(),
      name: formData.name,
      price: parseInt(formData.price) || 0,
      currency: "KWD",
      interval: formData.interval,
      status: formData.status,
      features: formData.features.split("\n").filter(f => f.trim()),
      limits: {
        invoices: parseInt(formData.invoices) || -1,
        quotes: parseInt(formData.quotes) || -1,
        clients: parseInt(formData.clients) || -1,
        teamMembers: 1,
        storage: formData.storage || "1GB",
        receipts: parseInt(formData.receipts) || -1,
        recurringInvoices: parseInt(formData.recurringInvoices) || -1,
        expenseTracking: formData.expenseTracking,
        invoiceTemplates: formData.invoiceTemplates,
      },
      isPopular: formData.isPopular,
      subscriberCount: editingPlan?.subscriberCount || 0,
    };

    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? newPlan : p));
      toast.success(`Plan "${newPlan.name}" updated successfully`);
    } else {
      setPlans([...plans, newPlan]);
      toast.success(`Plan "${newPlan.name}" created successfully`);
    }

    setEditingPlan(null);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleDuplicate = (plan: Plan) => {
    const duplicatedPlan: Plan = {
      ...plan,
      id: Date.now().toString(),
      name: `${plan.name} (Copy)`,
      subscriberCount: 0,
    };
    setPlans([...plans, duplicatedPlan]);
    toast.success(`Plan "${plan.name}" duplicated`);
  };

  const handleDelete = () => {
    if (deletingPlan) {
      setPlans(plans.filter(p => p.id !== deletingPlan.id));
      toast.success(`Plan "${deletingPlan.name}" deleted`);
      setDeletingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Plans & Billing</h1>
          <p className="page-subtitle">Manage subscription plans and billing settings</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input 
                    placeholder="e.g., Business Pro" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Price (KD) - Use -1 for "Let's Talk"</Label>
                  <Input 
                    type="number" 
                    placeholder="10" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Billing Interval</Label>
                  <select 
                    className="w-full h-10 px-3 border border-input rounded-md bg-background"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value as "monthly" | "yearly" })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select 
                    className="w-full h-10 px-3 border border-input rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "hidden" | "archived" })}
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea 
                  rows={4} 
                  placeholder="Unlimited invoices&#10;Priority support&#10;Custom branding" 
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Invoices/mo</Label>
                  <Input 
                    type="number" 
                    placeholder="-1 for unlimited" 
                    value={formData.invoices}
                    onChange={(e) => setFormData({ ...formData, invoices: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quotes/mo</Label>
                  <Input 
                    type="number" 
                    placeholder="-1 for unlimited" 
                    value={formData.quotes}
                    onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Receipts/mo</Label>
                  <Input 
                    type="number" 
                    placeholder="-1 for unlimited" 
                    value={formData.receipts}
                    onChange={(e) => setFormData({ ...formData, receipts: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Clients</Label>
                  <Input 
                    type="number" 
                    placeholder="-1 for unlimited" 
                    value={formData.clients}
                    onChange={(e) => setFormData({ ...formData, clients: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Recurring Invoices/mo</Label>
                  <Input 
                    type="number" 
                    placeholder="-1 for unlimited" 
                    value={formData.recurringInvoices}
                    onChange={(e) => setFormData({ ...formData, recurringInvoices: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Invoice Templates</Label>
                  <select 
                    className="w-full h-10 px-3 border border-input rounded-md bg-background"
                    value={formData.invoiceTemplates}
                    onChange={(e) => setFormData({ ...formData, invoiceTemplates: e.target.value })}
                  >
                    <option value="Basic">Basic</option>
                    <option value="All">All</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <Label>Storage</Label>
                  <Input 
                    placeholder="10GB" 
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch 
                    id="expense-tracking" 
                    checked={formData.expenseTracking}
                    onCheckedChange={(checked) => setFormData({ ...formData, expenseTracking: checked })}
                  />
                  <Label htmlFor="expense-tracking">Expense Tracking</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="popular" 
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <Label htmlFor="popular">Mark as "Most Popular"</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>Create Plan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => { if (!open) { setEditingPlan(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input 
                  placeholder="e.g., Business Pro" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (KD) - Use -1 for "Let's Talk"</Label>
                <Input 
                  type="number" 
                  placeholder="10" 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Interval</Label>
                <select 
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value as "monthly" | "yearly" })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select 
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "hidden" | "archived" })}
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Features (one per line)</Label>
              <Textarea 
                rows={4} 
                placeholder="Unlimited invoices&#10;Priority support&#10;Custom branding" 
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Invoices/mo</Label>
                <Input 
                  type="number" 
                  placeholder="-1 for unlimited" 
                  value={formData.invoices}
                  onChange={(e) => setFormData({ ...formData, invoices: e.target.value })}
                />
              </div>
              <div>
                <Label>Quotes/mo</Label>
                <Input 
                  type="number" 
                  placeholder="-1 for unlimited" 
                  value={formData.quotes}
                  onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
                />
              </div>
              <div>
                <Label>Receipts/mo</Label>
                <Input 
                  type="number" 
                  placeholder="-1 for unlimited" 
                  value={formData.receipts}
                  onChange={(e) => setFormData({ ...formData, receipts: e.target.value })}
                />
              </div>
              <div>
                <Label>Clients</Label>
                <Input 
                  type="number" 
                  placeholder="-1 for unlimited" 
                  value={formData.clients}
                  onChange={(e) => setFormData({ ...formData, clients: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Recurring Invoices/mo</Label>
                <Input 
                  type="number" 
                  placeholder="-1 for unlimited" 
                  value={formData.recurringInvoices}
                  onChange={(e) => setFormData({ ...formData, recurringInvoices: e.target.value })}
                />
              </div>
              <div>
                <Label>Invoice Templates</Label>
                <select 
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.invoiceTemplates}
                  onChange={(e) => setFormData({ ...formData, invoiceTemplates: e.target.value })}
                >
                  <option value="Basic">Basic</option>
                  <option value="All">All</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <Label>Storage</Label>
                <Input 
                  placeholder="10GB" 
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch 
                  id="expense-tracking-edit" 
                  checked={formData.expenseTracking}
                  onCheckedChange={(checked) => setFormData({ ...formData, expenseTracking: checked })}
                />
                <Label htmlFor="expense-tracking-edit">Expense Tracking</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="popular-edit" 
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
              <Label htmlFor="popular-edit">Mark as "Most Popular"</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setEditingPlan(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPlan?.name}"? This action cannot be undone.
              {deletingPlan && deletingPlan.subscriberCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This plan has {deletingPlan.subscriberCount} active subscribers.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {plans.map((plan) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  onEdit={openEditDialog}
                  onDelete={setDeletingPlan}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-admin"
            >
              <h3 className="text-lg font-semibold mb-4">Default Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label>Default Currency</Label>
                  <select className="w-full h-10 px-3 border border-input rounded-md mt-1 bg-background">
                    <option value="KWD">Kuwait - Kuwaiti Dinar (KWD)</option>
                    <option value="BHD">Bahrain - Bahraini Dinar (BHD)</option>
                    <option value="AED">UAE - Emirati Dirham (AED)</option>
                    <option value="OMR">Oman - Omani Rial (OMR)</option>
                    <option value="QAR">Qatar - Qatari Riyal (QAR)</option>
                    <option value="SAR">Saudi Arabia - Saudi Riyal (SAR)</option>
                    <option value="USD">United States - US Dollar (USD)</option>
                    <option value="EUR">Europe - Euro (EUR)</option>
                    <option value="GBP">United Kingdom - Pound Sterling (GBP)</option>
                  </select>
                </div>
                <div>
                  <Label>Invoice Number Prefix</Label>
                  <Input defaultValue="INV-" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-apply tax</p>
                    <p className="text-sm text-muted-foreground">Automatically calculate and apply tax</p>
                  </div>
                  <Switch />
                </div>
                <Button>Save Settings</Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-admin"
            >
              <h3 className="text-lg font-semibold mb-4">Payment Provider</h3>
              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <StatusBadge status="active" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Webhook Status</span>
                  <StatusBadge status="active" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="font-medium">2 minutes ago</span>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}