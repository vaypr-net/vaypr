import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users2, DollarSign, TrendingUp, Gift, Eye, Plus, Pencil, Trash2, MoreHorizontal, Mail } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { AddAffiliateDialog } from "@/components/super-admin/affiliates/AddAffiliateDialog";
import { CommissionPlanDialog } from "@/components/super-admin/affiliates/CommissionPlanDialog";
import { CouponDialog } from "@/components/super-admin/affiliates/CouponDialog";
import { ViewAffiliateDialog } from "@/components/super-admin/affiliates/ViewAffiliateDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AffiliateService } from "@/api/services/affiliate.service";
import {
  useGetAffiliates,
  useGetAffiliateStats,
  useCreateAffiliate,
  useUpdateAffiliate,
  useDeleteAffiliate,
  useUpdateAffiliateStatus,
  useGetCommissionPlans,
  useCreateCommissionPlan,
  useUpdateCommissionPlan,
  useDeleteCommissionPlan,
  useGetCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useGetReferrals,
  useApproveReferral,
  useProcessPayouts,
  useSendAffiliateEmail,
} from "@/hooks/api/useAffiliates";
import {
  Affiliate,
  CommissionPlan,
  Coupon,
  Referral,
} from "@/api/services/affiliate.service";

export default function Affiliates() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [pagination, setPagination] = useState({ limit: 10, offset: 0 });

  // ==================== API HOOKS ====================

  // Affiliates
  const { data: affiliatesData, isLoading: affiliatesLoading } = useGetAffiliates(
    searchValue || undefined,
    statusFilter || undefined,
    tierFilter || undefined,
    pagination.limit,
    pagination.offset,
  );
  const { data: affiliateStats } = useGetAffiliateStats();
  const createAffiliateMutation = useCreateAffiliate();
  const updateAffiliateMutation = useUpdateAffiliate();
  const deleteAffiliateMutation = useDeleteAffiliate();
  const statusMutation = useUpdateAffiliateStatus();

  // Commission Plans
  const { data: commissionPlansData, isLoading: commissionPlansLoading } = useGetCommissionPlans();
  const createPlanMutation = useCreateCommissionPlan();
  const updatePlanMutation = useUpdateCommissionPlan();
  const deletePlanMutation = useDeleteCommissionPlan();

  // Coupons
  const { data: couponsData, isLoading: couponsLoading } = useGetCoupons(undefined, undefined, undefined, 100);
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  // Referrals
  const { data: referralsData, isLoading: referralsLoading } = useGetReferrals(undefined, undefined, 100);
  const approveReferralMutation = useApproveReferral();

  // Build a quick id→email map from already-loaded affiliates
  const affiliateEmailMap = useMemo(() => {
    const map: Record<string, string> = {};
    (affiliatesData?.items || []).forEach((a: Affiliate) => {
      map[a._id] = a.email;
    });
    return map;
  }, [affiliatesData]);
  const payoutMutation = useProcessPayouts();
  const sendAffiliateEmailMutation = useSendAffiliateEmail();

  // Dialog states
  const [affiliateDialogOpen, setAffiliateDialogOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [viewingAffiliate, setViewingAffiliate] = useState<Affiliate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null);

  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Delete confirmation states
  const [deleteAffiliateId, setDeleteAffiliateId] = useState<string | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedReferralForEmail, setSelectedReferralForEmail] = useState<Referral | null>(null);
  const [affiliateEmailSubject, setAffiliateEmailSubject] = useState("");
  const [affiliateEmailMessage, setAffiliateEmailMessage] = useState("");

  // ==================== AFFILIATE HANDLERS ====================

  const handleSaveAffiliate = async (data: any) => {
    try {
      if (editingAffiliate) {
        await updateAffiliateMutation.mutateAsync({
          id: editingAffiliate._id,
          data,
        });
      } else {
        await createAffiliateMutation.mutateAsync(data);
        // Clear search value to show the newly created affiliate
        setSearchValue("");
      }
      setAffiliateDialogOpen(false);
      setEditingAffiliate(null);
    } catch (error) {
      console.error("Error saving affiliate:", error);
    }
  };

  const handleEditAffiliate = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setAffiliateDialogOpen(true);
  };

  const handleViewAffiliate = (affiliate: Affiliate) => {
    setViewingAffiliate(affiliate);
    setViewDialogOpen(true);
  };

  const handleDeleteAffiliate = async () => {
    if (deleteAffiliateId) {
      try {
        await deleteAffiliateMutation.mutateAsync(deleteAffiliateId);
        setDeleteAffiliateId(null);
      } catch (error) {
        console.error("Error deleting affiliate:", error);
      }
    }
  };

  const handleToggleStatus = async (affiliateId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await statusMutation.mutateAsync({
        id: affiliateId,
        status: newStatus as 'active' | 'inactive',
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // ==================== COMMISSION PLAN HANDLERS ====================

  const handleSavePlan = async (data: any) => {
    try {
      if (editingPlan) {
        await updatePlanMutation.mutateAsync({
          id: editingPlan._id,
          data,
        });
      } else {
        await createPlanMutation.mutateAsync(data);
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      console.error("Error saving commission plan:", error);
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async () => {
    if (deletePlanId) {
      try {
        await deletePlanMutation.mutateAsync(deletePlanId);
        setDeletePlanId(null);
      } catch (error) {
        console.error("Error deleting commission plan:", error);
      }
    }
  };

  // ==================== COUPON HANDLERS ====================

  const handleSaveCoupon = async (data: any) => {
    try {
      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({
          id: editingCoupon._id,
          data,
        });
      } else {
        await createCouponMutation.mutateAsync(data);
      }
      setCouponDialogOpen(false);
      setEditingCoupon(null);
    } catch (error) {
      console.error("Error saving coupon:", error);
    }
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setCouponDialogOpen(true);
  };

  const handleDeleteCoupon = async () => {
    if (deleteCouponId) {
      try {
        await deleteCouponMutation.mutateAsync(deleteCouponId);
        setDeleteCouponId(null);
      } catch (error) {
        console.error("Error deleting coupon:", error);
      }
    }
  };

  // ==================== PROCESS PAYOUT ====================

  const handleProcessPayouts = async () => {
    try {
      await payoutMutation.mutateAsync({});
    } catch (error) {
      console.error("Error processing payouts:", error);
    }
  };

  const handleOpenAffiliateEmailDialog = (ref: Referral) => {
    const commissionText = formatCurrency(ref.commission || 0);
    setSelectedReferralForEmail(ref);
    setAffiliateEmailSubject(`Referral & Commission Update - ${ref.subscriberName}`);
    setAffiliateEmailMessage(
      `Hi ${ref.affiliateName},

Referral update for ${ref.subscriberName} (${ref.plan}):
- Commission: ${commissionText}
- Current status: ${ref.status}

Please reply to this email with your payout account details so we can process your commission payout.

Regards,
Support Team`
    );
    setEmailDialogOpen(true);
  };

  const handleSendAffiliateEmail = async () => {
    if (!selectedReferralForEmail) return;
    const subject = affiliateEmailSubject.trim();
    const message = affiliateEmailMessage.trim();
    if (!subject || !message) {
      toast.error("Subject and message are required");
      return;
    }

    await sendAffiliateEmailMutation.mutateAsync({
      affiliateId: selectedReferralForEmail.affiliateId,
      referralId: selectedReferralForEmail._id,
      subject,
      message,
    });
    setEmailDialogOpen(false);
    setSelectedReferralForEmail(null);
    setAffiliateEmailSubject("");
    setAffiliateEmailMessage("");
  };

  // ==================== TABLE COLUMNS ====================

  const affiliateColumns = [
    {
      header: "Affiliate",
      accessor: (row: Affiliate) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{row.name.split(" ").map((n: string) => n[0]).join("")}</span>
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Code", accessor: (row: Affiliate) => <code className="px-2 py-1 bg-muted rounded text-sm">{row.code}</code> },
    {
      header: "Plan",
      accessor: (row: Affiliate) => {
        const plan = row.commissionPlanId && typeof row.commissionPlanId === 'object'
          ? row.commissionPlanId as any
          : null;
        if (!plan) return <span className="text-muted-foreground text-sm">No plan</span>;
        return (
          <div>
            <p className="font-medium text-sm">{plan.name}</p>
            <p className="text-xs text-muted-foreground">
              {plan.commissionValue}{plan.commissionType === 'percentage' ? '%' : ' KD'} per referral
            </p>
          </div>
        );
      },
    },
    { header: "Referrals", accessor: "referrals" as keyof Affiliate },
    { header: "Earnings", accessor: (row: Affiliate) => formatCurrency(row.earnings) },
    { header: "Pending", accessor: (row: Affiliate) => formatCurrency(row.pending) },
    {
      header: "Status",
      accessor: (row: Affiliate) => (
        <div onClick={() => handleToggleStatus(row._id, row.status)} className="cursor-pointer">
          <StatusBadge status={row.status} />
        </div>
      ),
    },
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
            <DropdownMenuItem onClick={() => handleViewAffiliate(row)}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditAffiliate(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteAffiliateId(row._id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const planColumns = [
    { header: "Plan Name", accessor: "name" as keyof any },
    { header: "Subscription", accessor: "subscriptionPlan" as keyof any },
    {
      header: "Commission",
      accessor: (row: any) => (
        <span className="font-medium">{row.commissionValue}{row.commissionType === "percentage" ? "%" : " KD"}</span>
      ),
    },
    { header: "Coupon", accessor: (row: any) => row.couponCode ? <code className="px-2 py-1 bg-muted rounded text-sm">{row.couponCode}</code> : "-" },
    { header: "Cookie Window", accessor: (row: any) => `${row.cookieWindow} days` },
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
            <DropdownMenuItem onClick={() => setDeletePlanId(row._id)} className="text-destructive">
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
    { header: "Valid From", accessor: (row: Coupon) => {
      const date = new Date(row.validFrom);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }},
    { header: "Valid Until", accessor: (row: Coupon) => {
      const date = new Date(row.validUntil);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }},
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
            <DropdownMenuItem onClick={() => setDeleteCouponId(row._id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalEarnings = affiliateStats?.totalCommissions || 0;
  const totalPending = affiliateStats?.pendingPayouts || 0;
  const totalReferrals = affiliateStats?.totalReferrals || 0;
  const totalAffiliates = affiliateStats?.totalAffiliates || affiliatesData?.total || 0;
  const pendingReferralsCount =
    (referralsData?.items || []).filter((ref: Referral) => ref.status === "pending").length;
  const approvedReferralsCount =
    (referralsData?.items || []).filter((ref: Referral) => ref.status === "approved").length;

  const handleExportCsv = async () => {
    try {
      const search = searchValue || undefined;
      const status = statusFilter || undefined;
      const tier = tierFilter || undefined;

      const allAffiliates: Affiliate[] = [];
      let offset = 0;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const page = await AffiliateService.getAffiliates(
          search,
          status,
          tier,
          limit,
          offset
        );

        allAffiliates.push(...(page.items || []));
        hasMore = page.hasMore;
        offset += page.items.length;

        if (!page.items.length) break;
      }

      if (!allAffiliates.length) {
        toast.error("No affiliates to export");
        return;
      }

      const escapeCsv = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const formatDateForCsv = (dateValue: string | undefined): string => {
        if (!dateValue) return "";
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return "";
          // Format as YYYY-MM-DD for better CSV compatibility
          return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
        } catch {
          return "";
        }
      };

      const headers = [
        "Name",
        "Email",
        "Phone",
        "Code",
        "Plan",
        "Status",
        "Referrals",
        "Earnings",
        "Pending",
        "Join Date",
        "Last Payment Date",
      ];

      const rows = allAffiliates.map((affiliate) => [
        affiliate.name,
        affiliate.email,
        affiliate.phone || "",
        affiliate.code,
        typeof affiliate.commissionPlanId === 'object' && affiliate.commissionPlanId
          ? (affiliate.commissionPlanId as any).name
          : '',
        affiliate.status,
        affiliate.referrals,
        affiliate.earnings,
        affiliate.pending,
        // Use createdAt as fallback if joinDate is missing or invalid
        formatDateForCsv(affiliate.joinDate || affiliate.createdAt),
        formatDateForCsv(affiliate.lastPaymentDate),
      ]);

      const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      link.href = url;
      link.setAttribute("download", `affiliates-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allAffiliates.length} affiliates`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to export affiliates");
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Affiliate Program</h1>
        <p className="page-subtitle">Manage affiliates and track referral performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Affiliates", value: totalAffiliates.toString(), icon: Users2, color: "bg-purple-100 text-purple-600" },
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
              <SearchFilter
                searchPlaceholder="Search affiliates..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onExport={handleExportCsv}
              />
              <Button onClick={() => { setEditingAffiliate(null); setAffiliateDialogOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Add Affiliate
              </Button>
            </div>
            <DataTable 
              columns={affiliateColumns} 
              data={affiliatesData?.items || []} 
              emptyMessage="No affiliates found" 
              emptyIcon={<Users2 className="w-12 h-12" />}
              isLoading={affiliatesLoading}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Pending: {pendingReferralsCount} | Approved: {approvedReferralsCount}
              </div>
              <Button
                variant="outline"
                onClick={handleProcessPayouts}
                disabled={approvedReferralsCount === 0 || payoutMutation.isPending}
              >
                {payoutMutation.isPending ? "Processing..." : "Process Approved Payouts"}
              </Button>
            </div>
            <div className="space-y-3">
              {referralsLoading ? (
                <div className="text-center py-8">Loading referrals...</div>
              ) : (referralsData?.items || []).length > 0 ? (
                (referralsData?.items || []).map((ref: any) => (
                  <div key={ref._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{ref.subscriberName} → {ref.plan}</p>
                      <p className="text-sm text-muted-foreground">
                        Referred by {ref.affiliateName}
                        {affiliateEmailMap[ref.affiliateId] && (
                          <span className="ml-1 text-xs text-muted-foreground/70">({affiliateEmailMap[ref.affiliateId]})</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {ref.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveReferralMutation.mutate(ref._id)}
                          disabled={approveReferralMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {ref.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleProcessPayouts}
                          disabled={payoutMutation.isPending}
                        >
                          Pay
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAffiliateEmailDialog(ref)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                      <div>
                      <p className="font-medium">{formatCurrency(ref.commission, { decimals: 2 })}</p>
                      <StatusBadge status={ref.status === "approved" ? "active" : ref.status === "paid" ? "succeeded" : "pending"} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No referrals found</div>
              )}
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
            <DataTable 
              columns={planColumns} 
              data={Array.isArray(commissionPlansData) ? commissionPlansData : (commissionPlansData as any)?.items || []} 
              emptyMessage="No commission plans found" 
              emptyIcon={<DollarSign className="w-12 h-12" />}
              isLoading={commissionPlansLoading}
            />
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
            <DataTable 
              columns={couponColumns} 
              data={couponsData?.items || []} 
              emptyMessage="No coupons found" 
              emptyIcon={<Gift className="w-12 h-12" />}
              isLoading={couponsLoading}
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAffiliateDialog
        open={affiliateDialogOpen}
        onOpenChange={setAffiliateDialogOpen}
        affiliate={editingAffiliate}
        commissionPlans={Array.isArray(commissionPlansData) ? commissionPlansData : (commissionPlansData as any)?.items || []}
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
        affiliates={(affiliatesData?.items || []).map(a => ({ id: a._id, name: a.name }))}
        onSave={handleSaveCoupon}
      />

      <ViewAffiliateDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        affiliate={viewingAffiliate}
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

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Affiliate Email</DialogTitle>
            <DialogDescription>
              Send a referral/commission update email. Replies will go to your configured Support Email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReferralForEmail ? (
              <div className="rounded border p-3 bg-muted/20 text-sm">
                <p className="font-medium">{selectedReferralForEmail.affiliateName}</p>
                {affiliateEmailMap[selectedReferralForEmail.affiliateId] && (
                  <p className="text-muted-foreground text-xs">{affiliateEmailMap[selectedReferralForEmail.affiliateId]}</p>
                )}
                <p className="text-muted-foreground">
                  Referral: {selectedReferralForEmail.subscriberName} ({selectedReferralForEmail.plan})
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={affiliateEmailSubject}
                onChange={(e) => setAffiliateEmailSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={8}
                value={affiliateEmailMessage}
                onChange={(e) => setAffiliateEmailMessage(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[220px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAffiliateEmail} disabled={sendAffiliateEmailMutation.isPending}>
              {sendAffiliateEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
