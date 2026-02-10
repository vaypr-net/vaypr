import { useDashboardStats } from '@/hooks/api/useDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BillingStatus } from '@/components/dashboard/BillingStatus';
import { 
  FileText, 
  AlertTriangle,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return `KD ${amount.toFixed(3)}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">Failed to load dashboard stats</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial activity</p>
        </div>

        <BillingStatus />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.invoices?.overdue ?? 0}</div>
              {(stats?.invoices?.overdue ?? 0) > 0 && (
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
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
              <div className="text-2xl font-bold">{stats?.quotes?.viewed ?? 0}</div>
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
              <div className="text-2xl font-bold">{stats?.recurring?.thisMonth ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Invoices due this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {(stats?.recentInvoices?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/dashboard/invoices/new">Create your first invoice</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(stats?.recentInvoices ?? []).map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground truncate">{invoice.clientName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">{formatCurrency(invoice.amount)}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
              {(stats?.recentQuotes?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No quotes yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/dashboard/quotes">Create your first quote</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(stats?.recentQuotes ?? []).map((quote) => (
                    <div 
                      key={quote.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{quote.number}</p>
                        <p className="text-xs text-muted-foreground truncate">{quote.clientName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">{formatCurrency(quote.amount)}</p>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
    viewed: { variant: 'outline', label: 'Viewed' },
  };

  const { variant, label} = variants[status] || { variant: 'secondary', label: status };

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}
