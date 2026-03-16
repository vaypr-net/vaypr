import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentDateInput } from '@/components/ui/document-date-input';
import { 
  useExpenses, 
  useExpenseStats, 
  useCreateExpense, 
  useUpdateExpense, 
  useDeleteExpense 
} from '@/hooks/api/useExpenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Receipt, TrendingDown, PlusCircle, Loader2 } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/app';
import { Badge } from '@/components/ui/badge';

const CUSTOM_CATEGORIES_KEY = 'expense_custom_categories';

export default function Expenses() {
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  
  // API hooks
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const { data: expenses = [], isLoading, refetch } = useExpenses({ category: categoryFilter });
  const { data: stats } = useExpenseStats();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();
  
  // Ensure expenses is always an array
  const expensesArray = Array.isArray(expenses) ? expenses : [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<{ value: string; label: string }[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Load custom categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch {
        console.error('Failed to parse custom categories');
      }
    }
  }, []);

  // All categories (default + custom)
  const allCategories = [...EXPENSE_CATEGORIES, ...customCategories];

  const [formData, setFormData] = useState({
    category: 'other' as string,
    description: '',
    amount: 0,
    currency: 'KWD',
    date: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    notes: '',
  });

  const filteredExpenses = expensesArray.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return `KD ${amount.toFixed(3)}`;
  };

  const getCategoryLabel = (category: string) => {
    return allCategories.find(c => c.value === category)?.label || category;
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a category name.',
        variant: 'destructive',
      });
      return;
    }

    const value = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if category already exists
    if (allCategories.some(c => c.value === value)) {
      toast({
        title: 'Category exists',
        description: 'This category already exists.',
        variant: 'destructive',
      });
      return;
    }

    const newCategory = { value, label: newCategoryName.trim() };
    const updatedCategories = [...customCategories, newCategory];
    setCustomCategories(updatedCategories);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    
    // Set the new category as selected
    setFormData({ ...formData, category: value });
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
    
    toast({
      title: 'Category added',
      description: `"${newCategoryName.trim()}" has been added to categories.`,
    });
  };

  const thisMonthExpenses = expensesArray
    .filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenDialog = () => {
    setEditingExpense(null);
    setReceiptFile(null);
    setFormData({
      category: 'other',
      description: '',
      amount: 0,
      currency: 'KWD',
      date: format(new Date(), 'yyyy-MM-dd'),
      vendor: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];

    // Check required fields
    if (!formData.description.trim()) {
      missingFields.push('Description');
    }
    if (formData.amount <= 0) {
      missingFields.push('Amount');
    }

    // If there are missing fields, show them
    if (missingFields.length > 0) {
      const fieldText = missingFields.join(', ');
      const isPlural = missingFields.length > 1;
      toast({
        title: 'Missing required fields',
        description: `${fieldText} ${isPlural ? 'are' : 'is'} required.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({
          id: editingExpense._id,
          data: formData,
          receipt: receiptFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          data: formData,
          receipt: receiptFile || undefined,
        });
      }

      setSearchQuery(""); // Clear search to show newly created expense
      setIsDialogOpen(false);
      setEditingExpense(null);
      setReceiptFile(null);
      setFormData({
        category: 'other',
        description: '',
        amount: 0,
        currency: 'KWD',
        date: format(new Date(), 'yyyy-MM-dd'),
        vendor: '',
        notes: '',
      });
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleDelete = async (expense: any) => {
    setExpenseToDelete(expense);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete || deleteMutation.isPending) return;
    
    try {
      await deleteMutation.mutateAsync(expenseToDelete._id);
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setReceiptFile(null); // Reset file input when editing
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency || 'KWD',
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      vendor: expense.vendor || '',
      notes: expense.notes || '',
    });
    setIsDialogOpen(true);
  };

  const totalExpenses = stats?.totalAmount || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your business expenses</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(thisMonthExpenses)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select 
                value={categoryFilter || 'all'} 
                onValueChange={(val) => setCategoryFilter(val === 'all' ? undefined : val)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0">
            {filteredExpenses.length === 0 && !isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No expenses found</p>
                <p className="text-sm">Start tracking your business expenses</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading expenses...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow 
                        key={expense._id}
                        className={deleteMutation.isPending ? 'opacity-50' : ''}
                      >
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryLabel(expense.category)}</Badge>
                        </TableCell>
                        <TableCell>{expense.vendor || '-'}</TableCell>
                        <TableCell className="font-medium text-destructive">
                          -{formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>{format(new Date(expense.date), 'd MMM yyyy')}</TableCell>
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
                                onClick={() => handleEdit(expense)}
                                disabled={deleteMutation.isPending}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(expense)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Expense Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update expense details' : 'Record a new business expense'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Office supplies, software subscription, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <DocumentDateInput
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v: string) => {
                      if (v === '__add_new__') {
                        setIsAddCategoryOpen(true);
                      } else {
                        setFormData({ ...formData, category: v });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="text-primary">
                        <span className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Add New Category
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    placeholder="Company name"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Receipt (Optional)</Label>
                {editingExpense?.receipt && !receiptFile && (
                  <div className="mb-2 p-2 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Current receipt:</p>
                    <a 
                      href={editingExpense.receipt}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Receipt className="h-3 w-3" />
                      View receipt
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Upload a new file to replace it</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                {receiptFile && (
                  <p className="text-sm text-muted-foreground">Selected: {receiptFile.name}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a custom expense category
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  placeholder="e.g., Entertainment, Insurance"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
