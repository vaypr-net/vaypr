import { useState } from 'react';
import { AlertCircle, Copy, Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  const getDomainLabel = (d: any) => d?.domain || d?.domain_name || '';

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
      const updated = res.data;
      setCurrentDomain(updated);

      if ((updated?.status || '').toUpperCase() === 'VERIFIED') {
        setStep(3);
        toast({
          title: 'Domain Verified!',
          description: 'Your domain is now ready to use.',
        });
      } else {
        toast({
          title: 'Still pending DNS verification',
          description:
            'Records are not fully propagated yet. Keep records in DNS and verify again in a few minutes.',
        });
      }
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
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
                      Domain created: <strong>{getDomainLabel(currentDomain)}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Important: Where to add DNS records */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                    ⚠️ Critical: Where to add DNS records
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-purple-900 space-y-3">
                  {/* Main Rule */}
                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="font-semibold text-purple-900">
                      🎯 <strong>The Rule:</strong> Add Brevo authentication records at your <strong>authoritative DNS provider</strong> — where your domain's nameservers point to, NOT where your site is hosted.
                    </p>
                  </div>

                  {/* Check Nameservers Step */}
                  <div>
                    <p className="font-semibold mb-2 text-purple-900">📍 Step 1: Check Your Domain's Nameservers</p>
                    <ol className="list-decimal list-inside space-y-2 text-xs ml-2">
                      <li>
                        Go to <strong><a href="https://www.whois.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">whois.com</a></strong> or <strong><a href="https://www.nslookup.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">nslookup.io</a></strong>
                      </li>
                      <li>Enter your domain name (e.g., example.com)</li>
                      <li>Look for "Nameservers" section - these tell you where your DNS is managed</li>
                    </ol>
                  </div>

                  {/* Examples */}
                  <div>
                    <p className="font-semibold mb-2 text-purple-900">📌 Common Nameserver Examples:</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white rounded p-2 border-l-4 border-blue-400">
                        <p className="font-mono text-blue-700 break-all">ns1.domaincontrol.com, ns2.domaincontrol.com</p>
                        <p className="text-purple-800">👉 <strong>GoDaddy nameservers</strong> → Add records in <strong>GoDaddy Manage DNS</strong></p>
                      </div>
                      <div className="bg-white rounded p-2 border-l-4 border-orange-400">
                        <p className="font-mono text-orange-700 break-all">ns1.hostinger.com, ns2.hostinger.com</p>
                        <p className="text-purple-800">👉 <strong>Hostinger nameservers</strong> → Add records in <strong>Hostinger DNS Zone Editor</strong></p>
                      </div>
                      <div className="bg-white rounded p-2 border-l-4 border-purple-400">
                        <p className="font-mono text-purple-700 break-all">maya.ns.cloudflare.com, nathan.ns.cloudflare.com</p>
                        <p className="text-purple-800">👉 <strong>Cloudflare nameservers</strong> → Add records in <strong>Cloudflare DNS Manager</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-800">
                      ⛔ <strong>Warning:</strong> If you add DNS records in the wrong control panel, verification will <strong>FAIL</strong>. Always add records where your nameservers point to.
                    </p>
                  </div>

                  {/* Example Scenario */}
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-xs text-green-800 font-semibold mb-1">Example Scenario:</p>
                    <p className="text-xs text-green-800">
                      Domain registered at <strong>GoDaddy</strong> but nameservers changed to Cloudflare?<br/>
                      → Add Brevo records in <strong>Cloudflare</strong>, not GoDaddy
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* DNS Setup Instructions */}
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 DNS Hosting Service:</strong> Cloudflare is a CDN/DNS provider, not a domain registrar.</p>
                              <p className="mt-1"><strong>Setup required:</strong> Your domain must point to Cloudflare's nameservers:</p>
                              <ul className="list-none space-y-1 mt-2 ml-2">
                                <li>• If domain registered at GoDaddy/Namecheap: Change nameservers there to point to Cloudflare</li>
                                <li>• Then add DNS records here in Cloudflare</li>
                              </ul>
                            </div>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 Note:</strong> If your domain is registered elsewhere (Namecheap, Hostinger, etc.), you need to either:</p>
                              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                <li>Add records in <strong>GoDaddy DNS</strong> if you plan to use GoDaddy for DNS management</li>
                                <li><strong>OR</strong> change your domain's nameservers in the originating registrar to GoDaddy's nameservers</li>
                              </ul>
                            </div>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 Registrar DNS:</strong> Namecheap's Advanced DNS allows you to manage records directly.</p>
                              <p className="mt-1"><strong>If using external hosting/email service:</strong> Add records in Namecheap's Advanced DNS panel, or change nameservers to your hosting provider's nameservers.</p>
                            </div>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to Namecheap account</li>
                              <li>Go to <strong>"Domain List"</strong></li>
                              <li>Click <strong>"Manage"</strong> next to your domain</li>
                              <li>Go to <strong>"Advanced DNS"</strong> tab</li>
                              <li>Click <strong>"Add New Record"</strong></li>
                              <li>For each DNS record:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select the record type (TXT or CNAME)</li>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 Hosting DNS Management:</strong> Use Hostinger's DNS if your domain is hosted/email managed there.</p>
                              <p className="mt-1"><strong>If domain registered elsewhere (GoDaddy, Namecheap):</strong> You need to point the domain's nameservers to Hostinger's nameservers in your original registrar first.</p>
                            </div>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 AWS Hosted DNS:</strong> Route 53 manages DNS for domains hosted on AWS infrastructure.</p>
                              <p className="mt-1"><strong>If domain elsewhere:</strong> Point your domain's nameservers from registrar (GoDaddy, Namecheap) to Route 53's nameservers first.</p>
                            </div>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 Hosting DNS Service:</strong> DigitalOcean manages DNS for hosted apps and services.</p>
                              <p className="mt-1"><strong>Setup required:</strong> Your domain must use DigitalOcean's nameservers:</p>
                              <ul className="list-none space-y-1 mt-2 ml-2">
                                <li>• If registered elsewhere: Update nameservers in registrar (GoDaddy, Namecheap) to point to DigitalOcean</li>
                              </ul>
                            </div>
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
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                              <p><strong>📍 Finding your DNS provider:</strong></p>
                              <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
                                <li>Look for: <strong>"DNS Management," "DNS Records," "Zone File," or "Advanced DNS"</strong></li>
                                <li><strong>Check where your domain is registered or hosted:</strong></li>
                                <li>If you have hosting with them (shared hosting, VPS): Manage DNS there</li>
                                <li>If domain registered elsewhere but using this for hosting/email: Change nameservers in registrar to point here</li>
                              </ul>
                            </div>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Log in to your DNS provider's control panel</li>
                              <li>Find the "<strong>DNS Records</strong>", "<strong>DNS Management</strong>", or "<strong>Zone File</strong>" section</li>
                              <li>Look for an "<strong>Add Record</strong>" or "<strong>Add DNS Entry</strong>" option</li>
                              <li>For each record below, create a new entry:
                                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                  <li><strong>Type:</strong> Select the record type (TXT or CNAME)</li>
                                  <li><strong>Name/Host:</strong> Enter the subdomain or @ for root</li>
                                  <li><strong>Value/Target/Data:</strong> Paste the value exactly</li>
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
                            <p className="text-muted-foreground">Text records for DMARC and verification. Paste the entire value exactly as shown.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">CNAME Records</p>
                            <p className="text-muted-foreground">Alias records for DKIM. These point subdomains to Brevo servers. Must be set as "DNS only" on Cloudflare.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                    <strong>DNS Propagation:</strong> Changes take 15 minutes to 48 hours to propagate globally.
                  </p>
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
                        <p className="text-muted-foreground">Don't include your domain name. Use just the subdomain (e.g., @ or brevo1._domainkey).</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

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
                  {getDomainLabel(currentDomain)} is now ready to use for sending emails.
                </p>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Domain Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-medium">{getDomainLabel(currentDomain)}</span>
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
