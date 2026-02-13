import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Eye, Pencil, MoreVertical, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { EditSubscriberDialog } from "@/components/super-admin/subscribers/EditSubscriberDialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetSubscriberById, useGetSubscribers, useGetSubscriberStats, useUpdateSubscriber } from "@/hooks/api/useSubscribers";
import { Subscriber, SubscriberService } from "@/api/services/subscriber.service";

export default function Subscribers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [editSubscriber, setEditSubscriber] = useState<Subscriber | null>(null);

  // API Hooks
  const { data: subscribersData, isLoading: subscribersLoading } = useGetSubscribers(
    searchValue || undefined,
    statusFilter !== "all" ? statusFilter : undefined,
    typeFilter !== "all" ? typeFilter : undefined,
    50,
    0
  );

  const { data: stats } = useGetSubscriberStats();
  const updateSubscriberMutation = useUpdateSubscriber();
  const { data: selectedSubscriber, isLoading: selectedSubscriberLoading } = useGetSubscriberById(
    selectedSubscriberId || ""
  );

  const displaySubscribers = subscribersData?.items || [];
  const availablePlans = ["Free", "Starter", "Professional", "Enterprise"];

  useEffect(() => {
    setInternalNotes(selectedSubscriber?.internalNotes || "");
  }, [selectedSubscriber?._id, selectedSubscriber?.internalNotes]);

  const selectedPlanIndex = useMemo(
    () => availablePlans.indexOf(selectedSubscriber?.plan || ""),
    [selectedSubscriber?.plan]
  );

  const handleSaveInternalNotes = async () => {
    if (!selectedSubscriber) return;
    await updateSubscriberMutation.mutateAsync({
      id: selectedSubscriber._id,
      data: { internalNotes },
    });
  };

  const handlePlanChange = async (direction: "upgrade" | "downgrade") => {
    if (!selectedSubscriber) return;
    if (selectedPlanIndex === -1) return;

    const targetIndex =
      direction === "upgrade" ? selectedPlanIndex + 1 : selectedPlanIndex - 1;
    if (targetIndex < 0 || targetIndex >= availablePlans.length) return;

    const nextPlan = availablePlans[targetIndex];
    await updateSubscriberMutation.mutateAsync({
      id: selectedSubscriber._id,
      data: {
        plan: nextPlan,
        status: nextPlan === "Free" ? "free" : "active",
      },
    });
  };

  const handleOpenPricingOptions = () => {
    navigate("/super-admin/plans");
    toast({
      title: "Pricing options opened",
      description:
        "Subscriber payment is completed on user-side checkout. Super admin plan changes are manual overrides.",
    });
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscriber) return;
    await updateSubscriberMutation.mutateAsync({
      id: selectedSubscriber._id,
      data: { status: "canceled" },
    });
  };

  const handleExportCsv = async () => {
    try {
      const search = searchValue || undefined;
      const status = statusFilter !== "all" ? statusFilter : undefined;
      const subscriptionType = typeFilter !== "all" ? typeFilter : undefined;

      const allSubscribers: Subscriber[] = [];
      let offset = 0;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const page = await SubscriberService.getSubscribers(
          search,
          status,
          subscriptionType,
          limit,
          offset
        );

        allSubscribers.push(...page.items);
        hasMore = page.hasMore;
        offset += page.items.length;

        if (page.items.length === 0) break;
      }

      if (allSubscribers.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no subscribers matching current filters.",
          variant: "destructive",
        });
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

      const headers = [
        "Name",
        "Email",
        "Company",
        "Plan",
        "Subscription Type",
        "Subscription Date",
        "Status",
        "Lifetime Spend",
        "Last Payment Date",
        "Next Renewal Date",
      ];

      const rows = allSubscribers.map((sub) => [
        sub.name,
        sub.email,
        sub.company,
        sub.plan,
        sub.subscriptionType,
        sub.subscriptionDate,
        sub.status,
        sub.lifetimeSpend,
        sub.lastPaymentDate,
        sub.nextRenewalDate || "",
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
      link.setAttribute("download", `subscribers-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Downloaded ${allSubscribers.length} subscribers as CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error?.response?.data?.message || "Unable to export subscribers CSV.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "Subscriber",
      accessor: (row: Subscriber) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {row.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Plan", accessor: "plan" as keyof Subscriber },
    {
      header: "Type",
      accessor: (row: Subscriber) => (
        <Badge variant="outline" className="capitalize">
          {row.subscriptionType}
        </Badge>
      ),
    },
    { header: "Start Date", accessor: "subscriptionDate" as keyof Subscriber },
    {
      header: "Status",
      accessor: (row: Subscriber) => <StatusBadge status={row.status} />,
    },
    {
      header: "Lifetime Spend",
      accessor: (row: Subscriber) => formatCurrency(row.lifetimeSpend),
    },
    { header: "Last Payment", accessor: "lastPaymentDate" as keyof Subscriber },
    {
      header: "Actions",
      accessor: (row: Subscriber) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedSubscriberId(row._id)}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditSubscriber(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Subscriber Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Subscribers</h1>
        <p className="page-subtitle">Manage all your platform subscribers</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-admin"
      >
        <SearchFilter
          searchPlaceholder="Search by name, email, or company..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={[
            {
              name: "Status",
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Free", value: "free" },
                { label: "Canceled", value: "canceled" },
              ],
              value: statusFilter,
              onChange: setStatusFilter,
            },
            {
              name: "Type",
              options: [
                { label: "All Types", value: "all" },
                { label: "Monthly", value: "monthly" },
                { label: "Yearly", value: "yearly" },
              ],
              value: typeFilter,
              onChange: setTypeFilter,
            },
          ]}
          onExport={handleExportCsv}
        />

        <DataTable
          columns={columns}
          data={displaySubscribers}
          isLoading={subscribersLoading}
          emptyMessage="No subscribers found"
          emptyIcon={<Users className="w-12 h-12" />}
        />
      </motion.div>

      {/* Subscriber Detail Sheet */}
      <Sheet open={!!selectedSubscriberId} onOpenChange={() => setSelectedSubscriberId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedSubscriberLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : selectedSubscriber && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {selectedSubscriber.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p>{selectedSubscriber.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedSubscriber.email}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="profile" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedSubscriber.company}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <StatusBadge status={selectedSubscriber.status} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">{selectedSubscriber.subscriptionDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lifetime Spend</p>
                      <p className="font-medium">{formatCurrency(selectedSubscriber.lifetimeSpend)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Internal Notes</p>
                    <Textarea
                      rows={3}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add notes about this subscriber..."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSaveInternalNotes}
                        disabled={updateSubscriberMutation.isPending}
                      >
                        Save Notes
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <p className="text-xl font-semibold">{selectedSubscriber.plan}</p>
                      </div>
                      <StatusBadge status={selectedSubscriber.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Billing Cycle</p>
                        <p className="font-medium capitalize">{selectedSubscriber.subscriptionType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Renewal</p>
                        <p className="font-medium">
                          {selectedSubscriber.nextRenewalDate
                            ? new Date(selectedSubscriber.nextRenewalDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleOpenPricingOptions}
                      disabled={updateSubscriberMutation.isPending}
                    >
                      Upgrade Plan
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePlanChange("downgrade")}
                      disabled={updateSubscriberMutation.isPending || selectedPlanIndex <= 0}
                    >
                      Downgrade Plan
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelSubscription}
                    disabled={updateSubscriberMutation.isPending}
                  >
                    Cancel Subscription
                  </Button>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedSubscriber.billing?.paymentMethod || "Not available"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedSubscriber.billing?.paymentMethodDetails || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Recent Invoices</p>
                    <div className="space-y-2">
                      {(selectedSubscriber.billing?.recentInvoices || []).length === 0 ? (
                        <div className="p-3 border border-border rounded-lg text-sm text-muted-foreground">
                          No billing transactions found.
                        </div>
                      ) : (
                        selectedSubscriber.billing?.recentInvoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{invoice.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(invoice.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {invoice.amount} {invoice.currency}
                              </p>
                              <StatusBadge status={invoice.status} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {[
                      {
                        label: "Invoices",
                        used: selectedSubscriber.usage?.invoices.used ?? 0,
                        limit: selectedSubscriber.usage?.invoices.limit ?? 0,
                      },
                      {
                        label: "Quotes",
                        used: selectedSubscriber.usage?.quotes.used ?? 0,
                        limit: selectedSubscriber.usage?.quotes.limit ?? 0,
                      },
                      {
                        label: "Clients",
                        used: selectedSubscriber.usage?.clients.used ?? 0,
                        limit: selectedSubscriber.usage?.clients.limit ?? 0,
                      },
                      {
                        label: "Team members",
                        used: selectedSubscriber.usage?.teamMembers.used ?? 0,
                        limit: selectedSubscriber.usage?.teamMembers.limit ?? 0,
                      },
                      {
                        label: "Storage",
                        used: selectedSubscriber.usage?.storage.used ?? 0,
                        limit: selectedSubscriber.usage?.storage.limit ?? "0GB",
                        unit: selectedSubscriber.usage?.storage.unit ?? "GB",
                      },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">
                            {item.used}
                            {item.unit ? ` ${item.unit}` : ""}
                            {" / "}
                            {item.limit}
                            {typeof item.limit === "number" && item.unit ? ` ${item.unit}` : ""}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width:
                                typeof item.limit === "number" && item.limit > 0
                                  ? `${Math.min((item.used / item.limit) * 100, 100)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Subscriber Dialog */}
      <EditSubscriberDialog
        subscriber={editSubscriber}
        open={!!editSubscriber}
        onOpenChange={(open) => !open && setEditSubscriber(null)}
      />
    </div>
  );
}
