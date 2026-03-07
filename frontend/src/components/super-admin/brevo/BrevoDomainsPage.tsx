import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, Copy, Trash2, RefreshCw } from 'lucide-react';
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
        toast({
          title: 'Verification in progress',
          description: 'Some checks may still be pending. Try again in a few moments.',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Could not verify domain. Check DNS records and try again.',
        variant: 'destructive',
      });
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
                              Verify
                            </Button>
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
