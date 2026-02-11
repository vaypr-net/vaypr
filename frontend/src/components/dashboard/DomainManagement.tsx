import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Globe, Plus, Trash2, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DomainWizard } from './DomainWizard';

export function DomainManagement() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch domain usage
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['domain-usage'],
    queryFn: async () => {
      const res = await axiosInstance.get('/brevo/domain-usage');
      return res.data;
    },
  });

  // Fetch user domains
  const { data: domains = [], isLoading: domainsLoading, refetch: refetchDomains } = useQuery({
    queryKey: ['user-domains'],
    queryFn: async () => {
      const res = await axiosInstance.get('/brevo/domains');
      return res.data || [];
    },
  });

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: async (domainId: string) => {
      await axiosInstance.delete(`/brevo/domains/${domainId}`);
    },
    onSuccess: () => {
      toast.success('Domain deleted successfully');
      refetchDomains();
      refetchUsage();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete domain');
    },
  });

  if (usageLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading domain info...</div>;
  }

  const canAddMore = usage?.canAddMore ?? false;
  const limitPercentage = usage?.limit === 'Unlimited' ? 0 : (usage?.verified / usage?.limit) * 100;
  const isLimitReached = !canAddMore && usage?.limit !== 'Unlimited';

  return (
    <div className="space-y-6">
      {/* Domain Usage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Custom Domains
              </CardTitle>
              <CardDescription>
                Add custom domains for professional email sending
              </CardDescription>
            </div>
            <Badge variant={usage?.verified > 0 ? 'default' : 'outline'}>
              {usage?.verified} / {usage?.limit}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Domain Usage</span>
              <span className="text-muted-foreground">
                {usage?.verified} verified, {usage?.pending} pending
              </span>
            </div>
            {usage?.limit !== 'Unlimited' && (
              <Progress value={Math.min(limitPercentage, 100)} className="h-2" />
            )}
          </div>

          {/* Status Messages */}
          {usage?.limit === 'Unlimited' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                Your plan supports <strong>unlimited</strong> custom domains
              </div>
            </div>
          )}

          {isLimitReached && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="text-sm text-orange-700 font-medium">
                  Domain limit reached
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="h-7 text-xs"
                >
                  Upgrade Plan <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {usage?.pending > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                {usage.pending} domain(s) pending DNS verification
              </div>
            </div>
          )}

          {/* Add Domain Button */}
          {canAddMore && (
            <Button
              onClick={() => setIsOpen(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Domains List */}
      {domains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain: any) => (
                    <TableRow key={domain._id}>
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell>
                        {domain.status === 'VERIFIED' ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(domain._id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Domain Dialog - Using Wizard */}
      <DomainWizard
        open={isOpen}
        onOpenChange={setIsOpen}
        onDomainAdded={() => {
          refetchDomains();
          refetchUsage();
        }}
      />
    </div>
  );
}
