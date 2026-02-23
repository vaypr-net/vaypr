/**
 * EXAMPLE INTEGRATION - How to use Affiliate hooks in the Affiliates component
 * 
 * This is a simplified example showing the pattern to follow.
 * Replace mock data with real API calls.
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import {
  useGetAffiliates,
  useCreateAffiliate,
  useUpdateAffiliate,
  useDeleteAffiliate,
  useUpdateAffiliateStatus,
} from '@/hooks/api/useAffiliates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { DataTable } from '@/components/super-admin/DataTable';
import { StatusBadge } from '@/components/super-admin/StatusBadge';

export default function AffiliatesExample() {
  // ==================== STATE ====================
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [pagination, setPagination] = useState({ limit: 10, offset: 0 });

  // ==================== QUERIES & MUTATIONS ====================

  // Fetch affiliates with filters
  const { data, isLoading, error } = useGetAffiliates(
    searchValue || undefined,
    statusFilter === 'all' ? undefined : statusFilter,
    tierFilter === 'all' ? undefined : tierFilter,
    pagination.limit,
    pagination.offset,
  );

  // Mutations
  const createMutation = useCreateAffiliate();
  const updateMutation = useUpdateAffiliate();
  const deleteMutation = useDeleteAffiliate();
  const statusMutation = useUpdateAffiliateStatus();

  // ==================== HANDLERS ====================

  const handleCreateAffiliate = async () => {
    // Open dialog, get form data, then:
    const newAffiliateData = {
      name: 'New Affiliate',
      email: 'affiliate@example.com',
      code: 'NEW001',
      tier: 'Bronze',
    };

    await createMutation.mutateAsync(newAffiliateData);
    // ✅ Toast shown automatically
    // ✅ List refreshed automatically
  };

  const handleUpdateAffiliate = async (affiliateId: string) => {
    const updatedData = {
      name: 'Updated Name',
      tier: 'Silver',
    };

    await updateMutation.mutateAsync({
      id: affiliateId,
      data: updatedData,
    });
    // ✅ Toast shown automatically
    // ✅ List refreshed automatically
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState<string | null>(null);

  const handleDeleteAffiliate = async (affiliateId: string) => {
    setAffiliateToDelete(affiliateId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAffiliate = async () => {
    if (affiliateToDelete) {
      await deleteMutation.mutateAsync(affiliateToDelete);
      setDeleteConfirmOpen(false);
      setAffiliateToDelete(null);
      // ✅ Toast shown automatically
      // ✅ List refreshed automatically
    }
  };

  const handleToggleStatus = async (affiliateId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    await statusMutation.mutateAsync({
      id: affiliateId,
      status: newStatus as 'active' | 'inactive',
    });
    // ✅ Toast shown automatically
    // ✅ List refreshed automatically
  };

  // ==================== TABLE COLUMNS ====================

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Code', accessor: 'code' },
    { header: 'Tier', accessor: 'tier' },
    {
      header: 'Referrals',
      accessor: (row) => <span className="font-medium">{row.referrals}</span>,
    },
    {
      header: 'Earnings',
      accessor: (row) => <span className="font-medium">{row.earnings} KWD</span>,
    },
    {
      header: 'Pending',
      accessor: (row) => <span className="text-orange-600">{row.pending} KWD</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge 
          status={row.status}
          onClick={() => handleToggleStatus(row._id, row.status)}
          className="cursor-pointer"
        />
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Open view dialog
              console.log('View', row._id);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdateAffiliate(row._id)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteAffiliate(row._id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ==================== LOADING / ERROR STATES ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading affiliates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          Error loading affiliates. Please try again.
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Affiliates</h1>
          <p className="text-muted-foreground">Manage affiliate partners</p>
        </div>
        <Button onClick={handleCreateAffiliate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Affiliate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg">
        <Input
          placeholder="Search by name, email, or code..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setPagination({ ...pagination, offset: 0 }); // Reset pagination
          }}
          className="flex-1"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="Bronze">Bronze</SelectItem>
            <SelectItem value="Silver">Silver</SelectItem>
            <SelectItem value="Gold">Gold</SelectItem>
            <SelectItem value="Platinum">Platinum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading || createMutation.isPending || updateMutation.isPending}
        />
      </div>

      {/* Pagination Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {data?.items?.length || 0} of {data?.total || 0} affiliates
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagination.offset === 0}
            onClick={() =>
              setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!data?.hasMore}
            onClick={() =>
              setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Affiliate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this affiliate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAffiliate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * KEY POINTS:
 * 
 * 1. **Data Fetching**: useGetAffiliates() replaces mockAffiliates
 *    - Automatically fetches from API
 *    - Respects filters (search, status, tier)
 *    - Handles pagination (limit, offset)
 * 
 * 2. **Mutations**: Create/Update/Delete done via mutations
 *    - Shows loading spinner automatically
 *    - Shows toast on success/error
 *    - Auto-refreshes list
 * 
 * 3. **Error Handling**: Wrapped in try-catch or handled by mutations
 *    - Errors show as toast messages
 *    - User sees friendly error messages
 * 
 * 4. **Loading States**: isLoading flag used for entire page
 *    - isPending flags used for mutation operations
 *    - UI updates automatically
 * 
 * 5. **Pagination**: Managed via state
 *    - Next/Prev buttons update offset
 *    - hasMore tells if more data exists
 * 
 * 6. **Filtering**: Via controlled inputs
 *    - Search updates data in real-time
 *    - Status/tier filters applied
 *    - Pagination reset on filter change
 */
