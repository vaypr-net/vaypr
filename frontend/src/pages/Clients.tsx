import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClients, useInvoices, useQuotes, useRecurringBilling } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { BulkImportDialog } from '@/components/clients/BulkImportDialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Phone, 
  Eye,
  FileText,
  FileCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Client, ClientType } from '@/types/app';

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const { quotes } = useQuotes();
  const { recurringBillings } = useRecurringBilling();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    type: 'individual' as ClientType,
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
  });

  // Get client statistics
  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    const clientQuotes = quotes.filter(q => q.clientId === clientId);
    const clientRecurring = recurringBillings.filter(r => r.clientId === clientId);

    const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = clientInvoices.filter(inv => inv.status === 'overdue').length;
    const pendingInvoices = clientInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
    
    const acceptedQuotes = clientQuotes.filter(q => q.status === 'accepted' || q.status === 'converted').length;
    const pendingQuotes = clientQuotes.filter(q => q.status === 'sent' || q.status === 'draft').length;
    const rejectedQuotes = clientQuotes.filter(q => q.status === 'rejected').length;

    const activeRecurring = clientRecurring.filter(r => r.isActive).length;
    const totalRecurring = clientRecurring.length;

    const totalRevenue = clientInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const pendingAmount = clientInvoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices: clientInvoices.length,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      totalQuotes: clientQuotes.length,
      acceptedQuotes,
      pendingQuotes,
      rejectedQuotes,
      activeRecurring,
      totalRecurring,
      totalRevenue,
      pendingAmount,
      hasSubscription: activeRecurring > 0,
    };
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `KD ${amount.toFixed(3)}`;
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        type: client.type || 'individual',
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        type: 'individual',
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const handleConfirmDelete = (client: Client) => {
    setDeletingClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing required fields',
        description: 'Name and email are required.',
        variant: 'destructive',
      });
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, formData);
      toast({
        title: 'Client updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      addClient(formData);
      toast({
        title: 'Client added',
        description: `${formData.name} has been added to your clients.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingClient) {
      deleteClient(deletingClient.id);
      toast({
        title: 'Client deleted',
        description: `${deletingClient.name} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingClient(null);
    }
  };

  const handleBulkImport = (clients: Array<{
    type: 'individual' | 'company';
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
  }>) => {
    let imported = 0;
    clients.forEach(client => {
      addClient(client);
      imported++;
    });
    
    toast({
      title: 'Bulk import complete',
      description: `Successfully imported ${imported} client${imported !== 1 ? 's' : ''}`,
    });
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (clients.length === 0) {
      toast({
        title: 'No clients to export',
        description: 'Add some clients first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare export data with stats
    const exportData = clients.map(client => {
      const stats = getClientStats(client.id);
      return {
        Name: client.name,
        Email: client.email,
        Type: client.type,
        Phone: client.phone || '',
        Company: client.company || '',
        Address: client.address || '',
        Notes: client.notes || '',
        'Created At': format === 'csv' ? client.createdAt : new Date(client.createdAt),
        'Total Invoices': stats.totalInvoices,
        'Paid Invoices': stats.paidInvoices,
        'Overdue Invoices': stats.overdueInvoices,
        'Total Quotes': stats.totalQuotes,
        'Accepted Quotes': stats.acceptedQuotes,
        'Active Subscriptions': stats.activeRecurring,
        'Total Revenue (KD)': stats.totalRevenue.toFixed(3),
        'Pending Amount (KD)': stats.pendingAmount.toFixed(3),
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clients_export_${timestamp}.csv`;
      link.click();
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;
      
      XLSX.writeFile(workbook, `clients_export_${timestamp}.xlsx`);
    }

    toast({
      title: 'Export successful',
      description: `${clients.length} clients exported as ${format.toUpperCase()}`,
    });
  };

  // Summary stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => {
    const stats = getClientStats(c.id);
    return stats.pendingInvoices > 0 || stats.hasSubscription;
  }).length;
  const clientsWithOverdue = clients.filter(c => getClientStats(c.id).overdueInvoices > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage your client database and relationships</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In your database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Clients
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With pending invoices or subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{clientsWithOverdue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With overdue invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardContent className="p-0">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No clients found</p>
                <p className="text-sm">Add your first client to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Invoice Status</TableHead>
                      <TableHead>Quote Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => {
                      const stats = getClientStats(client.id);
                      return (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{client.name}</p>
                                <Badge variant={client.type === 'company' ? 'default' : 'secondary'} className="text-xs">
                                  {client.type === 'company' ? (
                                    <><Building2 className="h-3 w-3 mr-1" />Company</>
                                  ) : (
                                    <><User className="h-3 w-3 mr-1" />Individual</>
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                              {client.company && client.type === 'individual' && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {client.company}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {stats.paidInvoices > 0 && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {stats.paidInvoices} Paid
                                </Badge>
                              )}
                              {stats.overdueInvoices > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {stats.overdueInvoices} Late
                                </Badge>
                              )}
                              {stats.pendingInvoices > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {stats.pendingInvoices} Pending
                                </Badge>
                              )}
                              {stats.totalInvoices === 0 && (
                                <span className="text-xs text-muted-foreground">No invoices</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {stats.acceptedQuotes > 0 && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {stats.acceptedQuotes} Accepted
                                </Badge>
                              )}
                              {stats.pendingQuotes > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {stats.pendingQuotes} Pending
                                </Badge>
                              )}
                              {stats.rejectedQuotes > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {stats.rejectedQuotes} Rejected
                                </Badge>
                              )}
                              {stats.totalQuotes === 0 && (
                                <span className="text-xs text-muted-foreground">No quotes</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stats.hasSubscription ? (
                              <Badge variant="default" className="text-xs bg-primary/80">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {stats.activeRecurring} Active
                              </Badge>
                            ) : stats.totalRecurring > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {stats.totalRecurring} Inactive
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No subscription</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{formatCurrency(stats.totalRevenue)}</p>
                              {stats.pendingAmount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(stats.pendingAmount)} pending
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewClient(client)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleConfirmDelete(client)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Client Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
              <DialogDescription>
                {editingClient ? 'Update client information' : 'Add a new client to your database'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Client Type Selection */}
              <div className="space-y-2">
                <Label>Client Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ClientType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Individual Client
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.type === 'company' 
                    ? 'Add company details for business clients' 
                    : 'Add individual client personal details'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{formData.type === 'company' ? 'Company Name *' : 'Name *'}</Label>
                  <Input
                    placeholder={formData.type === 'company' ? 'Acme Inc.' : 'John Doe'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder={formData.type === 'company' ? 'info@company.com' : 'john@example.com'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+965 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {formData.type === 'individual' && (
                  <div className="space-y-2">
                    <Label>Company (Optional)</Label>
                    <Input
                      placeholder="Works at..."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Block 1, Street 2, Building 3, Kuwait"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingClient ? 'Update Client' : 'Add Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Client Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Details
              </DialogTitle>
            </DialogHeader>
            
            {viewingClient && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 pr-4">
                  {/* Client Info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{viewingClient.name}</h3>
                        {viewingClient.company && (
                          <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-4 w-4" />
                            {viewingClient.company}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Since {format(new Date(viewingClient.createdAt), 'MMM yyyy')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{viewingClient.email}</span>
                      </div>
                      {viewingClient.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{viewingClient.phone}</span>
                        </div>
                      )}
                    </div>

                    {viewingClient.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{viewingClient.address}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Financial Summary */}
                  {(() => {
                    const stats = getClientStats(viewingClient.id);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-warning">{formatCurrency(stats.pendingAmount)}</p>
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        {/* Invoice Status */}
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Invoice Status
                          </h4>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{stats.paidInvoices}</p>
                              <p className="text-xs text-muted-foreground">Paid</p>
                            </div>
                            <div className="text-center p-3 bg-warning/10 rounded-lg">
                              <p className="text-2xl font-bold text-warning">{stats.pendingInvoices}</p>
                              <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                            <div className="text-center p-3 bg-destructive/10 rounded-lg">
                              <p className="text-2xl font-bold text-destructive">{stats.overdueInvoices}</p>
                              <p className="text-xs text-muted-foreground">Overdue</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Quote Status */}
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            Quote Status
                          </h4>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{stats.acceptedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Accepted</p>
                            </div>
                            <div className="text-center p-3 bg-warning/10 rounded-lg">
                              <p className="text-2xl font-bold text-warning">{stats.pendingQuotes}</p>
                              <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                            <div className="text-center p-3 bg-destructive/10 rounded-lg">
                              <p className="text-2xl font-bold text-destructive">{stats.rejectedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Rejected</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Subscription Status */}
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Recurring & Subscriptions
                          </h4>
                          <div className="flex gap-3">
                            <div className="flex-1 text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold">{stats.totalRecurring}</p>
                              <p className="text-xs text-muted-foreground">Total Recurring</p>
                            </div>
                            <div className="flex-1 text-center p-3 bg-primary/10 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{stats.activeRecurring}</p>
                              <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                          </div>
                          {stats.hasSubscription && (
                            <Badge variant="default" className="w-full justify-center py-2">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Active Subscription
                            </Badge>
                          )}
                        </div>

                        {viewingClient.notes && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <h4 className="font-medium">Notes</h4>
                              <p className="text-sm text-muted-foreground">{viewingClient.notes}</p>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (viewingClient) handleOpenDialog(viewingClient);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deletingClient?.name}</strong>? 
                This action cannot be undone. All associated data will be preserved but the client 
                will be removed from your database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Import Dialog */}
        <BulkImportDialog
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          onImport={handleBulkImport}
        />
      </div>
    </DashboardLayout>
  );
}