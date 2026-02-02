import { useDashboardStats, useInvoices, useReminders, useQuotes, useRecurringBilling } from '@/hooks/useData';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle,
  ArrowRight,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Dashboard() {
  const stats = useDashboardStats();
  const { invoices } = useInvoices();
  const { reminders } = useReminders();
  const { quotes } = useQuotes();
  const { recurringBillings } = useRecurringBilling();

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentQuotes = quotes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingReminders = reminders
    .filter(r => !r.isRead)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;

  // Calculate recurring invoices due this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const recurringThisMonth = recurringBillings.filter(r => {
    if (!r.isActive) return false;
    const nextBilling = new Date(r.nextBillingDate);
    return nextBilling.getMonth() === currentMonth && nextBilling.getFullYear() === currentYear;
  }).length;

  const formatCurrency = (amount: number) => {
    return `KD ${amount.toFixed(3)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              {stats.overdueInvoices > 0 && (
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.overdueInvoices} overdue
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Viewed Quotes
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Subscriptions
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recurringThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Invoices due this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your latest created invoices</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/invoices">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/dashboard/invoices/new">Create your first invoice</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{invoice.clientName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">{formatCurrency(invoice.total)}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>Your latest created quotes</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/quotes">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentQuotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No quotes yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/dashboard/quotes">Create your first quote</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuotes.map((quote) => (
                    <div 
                      key={quote.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{quote.quoteNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{quote.clientName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">{formatCurrency(quote.total)}</p>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders */}
        {upcomingReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Reminders</CardTitle>
              <CardDescription>Don't forget these important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
                  >
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">{reminder.message}</p>
                      <p className="text-xs text-warning mt-1">
                        Due: {format(new Date(reminder.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    sent: { variant: 'outline', label: 'Sent' },
    paid: { variant: 'default', label: 'Paid' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };

  const { variant, label } = variants[status] || { variant: 'secondary', label: status };

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    sent: { variant: 'outline', label: 'Sent' },
    accepted: { variant: 'default', label: 'Accepted' },
    rejected: { variant: 'destructive', label: 'Rejected' },
    expired: { variant: 'secondary', label: 'Expired' },
    converted: { variant: 'default', label: 'Converted' },
  };

  const { variant, label } = variants[status] || { variant: 'secondary', label: status };

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}
