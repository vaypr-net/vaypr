import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Clock, User, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { mockTickets, Ticket } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTicketDialog } from "@/components/super-admin/support/CreateTicketDialog";
import { useToast } from "@/hooks/use-toast";

const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function Support() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateTicket = (ticketData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subject: string;
    category: string;
    priority: string;
    description: string;
    assignedTo: string;
  }) => {
    // In real app, this would make an API call
    console.log("Creating ticket:", ticketData);
    toast({
      title: "Ticket Created",
      description: `Ticket for ${ticketData.customerName} has been created successfully.`,
    });
  };

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchValue.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const columns = [
    { header: "Ticket ID", accessor: "id" as keyof Ticket },
    {
      header: "Subject",
      accessor: (row: Ticket) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{row.subject}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{row.category}</Badge>
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: (row: Ticket) => (
        <div>
          <p className="font-medium">{row.customerName}</p>
          <p className="text-sm text-muted-foreground">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: (row: Ticket) => (
        <span className={`status-badge ${priorityStyles[row.priority]}`}>
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: Ticket) => <StatusBadge status={row.status} />,
    },
    { header: "Assigned To", accessor: "assignedTo" as keyof Ticket },
    {
      header: "Created",
      accessor: (row: Ticket) => formatTimeAgo(row.createdAt),
    },
    {
      header: "Actions",
      accessor: (row: Ticket) => (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSelectedTicket(row)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // Stats
  const stats = {
    open: mockTickets.filter(t => t.status === "open").length,
    pending: mockTickets.filter(t => t.status === "pending").length,
    inProgress: mockTickets.filter(t => t.status === "in_progress").length,
    resolved: mockTickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Support Center</h1>
          <p className="page-subtitle">Manage customer support tickets</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Ticket
        </Button>
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTicket}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: stats.open, icon: AlertTriangle, color: "bg-blue-100 text-blue-600" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
          { label: "In Progress", value: stats.inProgress, icon: User, color: "bg-purple-100 text-purple-600" },
          { label: "Resolved Today", value: stats.resolved, icon: CheckCircle, color: "bg-green-100 text-green-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="kpi-card"
          >
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-admin"
      >
        <SearchFilter
          searchPlaceholder="Search tickets..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={[
            {
              name: "Status",
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Open", value: "open" },
                { label: "Pending", value: "pending" },
                { label: "In Progress", value: "in_progress" },
                { label: "Resolved", value: "resolved" },
                { label: "Closed", value: "closed" },
              ],
              value: statusFilter,
              onChange: setStatusFilter,
            },
            {
              name: "Priority",
              options: [
                { label: "All Priorities", value: "all" },
                { label: "Urgent", value: "urgent" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ],
              value: priorityFilter,
              onChange: setPriorityFilter,
            },
          ]}
          onExport={() => console.log("Export CSV")}
        />

        <DataTable
          columns={columns}
          data={filteredTickets}
          emptyMessage="No tickets found"
          emptyIcon={<MessageSquare className="w-12 h-12" />}
        />
      </motion.div>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTicket.id}: {selectedTicket.subject}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Ticket Meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Select defaultValue={selectedTicket.status}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Select defaultValue={selectedTicket.priority}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <Select defaultValue={selectedTicket.assignedTo}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Support Team">Support Team</SelectItem>
                        <SelectItem value="Billing Team">Billing Team</SelectItem>
                        <SelectItem value="Tech Support">Tech Support</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline" className="mt-2">{selectedTicket.category}</Badge>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="font-medium">{selectedTicket.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.customerEmail}</p>
                </div>

                {/* Conversation */}
                <Tabs defaultValue="messages">
                  <TabsList className="w-full">
                    <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">Internal Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="messages" className="mt-4 space-y-4">
                    {/* Sample Messages */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{selectedTicket.customerName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(selectedTicket.createdAt)}</span>
                        </div>
                        <p className="text-sm">I'm having trouble exporting my invoices to PDF. The download button doesn't seem to work.</p>
                      </div>
                      
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-primary">Support Team</span>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(selectedTicket.updatedAt)}</span>
                        </div>
                        <p className="text-sm">Hi! Thanks for reaching out. Could you please try clearing your browser cache and trying again? Also, which browser are you using?</p>
                      </div>
                    </div>

                    {/* Reply Box */}
                    <div>
                      <Textarea placeholder="Type your reply..." rows={3} />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline">Save as Draft</Button>
                        <Button>Send Reply</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4 space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Admin</span>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm">Customer is on Professional plan. Verified their account - no billing issues. Likely a browser compatibility problem.</p>
                    </div>

                    <div>
                      <Textarea placeholder="Add internal note..." rows={2} />
                      <Button className="mt-2">Add Note</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
