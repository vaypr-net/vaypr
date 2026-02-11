import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Eye, FileText, Download, Calendar, CheckCircle, Clock, XCircle, Loader } from "lucide-react";
import { SearchFilter } from "@/components/super-admin/SearchFilter";
import { DataTable } from "@/components/super-admin/DataTable";
import { StatusBadge } from "@/components/super-admin/StatusBadge";
import { TransactionService, Transaction, TransactionStats } from "@/api/services/transaction.service";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function Transactions() {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  
  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await TransactionService.getAll({
          search: searchValue || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          limit: pageSize,
          offset: page * pageSize,
        });
        
        setTransactions(response.items);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [searchValue, statusFilter, typeFilter, page, pageSize]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await TransactionService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  // Mock invoices data for the subscriber (can be replaced with real API later)
  const getMockInvoices = (subscriberName: string) => [
    { id: "INV-2025001", date: "2025-01-15", amount: 29, status: "paid" as const },
    { id: "INV-2024012", date: "2024-12-15", amount: 29, status: "paid" as const },
    { id: "INV-2024011", date: "2024-11-15", amount: 29, status: "paid" as const },
    { id: "INV-2024010", date: "2024-10-15", amount: 29, status: "paid" as const },
    { id: "INV-2024009", date: "2024-09-15", amount: 29, status: "paid" as const },
    { id: "INV-2024008", date: "2024-08-15", amount: 29, status: "overdue" as const },
  ];

  const columns = [
    { header: "Transaction ID", accessor: (row: Transaction) => row.transactionId },
    {
      header: "Subscriber",
      accessor: (row: Transaction) => (
        <div>
          <p className="font-medium">{row.subscriberName}</p>
          <p className="text-sm text-muted-foreground">{row.subscriberEmail}</p>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: (row: Transaction) => (
        <span className={`font-medium ${row.type === "refund" ? "text-orange-600" : ""}`}>
          {row.type === "refund" ? "-" : ""}{formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: (row: Transaction) => (
        <Badge variant="outline" className="capitalize">
          {row.type}
        </Badge>
      ),
    },
    { header: "Plan", accessor: "plan" as keyof Transaction },
    { header: "Provider", accessor: "provider" as keyof Transaction },
    {
      header: "Status",
      accessor: (row: Transaction) => <StatusBadge status={row.status} />,
    },
    {
      header: "Date",
      accessor: (row: Transaction) => formatDate(row.transactionDate),
    },
    {
      header: "Actions",
      accessor: (row: Transaction) => (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSelectedTransaction(row)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">View all billing transactions and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Revenue", 
            value: stats ? formatCurrency(stats.totalRevenue) : "—", 
            change: stats ? `${stats.successfulCount} transactions` : "—" 
          },
          { 
            label: "Successful", 
            value: stats?.successfulCount || "0", 
            change: stats?.successfulCount ? `${stats.successfulCount} completed` : "—" 
          },
          { 
            label: "Failed", 
            value: stats?.failedCount || "0", 
            change: stats?.failedCount ? `${stats.failedCount} failed` : "—", 
            negative: true 
          },
          { 
            label: "Refunds", 
            value: stats ? formatCurrency(stats.refundsTotal) : "—", 
            change: stats?.refundsTotal ? `Total refunded` : "—" 
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="kpi-card"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.negative ? "text-destructive" : "text-success"}`}>
              {stat.change}
            </p>
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
          searchPlaceholder="Search by ID, name, or email..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={[
            {
              name: "Status",
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Succeeded", value: "succeeded" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
                { label: "Pending", value: "pending" },
              ],
              value: statusFilter,
              onChange: setStatusFilter,
            },
            {
              name: "Type",
              options: [
                { label: "All Types", value: "all" },
                { label: "Subscription", value: "subscription" },
                { label: "Refund", value: "refund" },
                { label: "Chargeback", value: "chargeback" },
              ],
              value: typeFilter,
              onChange: setTypeFilter,
            },
          ]}
          onExport={() => console.log("Export CSV")}
        />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <DataTable
            columns={columns}
            data={transactions}
            emptyMessage="No transactions found"
            emptyIcon={<Receipt className="w-12 h-12" />}
          />
        )}
      </motion.div>

      {/* Transaction Detail Sheet */}
      <Sheet open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedTransaction && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction Details</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className={`text-3xl font-bold ${selectedTransaction.type === "refund" ? "text-orange-600" : ""}`}>
                    {selectedTransaction.type === "refund" ? "-" : ""}{formatCurrency(selectedTransaction.amount)}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selectedTransaction.status} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-medium">{selectedTransaction.transactionId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="capitalize">{selectedTransaction.type}</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{formatDate(selectedTransaction.transactionDate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{selectedTransaction.provider}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{selectedTransaction.plan}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Subscriber</p>
                  <p className="font-medium">{selectedTransaction.subscriberName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.subscriberEmail}</p>
                </div>

                {selectedTransaction.status === "failed" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Failure Reason</p>
                    <p className="text-sm text-red-600 mt-1">Card declined - insufficient funds</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAllInvoices(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" /> View All Invoices
                  </Button>
                  {selectedTransaction.status === "succeeded" && (
                    <Button variant="outline" className="flex-1">Issue Refund</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* All Invoices Sheet */}
      <Sheet open={showAllInvoices} onOpenChange={setShowAllInvoices}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Invoices
            </SheetTitle>
          </SheetHeader>

          {selectedTransaction && (
            <div className="mt-6 space-y-4">
              {/* Subscriber Info */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Invoices for</p>
                <p className="font-semibold">{selectedTransaction.subscriberName}</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.subscriberEmail}</p>
              </div>

              {/* Invoice Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {getMockInvoices(selectedTransaction.subscriberName).map((invoice) => (
                        <div 
                          key={invoice.id}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{invoice.id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {invoice.status === "paid" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : invoice.status === "overdue" ? (
                                <XCircle className="w-4 h-4 text-destructive" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                              <Badge 
                                variant="outline" 
                                className={
                                  invoice.status === "paid" 
                                    ? "text-green-600 border-green-200 bg-green-50" 
                                    : invoice.status === "overdue"
                                    ? "text-destructive border-red-200 bg-red-50"
                                    : "text-amber-600 border-amber-200 bg-amber-50"
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(invoice.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Download className="w-3 h-3 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="paid" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {getMockInvoices(selectedTransaction.subscriberName)
                        .filter(inv => inv.status === "paid")
                        .map((invoice) => (
                          <div 
                            key={invoice.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{invoice.id}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                  paid
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(invoice.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Download className="w-3 h-3 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {getMockInvoices(selectedTransaction.subscriberName)
                        .filter(inv => inv.status === "overdue")
                        .map((invoice) => (
                          <div 
                            key={invoice.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{invoice.id}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-destructive" />
                                <Badge variant="outline" className="text-destructive border-red-200 bg-red-50">
                                  overdue
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(invoice.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Download className="w-3 h-3 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Invoices</span>
                  <span className="font-medium">{getMockInvoices(selectedTransaction.subscriberName).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      getMockInvoices(selectedTransaction.subscriberName)
                        .filter(inv => inv.status === "paid")
                        .reduce((sum, inv) => sum + inv.amount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(
                      getMockInvoices(selectedTransaction.subscriberName)
                        .filter(inv => inv.status !== "paid")
                        .reduce((sum, inv) => sum + inv.amount, 0)
                    )}
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAllInvoices(false)}
              >
                Back to Transaction
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
