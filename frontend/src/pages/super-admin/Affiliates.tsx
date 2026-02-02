import { useState } from "react";
import { motion } from "framer-motion";
import { Users2, DollarSign, TrendingUp, Gift, Eye, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { mockAffiliates, mockReferrals, Affiliate } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { AddAffiliateDialog } from "@/components/super-admin/affiliates/AddAffiliateDialog";
import { CommissionPlanDialog, CommissionPlan } from "@/components/super-admin/affiliates/CommissionPlanDialog";
import { CouponDialog, Coupon } from "@/components/super-admin/affiliates/CouponDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Initial mock data for commission plans
const initialCommissionPlans: CommissionPlan[] = [
  { id: "1", name: "Bronze Partner", subscriptionPlan: "Starter", commissionType: "percentage", commissionValue: 10, couponCode: "BRONZE10", couponDiscount: 10, cookieWindow: 30, minPayout: 50, isActive: true },
  { id: "2", name: "Silver Partner", subscriptionPlan: "Professional", commissionType: "percentage", commissionValue: 15, couponCode: "SILVER15", couponDiscount: 15, cookieWindow: 45, minPayout: 100, isActive: true },
  { id: "3", name: "Gold Partner", subscriptionPlan: "All Plans", commissionType: "percentage", commissionValue: 20, couponCode: "GOLD20", couponDiscount: 20, cookieWindow: 60, minPayout: 200, isActive: true },
];

// Initial mock data for coupons
const initialCoupons: Coupon[] = [
  { id: "1", code: "SUMMER25", discountType: "percentage", discountValue: 25, usageLimit: 100, usedCount: 45, validFrom: "2026-01-01", validUntil: "2026-03-31", linkedAffiliate: "", status: "active" },
  { id: "2", code: "WELCOME10", discountType: "percentage", discountValue: 10, usageLimit: 500, usedCount: 234, validFrom: "2025-12-01", validUntil: "2026-12-31", linkedAffiliate: "", status: "active" },
  { id: "3", code: "FLAT5KD", discountType: "fixed", discountValue: 5, usageLimit: 200, usedCount: 89, validFrom: "2026-01-01", validUntil: "2026-02-28", linkedAffiliate: "", status: "active" },
];

export default function Affiliates() {
  const [searchValue, setSearchValue] = useState("");
  const [affiliates, setAffiliates] = useState<Affiliate[]>(mockAffiliates);
  const [commissionPlans, setCommissionPlans] = useState<CommissionPlan[]>(initialCommissionPlans);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);

  // Dialog states
  const [affiliateDialogOpen, setAffiliateDialogOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null);

  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Delete confirmation states
  const [deleteAffiliateId, setDeleteAffiliateId] = useState<string | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);

  // Affiliate handlers
  const handleSaveAffiliate = (data: Partial<Affiliate>) => {
    if (editingAffiliate) {
      setAffiliates(prev => prev.map(a => a.id === editingAffiliate.id ? { ...a, ...data } : a));
      toast.success("Affiliate updated successfully");
    } else {
      const newAffiliate: Affiliate = {
        id: crypto.randomUUID(),
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        code: data.code || "",
        tier: data.tier || "Bronze",
        referrals: 0,
        earnings: 0,
        pending: 0,
        status: data.status || "active",
      };
      setAffiliates(prev => [...prev, newAffiliate]);
      toast.success("Affiliate added successfully");
    }
    setEditingAffiliate(null);
  };

  const handleEditAffiliate = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setAffiliateDialogOpen(true);
  };

  const handleDeleteAffiliate = () => {
    if (deleteAffiliateId) {
      setAffiliates(prev => prev.filter(a => a.id !== deleteAffiliateId));
      toast.success("Affiliate deleted successfully");
      setDeleteAffiliateId(null);
    }
  };

  // Commission plan handlers
  const handleSavePlan = (data: CommissionPlan) => {
    if (editingPlan) {
      setCommissionPlans(prev => prev.map(p => p.id === editingPlan.id ? data : p));
      toast.success("Commission plan updated successfully");
    } else {
      setCommissionPlans(prev => [...prev, data]);
      toast.success("Commission plan created successfully");
    }
    setEditingPlan(null);
  };

  const handleEditPlan = (plan: CommissionPlan) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = () => {
    if (deletePlanId) {
      setCommissionPlans(prev => prev.filter(p => p.id !== deletePlanId));
      toast.success("Commission plan deleted successfully");
      setDeletePlanId(null);
    }
  };

  // Coupon handlers
  const handleSaveCoupon = (data: Coupon) => {
    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? data : c));
      toast.success("Coupon updated successfully");
    } else {
      setCoupons(prev => [...prev, data]);
      toast.success("Coupon created successfully");
    }
    setEditingCoupon(null);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponDialogOpen(true);
  };

  const handleDeleteCoupon = () => {
    if (deleteCouponId) {
      setCoupons(prev => prev.filter(c => c.id !== deleteCouponId));
      toast.success("Coupon deleted successfully");
      setDeleteCouponId(null);
    }
  };

  const affiliateColumns = [
    {
      header: "Affiliate",
      accessor: (row: Affiliate) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{row.name.split(" ").map(n => n[0]).join("")}</span>
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Code", accessor: (row: Affiliate) => <code className="px-2 py-1 bg-muted rounded text-sm">{row.code}</code> },
    { header: "Tier", accessor: "tier" as keyof Affiliate },
    { header: "Referrals", accessor: "referrals" as keyof Affiliate },
    { header: "Earnings", accessor: (row: Affiliate) => formatCurrency(row.earnings) },
    { header: "Pending", accessor: (row: Affiliate) => formatCurrency(row.pending) },
    { header: "Status", accessor: (row: Affiliate) => <StatusBadge status={row.status} /> },
    {
      header: "Actions",
      accessor: (row: Affiliate) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditAffiliate(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteAffiliateId(row.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const planColumns = [
    { header: "Plan Name", accessor: "name" as keyof CommissionPlan },
    { header: "Subscription", accessor: "subscriptionPlan" as keyof CommissionPlan },
    {
      header: "Commission",
      accessor: (row: CommissionPlan) => (
        <span className="font-medium">{row.commissionValue}{row.commissionType === "percentage" ? "%" : " KD"}</span>
      ),
    },
    { header: "Coupon", accessor: (row: CommissionPlan) => row.couponCode ? <code className="px-2 py-1 bg-muted rounded text-sm">{row.couponCode}</code> : "-" },
    { header: "Cookie Window", accessor: (row: CommissionPlan) => `${row.cookieWindow} days` },
    { header: "Min Payout", accessor: (row: CommissionPlan) => formatCurrency(row.minPayout) },
    { header: "Status", accessor: (row: CommissionPlan) => <StatusBadge status={row.isActive ? "active" : "inactive"} /> },
    {
      header: "Actions",
      accessor: (row: CommissionPlan) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditPlan(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeletePlanId(row.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const couponColumns = [
    { header: "Code", accessor: (row: Coupon) => <code className="px-2 py-1 bg-muted rounded text-sm font-medium">{row.code}</code> },
    {
      header: "Discount",
      accessor: (row: Coupon) => (
        <span className="font-medium">{row.discountValue}{row.discountType === "percentage" ? "%" : " KD"}</span>
      ),
    },
    { header: "Usage", accessor: (row: Coupon) => `${row.usedCount} / ${row.usageLimit}` },
    { header: "Valid From", accessor: (row: Coupon) => new Date(row.validFrom).toLocaleDateString() },
    { header: "Valid Until", accessor: (row: Coupon) => new Date(row.validUntil).toLocaleDateString() },
    { header: "Status", accessor: (row: Coupon) => <StatusBadge status={row.status === "active" ? "active" : row.status === "expired" ? "inactive" : "canceled"} /> },
    {
      header: "Actions",
      accessor: (row: Coupon) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditCoupon(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteCouponId(row.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalEarnings = affiliates.reduce((sum, a) => sum + a.earnings, 0);
  const totalPending = affiliates.reduce((sum, a) => sum + a.pending, 0);
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.referrals, 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Affiliate Program</h1>
        <p className="page-subtitle">Manage affiliates and track referral performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Affiliates", value: affiliates.length.toString(), icon: Users2, color: "bg-purple-100 text-purple-600" },
          { label: "Total Referrals", value: totalReferrals.toString(), icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
          { label: "Total Commissions", value: formatCurrency(totalEarnings), icon: DollarSign, color: "bg-green-100 text-green-600" },
          { label: "Pending Payouts", value: formatCurrency(totalPending), icon: Gift, color: "bg-orange-100 text-orange-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="referrals">Recent Referrals</TabsTrigger>
          <TabsTrigger value="commissions">Commission Plans</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <div className="flex items-center justify-between mb-4">
              <SearchFilter searchPlaceholder="Search affiliates..." searchValue={searchValue} onSearchChange={setSearchValue} onExport={() => {}} />
              <Button onClick={() => { setEditingAffiliate(null); setAffiliateDialogOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Add Affiliate
              </Button>
            </div>
            <DataTable columns={affiliateColumns} data={affiliates.filter(a => a.name.toLowerCase().includes(searchValue.toLowerCase()) || a.email.toLowerCase().includes(searchValue.toLowerCase()))} emptyMessage="No affiliates found" emptyIcon={<Users2 className="w-12 h-12" />} />
          </motion.div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <div className="space-y-3">
              {mockReferrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{ref.subscriberName} → {ref.plan}</p>
                    <p className="text-sm text-muted-foreground">Referred by {ref.affiliateName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(ref.commission)}</p>
                    <StatusBadge status={ref.status === "approved" ? "active" : ref.status === "paid" ? "succeeded" : "pending"} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Commission Plans</h3>
              <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Create Plan
              </Button>
            </div>
            <DataTable columns={planColumns} data={commissionPlans} emptyMessage="No commission plans found" emptyIcon={<DollarSign className="w-12 h-12" />} />
          </motion.div>
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Discount Coupons</h3>
              <Button onClick={() => { setEditingCoupon(null); setCouponDialogOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Create Coupon
              </Button>
            </div>
            <DataTable columns={couponColumns} data={coupons} emptyMessage="No coupons found" emptyIcon={<Gift className="w-12 h-12" />} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAffiliateDialog
        open={affiliateDialogOpen}
        onOpenChange={setAffiliateDialogOpen}
        affiliate={editingAffiliate}
        onSave={handleSaveAffiliate}
      />

      <CommissionPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        plan={editingPlan}
        onSave={handleSavePlan}
      />

      <CouponDialog
        open={couponDialogOpen}
        onOpenChange={setCouponDialogOpen}
        coupon={editingCoupon}
        affiliates={affiliates.map(a => ({ id: a.id, name: a.name }))}
        onSave={handleSaveCoupon}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteAffiliateId} onOpenChange={() => setDeleteAffiliateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Affiliate</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this affiliate? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAffiliate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePlanId} onOpenChange={() => setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Plan</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this commission plan? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCouponId} onOpenChange={() => setDeleteCouponId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this coupon? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoupon} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
