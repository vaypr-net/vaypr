import { useState } from 'react';
import { AlertCircle, Copy, Check, ChevronRight, ChevronLeft, Loader2, AlertTriangle, CheckCircle2, Clock, FileText, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { BrevoService, BrevoD } from '@/api/services/brevo.service';
import { DomainStatusBadge } from './DomainStatusBadge';
import { CheckBadge } from './CheckBadge';

interface AddDomainWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDomainAdded: (domain: BrevoD) => void;
}

type Step = 1 | 2 | 3;

type Provider = 'cloudflare' | 'godaddy' | 'namecheap' | 'hostinger' | 'aws' | 'digitalocean' | 'other';

const PROVIDER_TIPS: Record<Provider, string> = {
  cloudflare: 'Use DNS-only (gray cloud) for CNAME',
  godaddy: 'DNS takes 15-30 minutes',
  namecheap: 'Use Advanced DNS',
  hostinger: 'Go to Hosting → Domains → DNS',
  aws: 'Use Route 53',
  digitalocean: 'Enter subdomain only',
  other: 'Add records in your DNS provider',
};

export function AddDomainWizard({ open, onOpenChange, onDomainAdded }: AddDomainWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [domain, setDomain] = useState('');
  const [provider, setProvider] = useState<Provider>('other');
  const [currentDomain, setCurrentDomain] = useState<BrevoD | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const [domainError, setDomainError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  // Validation
  const validateDomain = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setDomainError('Domain is required');
      return false;
    }
    if (trimmed.includes('http://') || trimmed.includes('https://')) {
      setDomainError('Please remove http:// or https://');
      return false;
    }
    if (trimmed.includes('/')) {
      setDomainError('Please remove the path (e.g., /example)');
      return false;
    }
    if (!trimmed.includes('.')) {
      setDomainError('Domain must contain a dot (e.g., example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  // Step 1: Add domain
  const handleAddDomain = async () => {
    if (!validateDomain(domain)) return;

    try {
      setLoading(true);
      const created = await BrevoService.createDomain(domain);
      setCurrentDomain(created);
      setStep(2);
    } catch (error: any) {
      setDomainError(error.response?.data?.message || 'Failed to create domain. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify (triggers check)
  const handleVerifyDomain = async () => {
    if (!currentDomain) return;

    try {
      setVerifying(true);
      const domainId = currentDomain._id || currentDomain.id;
      if (!domainId) {
        throw new Error('Domain ID not found');
      }
      const updated = await BrevoService.verifyDomain(domainId);
      setCurrentDomain(updated);
      setStep(3);
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.response?.data?.message || 'Could not verify domain.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Copy DNS record value
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
      toast({
        title: 'Copied',
        description: 'Record value copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Copy all records as formatted text
  const copyAllRecords = async () => {
    if (!currentDomain) return;

    const text = currentDomain.dnsRecords
      .map(r => `${r.type}\t${r.host}\t${r.value}${r.ttl ? `\t${r.ttl}` : ''}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'All records copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy records.',
        variant: 'destructive',
      });
    }
  };

  // Finish wizard
  const handleFinish = () => {
    if (currentDomain) {
      setShowSuccess(true);
      setTimeout(() => {
        onDomainAdded(currentDomain);
        resetWizard();
      }, 2000);
    }
  };

  // Reset
  const resetWizard = () => {
    setStep(1);
    setDomain('');
    setProvider('other');
    setCurrentDomain(null);
    setDomainError('');
    setShowSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetWizard();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-5xl p-0 bg-background">
        {/* Header with Step Indicator */}
        <div className="px-6 py-4 border-b border-border">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {step === 1 && <span className="text-xl font-bold text-primary">1</span>}
              {step === 2 && <span className="text-xl font-bold text-primary">2</span>}
              {step === 3 && <span className="text-xl font-bold text-primary">3</span>}
              <DialogTitle>
                {step === 1 && 'Add Your Domain'}
                {step === 2 && 'Add DNS Records'}
                {step === 3 && 'Verify Domain'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {step === 1 && 'Use the domain after @ in your sender email'}
              {step === 2 && 'Add these records to your DNS provider'}
              {step === 3 && 'Check the status of your DNS records'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Add Domain */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-base font-semibold">Enter Your Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setDomainError('');
                  }}
                  disabled={loading}
                  className={`h-12 text-base ${domainError ? 'border-destructive' : ''}`}
                />
                {domainError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {domainError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: DNS Records */}
          {step === 2 && currentDomain && (
            <div className="space-y-4">
              {/* Provider Select */}
              <div className="space-y-2">
                <Label htmlFor="provider">DNS Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="godaddy">GoDaddy</SelectItem>
                    <SelectItem value="namecheap">Namecheap</SelectItem>
                    <SelectItem value="hostinger">Hostinger</SelectItem>
                    <SelectItem value="aws">AWS Route 53</SelectItem>
                    <SelectItem value="digitalocean">DigitalOcean</SelectItem>
                    <SelectItem value="other">Other Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Tip */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-3">
                  <p className="text-xs text-blue-900 font-medium">{PROVIDER_TIPS[provider]}</p>
                </CardContent>
              </Card>

              {/* Provider-Specific Guide */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">DNS Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {provider === 'cloudflare' && (
                      <>
                        <AccordionItem value="cloudflare-steps">
                          <AccordionTrigger>How to add records in Cloudflare</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to Cloudflare dashboard</li>
                              <li>Go to <strong>DNS Management</strong> for your domain</li>
                              <li>Click <strong>"Add record"</strong></li>
                              <li>For each DNS record below:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select the record type (TXT or CNAME)</li>
                                  <li><strong>Name:</strong> Enter the host/subdomain</li>
                                  <li><strong>Content:</strong> Paste the value</li>
                                  <li><strong>TTL:</strong> Keep as automatic</li>
                                  <li><strong>Proxy:</strong> For CNAME records, set to <strong>DNS only</strong> (gray cloud icon)</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Save"</strong></li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'godaddy' && (
                      <>
                        <AccordionItem value="godaddy-steps">
                          <AccordionTrigger>How to add records in GoDaddy</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to GoDaddy account</li>
                              <li>Go to <strong>My Products</strong> → <strong>Domains</strong></li>
                              <li>Click <strong>"Manage DNS"</strong> for your domain</li>
                              <li>Click <strong>"Add record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select TXT or CNAME</li>
                                  <li><strong>Name:</strong> Enter the host (@ for root domain)</li>
                                  <li><strong>Value:</strong> Paste the value</li>
                                  <li><strong>TTL:</strong> Default is fine</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Save"</strong></li>
                              <li>Wait for DNS propagation (usually 30 minutes - 48 hours)</li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'namecheap' && (
                      <>
                        <AccordionItem value="namecheap-steps">
                          <AccordionTrigger>How to add records in Namecheap</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to Namecheap account</li>
                              <li>Go to <strong>"Domain List"</strong></li>
                              <li>Click <strong>"Manage"</strong> next to your domain</li>
                              <li>Go to <strong>"Advanced DNS"</strong> tab</li>
                              <li>Click <strong>"Add New Record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select TXT or CNAME</li>
                                  <li><strong>Host:</strong> Enter just the subdomain part (e.g., @, brevo1._domainkey)</li>
                                  <li><strong>Value:</strong> Paste the complete value</li>
                                  <li><strong>TTL:</strong> 3600 (1 hour)</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Save"</strong></li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'hostinger' && (
                      <>
                        <AccordionItem value="hostinger-steps">
                          <AccordionTrigger>How to add records in Hostinger</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to Hostinger control panel</li>
                              <li>Go to <strong>Hosting</strong> → <strong>Domains</strong></li>
                              <li>Find your domain and click <strong>"Manage"</strong></li>
                              <li>Click on <strong>"DNS"</strong> or <strong>"DNS Records"</strong></li>
                              <li>Click <strong>"Add DNS Record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select TXT or CNAME</li>
                                  <li><strong>Name:</strong> Enter just the subdomain (e.g., @, brevo1._domainkey)</li>
                                  <li><strong>Value:</strong> Paste the complete value</li>
                                  <li><strong>TTL:</strong> 3600</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Save"</strong></li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'aws' && (
                      <>
                        <AccordionItem value="aws-steps">
                          <AccordionTrigger>How to add records in AWS Route 53</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to AWS Management Console</li>
                              <li>Go to <strong>Route 53</strong> → <strong>Hosted zones</strong></li>
                              <li>Click on your domain's hosted zone</li>
                              <li>Click <strong>"Create record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Record name:</strong> Enter subdomain (leave blank for @, or enter like brevo1._domainkey)</li>
                                  <li><strong>Record type:</strong> Select TXT or CNAME</li>
                                  <li><strong>Value:</strong> Paste the value</li>
                                  <li><strong>TTL:</strong> 300 or 3600</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Create records"</strong></li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'digitalocean' && (
                      <>
                        <AccordionItem value="digitalocean-steps">
                          <AccordionTrigger>How to add records in DigitalOcean</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to DigitalOcean control panel</li>
                              <li>Go to <strong>Networking</strong> → <strong>Domains</strong></li>
                              <li>Click on your domain</li>
                              <li>Click <strong>"Add record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select TXT or CNAME</li>
                                  <li><strong>Name:</strong> Enter just the subdomain (e.g., @, brevo1._domainkey - NOT the full domain)</li>
                                  <li><strong>Data (for TXT) / Hostname (for CNAME):</strong> Paste the value</li>
                                  <li><strong>TTL:</strong> 3600</li>
                                </ul>
                              </li>
                              <li>Click <strong>"Create"</strong></li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    {provider === 'other' && (
                      <>
                        <AccordionItem value="generic-steps">
                          <AccordionTrigger>Generic DNS instructions</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to your DNS provider's control panel</li>
                              <li>Find the "<strong>DNS Records</strong>", "<strong>DNS Management</strong>", or "<strong>Zone File</strong>" section</li>
                              <li>Look for an "<strong>Add Record</strong>" or "<strong>Add DNS Entry</strong>" option</li>
                              <li>For each record below, create a new entry:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select the record type (TXT or CNAME)</li>
                                  <li><strong>Name/Host:</strong> Enter the subdomain or @ for root</li>
                                  <li><strong>Value/Target/Data:</strong> Paste the value</li>
                                  <li><strong>TTL:</strong> Set to 3600 if available</li>
                                </ul>
                              </li>
                              <li>Save each record</li>
                              <li>DNS propagation typically takes 15 minutes to 48 hours</li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}

                    <AccordionItem value="record-types">
                      <AccordionTrigger>Understanding Record Types</AccordionTrigger>
                      <AccordionContent className="space-y-3 text-sm">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-amber-700">TXT Records</p>
                            <p className="text-muted-foreground">Text records for DMARC and Brevo verification. Paste the entire value exactly as shown.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">CNAME Records</p>
                            <p className="text-muted-foreground">Alias records for DKIM. These point subdomains to Brevo's servers. Must be set as "DNS only" on Cloudflare.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Success Message */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-3 flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Domain created: <strong>{currentDomain.domain}</strong></p>
                  </div>
                </CardContent>
              </Card>

              {/* DNS Records Cards - Organized by Purpose */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">DNS Records ({currentDomain.dnsRecords.length})</h3>
                </div>

                {currentDomain.dnsRecords.map((record, idx) => {
                  const purposeLabel = {
                    BREVO_CODE: 'Verification Code',
                    DKIM: 'DKIM Authentication',
                    DMARC: 'DMARC Policy'
                  }[record.purpose] || record.purpose;

                  return (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                              {idx + 1}
                            </span>
                            {purposeLabel}
                          </CardTitle>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {record.type}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {/* Host/Name */}
                        <div className="bg-muted/50 rounded p-3">
                          <label className="text-xs font-semibold text-muted-foreground">Host / Name</label>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-xs break-all">
                              {record.host}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(record.host, `host-${idx}`)}
                            >
                              {copied === `host-${idx}` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="bg-muted/50 rounded p-3">
                          <label className="text-xs font-semibold text-muted-foreground">Value</label>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-xs break-all">
                              {record.value}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(record.value, `value-${idx}`)}
                            >
                              {copied === `value-${idx}` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* TTL & Type */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-muted-foreground">TTL:</span> {record.ttl}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">Type:</span> {record.type}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Warning */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-3 flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    <strong>DNS Propagation:</strong> Changes take 15 minutes to 48 hours to propagate globally.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === 3 && currentDomain && (
            <div className="space-y-4">
              {/* Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">Current Status</CardTitle>
                  <DomainStatusBadge status={currentDomain.status} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {currentDomain.status === 'DNS_PENDING' && 'Add the DNS records above and verify once they propagate (usually 15 minutes to 48 hours).'}
                    {currentDomain.status === 'VERIFIED' && '✓ All DNS records verified and working!'}
                    {currentDomain.status === 'FAILED' && 'Some records failed - check details below.'}
                    {currentDomain.status === 'NOT_STARTED' && 'Ready to verify domain.'}
                  </p>
                </CardContent>
              </Card>

              {/* Verification Checks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">DNS Records Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Brevo Code */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Brevo Code (TXT)</p>
                      <p className="text-xs text-muted-foreground mt-1">Domain verification</p>
                    </div>
                    <CheckBadge status={currentDomain.checks.brevo_code} label="Brevo Code" />
                  </div>

                  {/* DKIM */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">DKIM (CNAME)</p>
                      <p className="text-xs text-muted-foreground mt-1">Email authentication</p>
                    </div>
                    <CheckBadge status={currentDomain.checks.dkim} label="DKIM" />
                  </div>

                  {/* DMARC */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">DMARC (TXT)</p>
                      <p className="text-xs text-muted-foreground mt-1">Email policy</p>
                    </div>
                    <CheckBadge status={currentDomain.checks.dmarc} label="DMARC" />
                  </div>
                </CardContent>
              </Card>

              {/* Troubleshooting */}
              {currentDomain.status !== 'VERIFIED' && (
                <Accordion type="single" collapsible className="border rounded-lg">
                  <AccordionItem value="issues" className="border-0">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="text-sm">Troubleshooting</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 space-y-2 pt-2 pb-4 text-xs">
                      <div>
                        <p className="font-medium mb-1">DNS not propagating?</p>
                        <p className="text-muted-foreground">Wait 15-48 hours and try verifying again.</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Check your record format</p>
                        <p className="text-muted-foreground">Ensure no extra spaces or quotes in values. Copy directly from the records table.</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Host/Name format</p>
                        <p className="text-muted-foreground">Some providers auto-append your domain. Try with and without the full domain.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Success Message */}
              {currentDomain.status === 'VERIFIED' && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 flex gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">Domain Verified!</p>
                      <p className="text-sm text-green-800 mt-1">
                        <strong>{currentDomain.domain}</strong> is authenticated and ready to use.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Message */}
              {currentDomain.errorMessage && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4 flex gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{currentDomain.errorMessage}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) {
                resetWizard();
              } else {
                setStep((s) => (s - 1) as Step);
              }
            }}
            disabled={loading || verifying}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step === 1 && (
            <Button
              onClick={handleAddDomain}
              disabled={loading || !domain.trim()}
              className="gap-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleVerifyDomain}
              disabled={verifying || !currentDomain}
              className="gap-1"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  I added records → Verify
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={() => {
                if (currentDomain.status === 'VERIFIED') {
                  handleFinish();
                } else {
                  handleVerifyDomain();
                }
              }}
              disabled={verifying || !currentDomain}
              className="gap-1"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : currentDomain.status === 'VERIFIED' ? (
                'Finish'
              ) : (
                'Verify Again'
              )}
            </Button>
          )}
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="bg-white rounded-lg py-8 px-6 text-center shadow-2xl max-w-sm mx-4 animate-in fade-in scale-100">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-9 w-9 text-green-600" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Added!</h2>
              <p className="text-gray-600 text-sm mb-1">
                <strong>{currentDomain?.domain}</strong>
              </p>
              <p className="text-gray-500 text-xs">is now verified and ready to use</p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">Closing in a moment...</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
