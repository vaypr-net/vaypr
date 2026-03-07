import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchFilter } from '@/components/super-admin/SearchFilter';
import { DataTable } from '@/components/super-admin/DataTable';
import { StatusBadge } from '@/components/super-admin/StatusBadge';
import { CreateTicketDialog } from '@/components/super-admin/support/CreateTicketDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAddMyTicketInternalNote,
  useAddMyTicketMessage,
  useCreateMyTicket,
  useGetMyTickets,
  useGetMyTicketStats,
  useUpdateMyTicket,
} from '@/hooks/api/useTickets';
import type { Ticket } from '@/api/services/ticket.service';
import { AlertTriangle, CheckCircle, Clock, Eye, Loader2, MessageSquare, Plus, User } from 'lucide-react';
import { formatDateTimeDMY } from '@/lib/document-date';

const priorityStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const teams = ['Support Team', 'Billing Team', 'Tech Support', 'Admin'];

function formatDate(dateString: string) {
  return formatDateTimeDMY(dateString);
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function Support() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const { data: ticketsData, isLoading: ticketsLoading } = useGetMyTickets(
    searchValue || undefined,
    statusFilter !== 'all' ? statusFilter : undefined,
    priorityFilter !== 'all' ? priorityFilter : undefined,
    undefined,
    50,
    0,
  );
  const { data: stats } = useGetMyTicketStats();
  const createTicketMutation = useCreateMyTicket();
  const addMessageMutation = useAddMyTicketMessage();
  const addInternalNoteMutation = useAddMyTicketInternalNote();
  const updateTicketMutation = useUpdateMyTicket();

  const displayTickets = ticketsData?.items || [];

  const columns = [
    {
      header: 'Ticket ID',
      accessor: (row: Ticket) => `TKT-${row._id.slice(-6).toUpperCase()}`,
    },
    {
      header: 'Subject',
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
      header: 'Priority',
      accessor: (row: Ticket) => (
        <span className={`status-badge ${priorityStyles[row.priority]}`}>
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Ticket) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Updated',
      accessor: (row: Ticket) => formatTimeAgo(row.updatedAt),
    },
    {
      header: 'Actions',
      accessor: (row: Ticket) => (
        <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(row)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const handleCreateTicket = async (ticketData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subject: string;
    category: string;
    priority: string;
    description: string;
    assignedTo: string;
    status: string;
  }) => {
    await createTicketMutation.mutateAsync({
      subject: ticketData.subject,
      customerEmail: ticketData.customerEmail,
      customerPhone: ticketData.customerPhone,
      customerName: user?.name || user?.fullName || ticketData.customerName,
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      assignedTo: ticketData.assignedTo,
      status: ticketData.status,
    });
    setSearchValue(""); // Clear search to show newly created ticket
    setCreateDialogOpen(false);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    const updated = await addMessageMutation.mutateAsync({
      id: selectedTicket._id,
      message: replyMessage,
    });
    setSelectedTicket(updated);
    setReplyMessage('');
  };

  const handleAddInternalNote = async () => {
    if (!selectedTicket || !internalNote.trim()) return;
    const updated = await addInternalNoteMutation.mutateAsync({
      id: selectedTicket._id,
      note: internalNote,
    });
    setSelectedTicket(updated);
    setInternalNote('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Support Center</h1>
            <p className="text-muted-foreground">Create tickets and track replies from support.</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Ticket
          </Button>
        </div>

        <CreateTicketDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateTicket}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: stats?.open || 0, icon: AlertTriangle },
            { label: 'Pending', value: stats?.pending || 0, icon: Clock },
            { label: 'In Progress', value: stats?.inProgress || 0, icon: User },
            { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  {stat.label}
                  <stat.icon className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="card-admin">
          <SearchFilter
            searchPlaceholder="Search your tickets..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={[
              {
                name: 'Status',
                options: [
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Open', value: 'open' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Resolved', value: 'resolved' },
                  { label: 'Closed', value: 'closed' },
                ],
                value: statusFilter,
                onChange: setStatusFilter,
              },
              {
                name: 'Priority',
                options: [
                  { label: 'All Priorities', value: 'all' },
                  { label: 'Urgent', value: 'urgent' },
                  { label: 'High', value: 'high' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Low', value: 'low' },
                ],
                value: priorityFilter,
                onChange: setPriorityFilter,
              },
            ]}
          />

          <DataTable
            columns={columns}
            data={displayTickets}
            isLoading={ticketsLoading}
            emptyMessage="No tickets found"
            emptyIcon={<MessageSquare className="w-12 h-12" />}
          />
        </div>

        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle>
                    TKT-{selectedTicket._id.slice(-6).toUpperCase()}: {selectedTicket.subject}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={async (value) => {
                          const updated = await updateTicketMutation.mutateAsync({
                            id: selectedTicket._id,
                            data: { status: value },
                          });
                          setSelectedTicket(updated);
                        }}
                      >
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
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={async (value) => {
                          const updated = await updateTicketMutation.mutateAsync({
                            id: selectedTicket._id,
                            data: { priority: value },
                          });
                          setSelectedTicket(updated);
                        }}
                      >
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
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <Select
                        value={selectedTicket.assignedTo || 'Support Team'}
                        onValueChange={async (value) => {
                          const updated = await updateTicketMutation.mutateAsync({
                            id: selectedTicket._id,
                            data: { assignedTo: value },
                          });
                          setSelectedTicket(updated);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Tabs defaultValue="messages">
                    <TabsList className="w-full">
                      <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
                      <TabsTrigger value="notes" className="flex-1">Internal Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="messages" className="mt-4 space-y-4">
                      <div className="space-y-4 max-h-72 overflow-y-auto">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{selectedTicket.customerName}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(selectedTicket.createdAt)}</span>
                          </div>
                          <p className="text-sm">{selectedTicket.description}</p>
                        </div>

                        {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                          selectedTicket.messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg ${
                                msg.author === selectedTicket.customerName || msg.author === selectedTicket.customerEmail
                                  ? 'bg-muted'
                                  : 'bg-primary/5 border border-primary/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{msg.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {msg.timestamp ? formatDate(new Date(msg.timestamp).toISOString()) : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No additional messages yet</p>
                        )}
                      </div>

                      <div>
                        <Textarea
                          placeholder="Add a message..."
                          rows={3}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          disabled={addMessageMutation.isPending}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={handleSendReply}
                            disabled={addMessageMutation.isPending || !replyMessage.trim()}
                          >
                            {addMessageMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Message'
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4 space-y-4">
                      <div className="space-y-4 max-h-72 overflow-y-auto">
                        {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 ? (
                          selectedTicket.internalNotes.map((note, index) => (
                            <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{note.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {note.timestamp ? formatDate(new Date(note.timestamp).toISOString()) : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm">{note.note}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No internal notes yet</p>
                        )}
                      </div>

                      <div>
                        <Textarea
                          placeholder="Add internal note..."
                          rows={2}
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          disabled={addInternalNoteMutation.isPending}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={handleAddInternalNote}
                            disabled={addInternalNoteMutation.isPending || !internalNote.trim()}
                          >
                            {addInternalNoteMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Note'
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
