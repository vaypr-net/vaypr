import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Eye, Loader2 } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useGetTickets, 
} from "@/hooks/api/useTickets";
import { Ticket } from "@/api/services/ticket.service";
import { toast } from "sonner";
import axiosInstance from "@/api/axios";

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

// CSV Export utility for tickets
function exportTicketsToCSV(tickets: Ticket[], filename: string = 'support_tickets.csv') {
  if (!tickets || tickets.length === 0) {
    toast.error('No tickets to export');
    return;
  }

  try {
    // Define CSV headers
    const headers = [
      'Ticket ID',
      'Subject',
      'Status',
      'Priority',
      'Category',
      'Customer Name',
      'Customer Email',
      'Assigned To',
      'Created Date',
      'Updated Date'
    ];

    // Map data to CSV rows
    const rows = tickets.map((ticket: Ticket) => [
      ticket._id || '',
      ticket.subject || '',
      ticket.status || '',
      ticket.priority || '',
      ticket.category || '',
      ticket.customerName || '',
      ticket.customerEmail || '',
      ticket.assignedTo || 'Unassigned',
      formatDate(ticket.createdAt),
      formatDate(ticket.updatedAt)
    ]);

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Tickets exported successfully');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error('Failed to export tickets');
  }
}

export default function Support() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // API Hooks
  const { data: ticketsData, isLoading: ticketsLoading } = useGetTickets(
    searchValue || undefined,
    undefined,
    undefined,
    undefined, // category
    50, // limit
    0 // offset
  );

  const displayTickets = ticketsData?.items || [];

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsSendingReply(true);
      const response = await axiosInstance.post(
        `/super-admin/tickets/${selectedTicket._id}/messages`,
        {
          message: replyMessage,
          author: selectedTicket.assignedTo || "Support Team",
        }
      );

      setSelectedTicket(response.data);
      setReplyMessage("");
      toast.success("Reply sent and email notification sent to customer");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !internalNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setIsAddingNote(true);
      const response = await axiosInstance.post(
        `/super-admin/tickets/${selectedTicket._id}/internal-notes`,
        {
          note: internalNote,
          author: "Admin",
        }
      );

      setSelectedTicket(response.data);
      setInternalNote("");
      toast.success("Internal note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const columns = [
    { 
      header: "Ticket ID", 
      accessor: (row: Ticket) => `TKT-${row._id.slice(-6).toUpperCase()}`
    },
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

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Support Center</h1>
          <p className="page-subtitle">Manage customer support tickets</p>
        </div>
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
          filters={[]}
          onExport={() => exportTicketsToCSV(displayTickets, `support_tickets_${new Date().toISOString().split('T')[0]}.csv`)}
        />

        <DataTable
          columns={columns}
          data={displayTickets}
          isLoading={ticketsLoading}
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
                <SheetTitle>TKT-{selectedTicket._id.slice(-6).toUpperCase()}: {selectedTicket.subject}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
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
                    {/* Messages List */}
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {/* Initial Description */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{selectedTicket.customerName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(selectedTicket.createdAt)}</span>
                        </div>
                        <p className="text-sm">{selectedTicket.description}</p>
                      </div>

                      {/* Messages from array */}
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        selectedTicket.messages.map((msg, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg ${
                              msg.author === selectedTicket.customerName 
                                ? "bg-muted" 
                                : "bg-primary/5 border border-primary/20"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{msg.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {msg.timestamp ? formatDate(new Date(msg.timestamp).toISOString()) : "N/A"}
                              </span>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No additional messages yet</p>
                      )}
                    </div>

                    {/* Reply Box */}
                    <div>
                      <Textarea 
                        placeholder="Type your reply..." 
                        rows={3} 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        disabled={isSendingReply}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setReplyMessage("")}
                          disabled={isSendingReply}
                        >
                          Clear
                        </Button>
                        <Button 
                          onClick={handleSendReply}
                          disabled={isSendingReply || !replyMessage.trim()}
                        >
                          {isSendingReply ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Reply"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4 space-y-4">
                    {/* Internal Notes List */}
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 ? (
                        selectedTicket.internalNotes.map((note, index) => (
                          <div 
                            key={index}
                            className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{note.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {note.timestamp ? formatDate(new Date(note.timestamp).toISOString()) : "N/A"}
                              </span>
                            </div>
                            <p className="text-sm">{note.note}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No internal notes yet</p>
                      )}
                    </div>

                    {/* Add Note */}
                    <div>
                      <Textarea 
                        placeholder="Add internal note..." 
                        rows={2} 
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        disabled={isAddingNote}
                      />
                      <Button 
                        className="mt-2"
                        onClick={handleAddNote}
                        disabled={isAddingNote || !internalNote.trim()}
                      >
                        {isAddingNote ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Note"
                        )}
                      </Button>
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
