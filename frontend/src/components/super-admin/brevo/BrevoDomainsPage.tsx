import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, Copy, Trash2, RefreshCw, Shield, AlertCircle, XCircle, Clock, CheckCircle, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BrevoService, BrevoD } from '@/api/services/brevo.service';
import { AddDomainWizard } from '@/components/super-admin/brevo/AddDomainWizard';
import { DomainStatusBadge } from '@/components/super-admin/brevo/DomainStatusBadge';
import { CheckBadge } from '@/components/super-admin/brevo/CheckBadge';

export function BrevoDomainsPage() {
  const [domains, setDomains] = useState<BrevoD[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<BrevoD | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [authenticatingDomainId, setAuthenticatingDomainId] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<BrevoD | null>(null);
  const [dnsWizardOpen, setDnsWizardOpen] = useState(false);
  const [dnsWizardDomain, setDnsWizardDomain] = useState<BrevoD | null>(null);
  const { toast } = useToast();

  // Load domains
  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await BrevoService.getDomains();
      setDomains(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load domains',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (newDomain: BrevoD) => {
    setDomains([...domains, newDomain]);
    setWizardOpen(false);
    toast({
      title: 'Domain added',
      description: 'Complete the DNS setup to verify your domain.',
    });
  };

  const handleVerify = async (domain: BrevoD) => {
    try {
      const domainId = domain._id || domain.id;
      if (!domainId) {
        throw new Error('Domain ID not found');
      }
      const updated = await BrevoService.verifyDomain(domainId);
      setDomains(domains.map(d => ((d._id || d.id) === domainId ? updated : d)));
      
      if (updated.status === 'VERIFIED') {
        toast({
          title: 'Domain verified!',
          description: 'Your domain is now authenticated.',
        });
      } else {
        // Show detailed DNS check result dialog
        setCheckResult(updated);
      }
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Could not verify domain. Check DNS records and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAuthenticate = async (domain: BrevoD) => {
    const domainId = domain._id || domain.id;
    if (!domainId) {
      toast({
        title: 'Error',
        description: 'Domain ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAuthenticatingDomainId(domainId);
      const updated = await BrevoService.authenticateDomain(domainId);
      
      // Update the domain in the list
      setDomains(domains.map(d => ((d._id || d.id) === domainId ? updated : d)));
      
      if (updated.status === 'VERIFIED') {
        toast({
          title: 'Domain authenticated!',
          description: `${domain.domain} is now authenticated and ready to send emails.`,
        });
      } else {
        toast({
          title: 'Authentication in progress',
          description: 'Domain authentication initiated. It may take a few moments to complete.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
      toast({
        title: 'Authentication failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAuthenticatingDomainId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!domainToDelete) return;
    
    try {
      setDeleting(true);
      const domainId = domainToDelete._id || domainToDelete.id;
      if (!domainId) {
        throw new Error('Domain ID not found');
      }
      await BrevoService.deleteDomain(domainId);
      setDomains(domains.filter(d => (d._id || d.id) !== domainId));
      toast({
        title: 'Domain removed',
        description: 'The domain has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete domain',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Brevo Domains</h2>
          </div>
          <p className="text-muted-foreground">
            Authenticate your sending domain to improve deliverability.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Add Domain Wizard Modal */}
      <AddDomainWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        onDomainAdded={handleAddDomain}
      />

      {/* DNS Records Wizard — view existing domain's records */}
      <AddDomainWizard
        open={dnsWizardOpen}
        onOpenChange={(o) => { setDnsWizardOpen(o); if (!o) setDnsWizardDomain(null); }}
        onDomainAdded={() => { setDnsWizardOpen(false); setDnsWizardDomain(null); }}
        initialDomain={dnsWizardDomain ?? undefined}
      />

      {/* Content */}
      {domains.length === 0 && !loading ? (
        // Empty State
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-admin text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No domains added yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your sending domain to authenticate with Brevo.
          </p>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Domain
          </Button>
        </motion.div>
      ) : (
        // Domains Table
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Configured Domains</CardTitle>
            <CardDescription>
              Manage and verify your authenticated sending domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading domains...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checks</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain._id || domain.id}>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell>
                          <DomainStatusBadge status={domain.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <CheckBadge status={domain.checks.brevo_code} label="Brevo" />
                            <CheckBadge status={domain.checks.dkim} label="DKIM" />
                            <CheckBadge status={domain.checks.dmarc} label="DMARC" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {domain.lastCheckedAt
                            ? new Date(domain.lastCheckedAt).toLocaleDateString('en-GB')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const domainId = domain._id || domain.id;
                                if (domainId) {
                                  const fullDomain = { ...domain, id: domainId, _id: domainId };
                                  handleVerify(fullDomain);
                                }
                              }}
                              className="gap-1"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Check
                            </Button>
                            {domain.status !== 'VERIFIED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const domainId = domain._id || domain.id;
                                  if (domainId) {
                                    setDnsWizardDomain({ ...domain, id: domainId, _id: domainId });
                                    setDnsWizardOpen(true);
                                  }
                                }}
                                className="gap-1"
                                title="View DNS records to add"
                              >
                                <FileSearch className="h-4 w-4" />
                                DNS Records
                              </Button>
                            )}
                            {domain.status === 'DNS_PENDING' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  const domainId = domain._id || domain.id;
                                  if (domainId) {
                                    const fullDomain = { ...domain, id: domainId, _id: domainId };
                                    handleAuthenticate(fullDomain);
                                  }
                                }}
                                disabled={authenticatingDomainId === (domain._id || domain.id)}
                                className="gap-1"
                              >
                                <Shield className="h-4 w-4" />
                                {authenticatingDomainId === (domain._id || domain.id) ? 'Authenticating...' : 'Authenticate'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const domainWithId = { ...domain, id: domain._id || domain.id, _id: domain._id || domain.id };
                                setDomainToDelete(domainWithId);
                                setDeleteDialogOpen(true);
                              }}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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

            {/* Per-record breakdown */}
            {checkResult.checks && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { key: 'brevo_code', label: 'Brevo Code', desc: 'Ownership verification (TXT)', purpose: 'BREVO_CODE' },
                  { key: 'dkim',       label: 'DKIM',       desc: 'Email auth signature',         purpose: 'DKIM' },
                  { key: 'dmarc',      label: 'DMARC',      desc: 'Email policy record',          purpose: 'DMARC' },
                  { key: 'spf',        label: 'SPF',        desc: 'Authorized sending servers',   purpose: 'SPF' },
                ].map(({ key, label, desc, purpose }) => {
                  const val: string = ((checkResult.checks as any)[key] || 'MISSING').toUpperCase();
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
                          {isOk    ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          : isFail  ? <XCircle    className="w-3.5 h-3.5 text-red-600" />
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
                      {/* DNS record details for failing/missing records */}
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
                const d = checkResult;
                setCheckResult(null);
                setDnsWizardDomain(d);
                setDnsWizardOpen(true);
              }}>View DNS Records</Button>
              <Button size="sm" onClick={() => setCheckResult(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{domainToDelete?.domain}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
