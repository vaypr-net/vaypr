import { useState } from 'react';
import { AlertCircle, Copy, Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axios';

interface DomainWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDomainAdded: () => void;
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

export function DomainWizard({ open, onOpenChange, onDomainAdded }: DomainWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [domain, setDomain] = useState('');
  const [provider, setProvider] = useState<Provider>('other');
  const [currentDomain, setCurrentDomain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const [domainError, setDomainError] = useState('');
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
      const res = await axiosInstance.post('/brevo/domains', { domain });
      setCurrentDomain(res.data);
      setStep(2);
    } catch (error: any) {
      setDomainError(error.response?.data?.message || 'Failed to create domain. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify
  const handleVerifyDomain = async () => {
    if (!currentDomain?._id) return;

    try {
      setVerifying(true);
      const res = await axiosInstance.post(`/brevo/domains/${currentDomain._id}/verify`);
      setCurrentDomain(res.data);
      setStep(3);
      toast({
        title: 'Domain Verified!',
        description: 'Your domain is now ready to use.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.response?.data?.message || 'DNS records not yet propagated. Try again in a few moments.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Copy to clipboard
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

  // Reset wizard
  const handleClose = () => {
    setStep(1);
    setDomain('');
    setProvider('other');
    setCurrentDomain(null);
    setDomainError('');
    onOpenChange(false);
  };

  // Complete setup
  const handleComplete = () => {
    handleClose();
    onDomainAdded();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-primary">{step}</span>
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

          {/* Progress Bar */}
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
        <div className="space-y-4">
          {/* Step 1: Enter Domain */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain" className="text-base font-semibold">Enter Your Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    if (domainError) setDomainError('');
                  }}
                  disabled={loading}
                  className="h-10 mt-2"
                />
                {domainError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {domainError}
                  </p>
                )}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-3">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Pro tip:</strong> Make sure you have access to your domain's DNS settings
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleClose()}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={!domain || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Setup DNS Records */}
          {step === 2 && currentDomain && (
            <div className="space-y-4">
              {/* Provider Select */}
              <div>
                <Label htmlFor="provider">DNS Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                  <SelectTrigger id="provider" className="mt-2">
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
                <p className="text-sm text-muted-foreground mt-2">
                  {PROVIDER_TIPS[provider]}
                </p>
              </div>

              {/* Domain Created Success */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-3 flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">
                      Domain created: <strong>{currentDomain.domain_name}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* DNS Records Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">DNS Records ({currentDomain.dnsRecords?.length || 0})</h3>
                </div>

                {currentDomain.dnsRecords?.map((record: any, idx: number) => {
                  const purposeLabel: Record<string, string> = {
                    'BREVO_CODE': 'Verification Code',
                    'DKIM': 'DKIM Authentication',
                    'DMARC': 'DMARC Policy'
                  };

                  return (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                              {idx + 1}
                            </span>
                            {record.purpose ? purposeLabel[record.purpose] || record.purpose : 'DNS Record'}
                          </CardTitle>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {record.type}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
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

                        {/* Type Info */}
                        <div className="text-xs text-muted-foreground pt-1">
                          <span className="font-semibold">Type:</span> {record.type}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* DNS Propagation Warning */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-3 flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    <strong>DNS Propagation:</strong> Changes take 15-30 minutes to propagate globally. Come back after adding records.
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleVerifyDomain} disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify DNS
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && currentDomain && (
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200 text-center p-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 mb-1">Domain Verified!</h3>
                <p className="text-sm text-green-700">
                  {currentDomain.domain_name} is now ready to use for sending emails.
                </p>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Domain Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-medium">{currentDomain.domain_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added:</span>
                    <span>{new Date(currentDomain.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-3">
                  <p className="text-sm text-blue-700">
                    <strong>Next steps:</strong> You can now use this domain for sending invoices, quotes, and other documents via email.
                  </p>
                </CardContent>
              </Card>

              <Button onClick={handleComplete} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
