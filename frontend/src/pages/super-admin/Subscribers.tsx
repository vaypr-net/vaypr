import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Eye, Pencil, MoreVertical } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { mockSubscribers, Subscriber } from "@/data/mockData";
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

export default function Subscribers() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [editSubscriber, setEditSubscriber] = useState<Subscriber | null>(null);

  const filteredSubscribers = mockSubscribers.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      sub.company.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesType = typeFilter === "all" || sub.subscriptionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
            <DropdownMenuItem onClick={() => setSelectedSubscriber(row)}>
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
          onExport={() => console.log("Export CSV")}
        />

        <DataTable
          columns={columns}
          data={filteredSubscribers}
          emptyMessage="No subscribers found"
          emptyIcon={<Users className="w-12 h-12" />}
        />
      </motion.div>

      {/* Subscriber Detail Sheet */}
      <Sheet open={!!selectedSubscriber} onOpenChange={() => setSelectedSubscriber(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedSubscriber && (
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
                    <textarea 
                      className="w-full p-3 border border-border rounded-lg text-sm resize-none"
                      rows={3}
                      placeholder="Add notes about this subscriber..."
                    />
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
                        <p className="font-medium">Feb 15, 2025</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Upgrade Plan</Button>
                    <Button variant="outline" className="flex-1">Downgrade Plan</Button>
                  </div>
                  <Button variant="destructive" className="w-full">Cancel Subscription</Button>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground mt-1">Expires 12/26</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Recent Invoices</p>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">INV-{2025000 + i}</p>
                            <p className="text-xs text-muted-foreground">Jan {15 - (i * 30 - 30)}, 2025</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">99 KD</p>
                            <StatusBadge status="succeeded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {[
                      { label: "Invoices this month", used: 45, limit: 100 },
                      { label: "Quotes this month", used: 12, limit: 50 },
                      { label: "Clients", used: 23, limit: 100 },
                      { label: "Team members", used: 3, limit: 10 },
                      { label: "Storage", used: 2.4, limit: 10, unit: "GB" },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">
                            {item.used}{item.unit ? ` ${item.unit}` : ""} / {item.limit}{item.unit ? ` ${item.unit}` : ""}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(item.used / item.limit) * 100}%` }}
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
