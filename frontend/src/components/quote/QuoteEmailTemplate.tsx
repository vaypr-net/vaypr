import { useState } from 'react';
import { Quote } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Mail, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateDMY } from '@/lib/document-date';

interface QuoteEmailTemplateProps {
  quote: Quote;
  shareableLink: string;
  onSendMail?: (subject: string, body: string) => void;
}

export function QuoteEmailTemplate({ quote, shareableLink, onSendMail }: QuoteEmailTemplateProps) {
  const { toast } = useToast();
  
  const defaultSubject = `Quote ${quote.quoteNumber} from ${quote.companyName || 'Our Company'}`;
  
  const defaultBody = `Dear ${quote.clientName},

Thank you for considering our services. Please find your quote details below.

Quote Number: ${quote.quoteNumber}
Total Amount: ${quote.currencySymbol}${quote.total.toFixed(2)}
Valid Until: ${formatDateDMY(quote.validUntil) || '-'}

To view the full quote details and respond, please click the link below:

${shareableLink}

From the link above, you can:
• View the complete quote with itemized details
• Accept the quote to proceed
• Decline if it doesn't meet your needs
• Request modifications with your specific requirements

We look forward to your response.

Best regards,
${quote.companyName || 'Our Company'}
${quote.companyPhone ? `Tel: ${quote.companyPhone}` : ''}
${quote.companyEmail ? `Email: ${quote.companyEmail}` : ''}`.trim();

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const handleCopyEmail = async () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullEmail);
      toast({ title: 'Copied!', description: 'Email content copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast({ title: 'Copied!', description: 'Shareable link copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleOpenEmailClient = () => {
    const mailtoLink = `mailto:${quote.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Client Email Template
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shareable Link */}
        <div className="space-y-2">
          <Label className="text-xs">Client Portal Link</Label>
          <div className="flex gap-2">
            <Input 
              value={shareableLink} 
              readOnly 
              className="text-xs font-mono bg-muted"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(shareableLink, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label className="text-xs">Subject</Label>
          <Input 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label className="text-xs">Email Body</Label>
          <Textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="text-sm font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyEmail} className="gap-2">
            <Copy className="h-3.5 w-3.5" />
            Copy Email
          </Button>
          {onSendMail && (
            <Button size="sm" onClick={() => onSendMail(subject, body)} className="gap-2">
              <Mail className="h-3.5 w-3.5" />
              Send Mail
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
