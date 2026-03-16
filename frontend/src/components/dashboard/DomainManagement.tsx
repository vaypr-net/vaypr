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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Globe, Plus, Trash2, CheckCircle, Clock, AlertCircle, ArrowRight, RefreshCw, FileSearch, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DomainWizard } from './DomainWizard';

export function DomainManagement() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [viewingDomain, setViewingDomain] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null); // result dialog after clicking Check

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

  // Re-check domain status mutation
  const verifyMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await axiosInstance.post(`/brevo/domains/${domainId}/verify`);
      return res.data;
    },
    onSuccess: (updated: any) => {
      refetchDomains();
      refetchUsage();
      if (updated?.status === 'VERIFIED') {
        toast.success('Domain verified! Your domain is now active.');
      } else {
        // Show detailed result dialog instead of a plain toast
        setCheckResult(updated);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check domain status');
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
                        ) : domain.status === 'FAILED' ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="border-red-300 text-red-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                            {domain.errorMessage && (
                              <p className="text-xs text-red-600 max-w-[200px]">{domain.errorMessage}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            {domain.errorMessage && (
                              <p className="text-xs text-muted-foreground max-w-[200px]">{domain.errorMessage}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(domain.createdAt).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {domain.status !== 'VERIFIED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyMutation.mutate(domain._id)}
                                disabled={verifyMutation.isPending}
                                title="Re-check DNS status"
                              >
                                <RefreshCw className={`w-3 h-3 mr-1 ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
                                Check
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setViewingDomain(domain); setIsOpen(true); }}
                                title="View DNS records"
                              >
                                <FileSearch className="w-3 h-3 mr-1" />
                                DNS Records
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(domain._id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS Check Result Dialog */}
      {checkResult && (
        <Dialog open={!!checkResult} onOpenChange={() => setCheckResult(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
            <DialogHeader className="pb-1">
              <DialogTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                DNS Check — <span className="font-mono text-foreground">{checkResult.domain}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {checkResult.errorMessage || 'DNS records not yet fully propagated. Add any missing records to your provider, then check again after 15–48 h.'}
              </DialogDescription>
            </DialogHeader>

            {/* Per-record breakdown — 2-column grid */}
            {checkResult.checks && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { key: 'brevo_code', label: 'Brevo Code', desc: 'Ownership verification (TXT)', purpose: 'BREVO_CODE' },
                  { key: 'dkim',       label: 'DKIM',       desc: 'Email auth signature',         purpose: 'DKIM' },
                  { key: 'dmarc',      label: 'DMARC',      desc: 'Email policy record',          purpose: 'DMARC' },
                  { key: 'spf',        label: 'SPF',        desc: 'Authorized sending servers',   purpose: 'SPF' },
                ].map(({ key, label, desc, purpose }) => {
                  const val: string = (checkResult.checks[key] || 'MISSING').toUpperCase();
                  const isOk      = val === 'OK';
                  const isFail    = val === 'FAIL';
                  const isMissing = val === 'MISSING';
                  const needsAction = isFail || isMissing;
                  const dnsRecord = (checkResult.dnsRecords || []).find((r: any) => r.purpose === purpose);
                  return (
                    <div key={key} className={`rounded-lg border ${
                      isOk      ? 'border-green-200 bg-green-50/70'
                    : isFail    ? 'border-red-200 bg-red-50/70'
                    : 'border-yellow-200 bg-yellow-50/70'
                    }`}>
                      {/* Card header */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex-shrink-0">
                          {isOk   ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          : isFail ? <XCircle className="w-3.5 h-3.5 text-red-600" />
                          : <Clock className="w-3.5 h-3.5 text-yellow-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold leading-tight ${
                            isOk ? 'text-green-800' : isFail ? 'text-red-800' : 'text-yellow-800'
                          }`}>{label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight truncate">{desc}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          isOk      ? 'bg-green-100 text-green-700'
                        : isFail    ? 'bg-red-100 text-red-700'
                        : isMissing ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isOk ? 'OK' : isFail ? 'FAILED' : isMissing ? 'MISSING' : 'PENDING'}
                        </span>
                      </div>
                      {/* DNS record details for failing records */}
                      {needsAction && dnsRecord && (
                        <div className="mx-2 mb-2 p-2 bg-white border border-dashed border-red-200 rounded text-[11px] space-y-1">
                          <p className="font-semibold text-red-600 text-[10px] uppercase tracking-wide mb-1">Add to DNS provider</p>
                          {[
                            { field: 'Type',  value: dnsRecord.type },
                            { field: 'Host',  value: dnsRecord.host },
                            { field: 'Value', value: dnsRecord.value },
                            ...(dnsRecord.ttl ? [{ field: 'TTL', value: dnsRecord.ttl }] : []),
                          ].map(({ field, value }) => (
                            <div key={field} className="flex items-start gap-1.5">
                              <span className="w-8 text-muted-foreground flex-shrink-0 font-medium">{field}</span>
                              <span className="font-mono break-all flex-1 text-gray-800 select-all leading-tight">{value}</span>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(value)}
                                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                                title={`Copy ${field}`}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <span>Add missing records to your DNS provider, wait 15–48 h for propagation, then click <em>Check</em> again.</span>
            </div>

            <DialogFooter className="mt-1">
              <Button variant="outline" size="sm" onClick={() => {
                setCheckResult(null);
                setViewingDomain(checkResult);
                setIsOpen(true);
              }}>View DNS Records</Button>
              <Button size="sm" onClick={() => setCheckResult(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Domain Dialog - Using Wizard */}
      <DomainWizard
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setViewingDomain(null);
        }}
        initialDomain={viewingDomain}
        onDomainAdded={() => {
          refetchDomains();
          refetchUsage();
          setViewingDomain(null);
        }}
      />
    </div>
  );
}
