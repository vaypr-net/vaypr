import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  useClients as useClientsAPI, 
  useCreateClient, 
  useBulkImportClients,
  useUpdateClient, 
  useDeleteClient 
} from '@/hooks/api/useClients';
import { useInvoices as useInvoicesAPI } from '@/hooks/api/useInvoices';
import { useQuotesAPI } from '@/hooks/api/useQuotes';
import { useRecurringAPI } from '@/hooks/api/useRecurring';
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
  FileSpreadsheet,
  Send,
  MessageSquare
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
  // API hooks - fetch clients with stats included
  const { data: clients = [], isLoading } = useClientsAPI(true); // Pass true to include stats
  const createMutation = useCreateClient();
  const bulkImportMutation = useBulkImportClients();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  
  // Ensure clients is always an array
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  // No longer need to fetch these separately since we get stats from the API
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    clientType: 'individual' as ClientType,
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
  });

  // Get client statistics from API response
  const getClientStats = (client: any) => {
    // If stats are included in the API response, use them
    if (client.stats) {
      return {
        totalInvoices: client.stats.invoices.total,
        paidInvoices: client.stats.invoices.paid,
        sentInvoices: client.stats.invoices.sent,
        overdueInvoices: client.stats.invoices.overdue,
        draftInvoices: client.stats.invoices.draft || 0,
        cancelledInvoices: client.stats.invoices.cancelled || 0,
        totalQuotes: client.stats.quotes.total,
        acceptedQuotes: client.stats.quotes.accepted,
        sentQuotes: client.stats.quotes.sent,
        viewedQuotes: client.stats.quotes.viewed,
        convertedQuotes: client.stats.quotes.converted,
        rejectedQuotes: client.stats.quotes.rejected,
        expiredQuotes: client.stats.quotes.expired || 0,
        draftQuotes: client.stats.quotes.draft || 0,
        modificationRequestedQuotes: client.stats.quotes.modification_requested || 0,
        activeRecurring: client.stats.recurring.active,
        totalRecurring: client.stats.recurring.total,
        totalRevenue: client.stats.revenue.total,
        pendingAmount: client.stats.revenue.pending,
        hasSubscription: client.stats.recurring.active > 0,
      };
    }
    
    // Fallback to empty stats if not included
    return {
      totalInvoices: 0,
      paidInvoices: 0,
      sentInvoices: 0,
      overdueInvoices: 0,
      draftInvoices: 0,
      cancelledInvoices: 0,
      totalQuotes: 0,
      acceptedQuotes: 0,
      sentQuotes: 0,
      viewedQuotes: 0,
      convertedQuotes: 0,
      rejectedQuotes: 0,
      expiredQuotes: 0,
      draftQuotes: 0,
      modificationRequestedQuotes: 0,
      activeRecurring: 0,
      totalRecurring: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      hasSubscription: false,
    };
  };

  const filteredClients = clientsArray.filter(client =>
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
      setEditingClientId(client._id || null);
      setFormData({
        clientType: client.clientType || 'individual',
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setEditingClientId(null);
      setFormData({
        clientType: 'individual',
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

  // Filter phone input to only allow numbers and + symbol
  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];
    
    if (!formData.name.trim()) {
      missingFields.push(formData.clientType === 'company' ? 'Company Name' : 'Name');
    }
    if (!formData.email.trim()) {
      missingFields.push('Email');
    }
    if (!formData.phone.trim()) {
      missingFields.push('Phone');
    }
    if (!formData.address.trim()) {
      missingFields.push('Address');
    }

    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: missingFields.join(', ') + (missingFields.length === 1 ? ' is required.' : ' are required.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingClientId) {
        await updateMutation.mutateAsync({
          id: editingClientId,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      setSearchQuery(""); // Clear search to show newly created client
      setIsDialogOpen(false);
      setEditingClient(null);
      setEditingClientId(null);
      setFormData({
        clientType: 'individual',
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
      });
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  const handleDelete = async () => {
    if (deletingClient) {
      try {
        await deleteMutation.mutateAsync(deletingClient._id);
        setIsDeleteDialogOpen(false);
        setDeletingClient(null);
      } catch (error) {
        // Error is handled by the mutation hook
      }
    }
  };

  const handleBulkImport = async (clients: Array<{
    clientType: 'individual' | 'company';
    name: string;
    email: string;
    phone: string;
    company?: string;
    address: string;
    notes?: string;
    rowNumber?: number;
  }>) => {
    const result = await bulkImportMutation.mutateAsync(clients);
    const extraFailureInfo =
      result.failures.length > 0
        ? ` First issue: row ${result.failures[0].rowNumber} (${result.failures[0].email}) - ${result.failures[0].reason}`
        : '';

    toast({
      title: 'Bulk import complete',
      description: `Successfully imported ${result.imported} client${result.imported !== 1 ? 's' : ''}${result.failed > 0 ? `. ${result.failed} failed.` : ''}${extraFailureInfo}`,
      variant: result.failed > 0 ? 'destructive' : 'default',
    });
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (clientsArray.length === 0) {
      toast({
        title: 'No clients to export',
        description: 'Add some clients first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    // Helper to format dates for CSV as YYYY-MM-DD
    const formatDateForCsv = (dateValue: string | undefined): string => {
      if (!dateValue) return '';
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };

    // Prepare export data with stats
    const exportData = clientsArray.map(client => {
      const stats = getClientStats(client);
      return {
        Name: client.name,
        Email: client.email,
        Type: client.clientType,
        Phone: client.phone || '',
        Company: client.company || '',
        Address: client.address || '',
        Notes: client.notes || '',
        'Created At': format === 'csv' ? formatDateForCsv(client.createdAt) : new Date(client.createdAt),
        'Total Invoices': stats.totalInvoices,
        'Paid Invoices': stats.paidInvoices,
        'Overdue Invoices': stats.overdueInvoices,
        'Total Quotes': stats.totalQuotes,
        'Accepted Quotes': stats.acceptedQuotes,
        'Active Subscriptions': stats.activeRecurring,
        'Total Revenue (KD)': format === 'csv' ? stats.totalRevenue : stats.totalRevenue.toFixed(3),
        'Pending Amount (KD)': format === 'csv' ? stats.pendingAmount : stats.pendingAmount.toFixed(3),
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
      description: `${clientsArray.length} clients exported as ${format.toUpperCase()}`,
    });
  };

  // Summary stats
  const totalClients = clientsArray.length;
  const activeClients = clientsArray.filter(c => {
    const stats = getClientStats(c);
    return stats.sentInvoices > 0 || stats.hasSubscription;
  }).length;
  const clientsWithOverdue = clientsArray.filter(c => getClientStats(c).overdueInvoices > 0).length;

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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-muted-foreground">Loading clients...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No clients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const stats = getClientStats(client);
                        return (
                          <TableRow key={client._id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{client.name}</p>
                                  <Badge variant={client.clientType === 'company' ? 'default' : 'secondary'} className="text-xs">
                                    {client.clientType === 'company' ? (
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
                                {client.company && client.clientType === 'individual' && (
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
                                <Badge variant="default" className="text-xs bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {stats.paidInvoices} Paid
                                </Badge>
                              )}
                              {stats.sentInvoices > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {stats.sentInvoices} Sent
                                </Badge>
                              )}
                              {stats.overdueInvoices > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {stats.overdueInvoices} Overdue
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
                                <Badge variant="default" className="text-xs bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {stats.acceptedQuotes} Accepted
                                </Badge>
                              )}
                              {stats.convertedQuotes > 0 && (
                                <Badge variant="default" className="text-xs bg-purple-600">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {stats.convertedQuotes} Converted
                                </Badge>
                              )}
                              {stats.sentQuotes > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Send className="h-3 w-3 mr-1" />
                                  {stats.sentQuotes} Sent
                                </Badge>
                              )}
                              {stats.viewedQuotes > 0 && (
                                <Badge variant="secondary" className="text-xs bg-cyan-100 dark:bg-cyan-900/30">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {stats.viewedQuotes} Viewed
                                </Badge>
                              )}
                              {stats.expiredQuotes > 0 && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {stats.expiredQuotes} Expired
                                </Badge>
                              )}
                              {stats.rejectedQuotes > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {stats.rejectedQuotes} Rejected
                                </Badge>
                              )}
                              {stats.modificationRequestedQuotes > 0 && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/30">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {stats.modificationRequestedQuotes} Mod. Req.
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
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  disabled={deleteMutation.isPending || updateMutation.isPending}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleViewClient(client)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleOpenDialog(client)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleConfirmDelete(client)}
                                  className="text-destructive"
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
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
                {editingClientId ? 'Update client information' : 'Add a new client to your database'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Client Type Selection */}
              <div className="space-y-2">
                <Label>Client Type *</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(value: ClientType) => setFormData({ ...formData, clientType: value })}
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
                  {formData.clientType === 'company' 
                    ? 'Add company details for business clients' 
                    : 'Add individual client personal details'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{formData.clientType === 'company' ? 'Company Name *' : 'Name *'}</Label>
                  <Input
                    placeholder={formData.clientType === 'company' ? 'Acme Inc.' : 'John Doe'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder={formData.clientType === 'company' ? 'info@company.com' : 'john@example.com'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    placeholder="+965 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: filterPhoneInput(e.target.value) })}
                  />
                </div>
                {formData.clientType === 'individual' && (
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
                <Label>Address *</Label>
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
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {editingClientId ? 'Update Client' : 'Add Client'}
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
                    const stats = getClientStats(viewingClient);
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
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="text-center p-3 bg-green-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
                              <p className="text-xs text-muted-foreground">Paid</p>
                            </div>
                            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{stats.sentInvoices}</p>
                              <p className="text-xs text-muted-foreground">Sent</p>
                            </div>
                            <div className="text-center p-3 bg-destructive/10 rounded-lg">
                              <p className="text-2xl font-bold text-destructive">{stats.overdueInvoices}</p>
                              <p className="text-xs text-muted-foreground">Overdue</p>
                            </div>
                            <div className="text-center p-3 bg-gray-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-gray-600">{stats.draftInvoices}</p>
                              <p className="text-xs text-muted-foreground">Draft</p>
                            </div>
                            <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-orange-600">{stats.cancelledInvoices}</p>
                              <p className="text-xs text-muted-foreground">Cancelled</p>
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
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="text-center p-3 bg-green-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{stats.acceptedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Accepted</p>
                            </div>
                            <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-purple-600">{stats.convertedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Converted</p>
                            </div>
                            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{stats.sentQuotes}</p>
                              <p className="text-xs text-muted-foreground">Sent</p>
                            </div>
                            <div className="text-center p-3 bg-cyan-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-cyan-600">{stats.viewedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Viewed</p>
                            </div>
                            <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-orange-600">{stats.expiredQuotes}</p>
                              <p className="text-xs text-muted-foreground">Expired</p>
                            </div>
                            <div className="text-center p-3 bg-destructive/10 rounded-lg">
                              <p className="text-2xl font-bold text-destructive">{stats.rejectedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Rejected</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-yellow-600">{stats.modificationRequestedQuotes}</p>
                              <p className="text-xs text-muted-foreground">Mod. Requested</p>
                            </div>
                            <div className="text-center p-3 bg-gray-500/10 rounded-lg">
                              <p className="text-2xl font-bold text-gray-600">{stats.draftQuotes}</p>
                              <p className="text-xs text-muted-foreground">Draft</p>
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
