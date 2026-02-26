import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailMessageComposerProps {
  recipientEmail: string;
  onEmailChange: (email: string) => void;
  customMessage: string;
  onMessageChange: (message: string) => void;
  customSubject: string;
  onSubjectChange: (subject: string) => void;
  documentType: 'invoice' | 'quote' | 'receipt';
  documentNumber: string;
  companyName: string;
  isComposing: boolean;
  onComposingChange: (isComposing: boolean) => void;
}

export function EmailMessageComposer({
  recipientEmail,
  onEmailChange,
  customMessage,
  onMessageChange,
  customSubject,
  onSubjectChange,
  documentType,
  documentNumber,
  companyName,
  isComposing,
  onComposingChange,
}: EmailMessageComposerProps) {
  const documentLabel = documentType.charAt(0).toUpperCase() + documentType.slice(1);

  const getDefaultSubject = () => {
    return `${documentLabel} ${documentNumber} from ${companyName}`;
  };

  return (
    <div className="space-y-4">
      {/* Email Input Section */}
      <div className="space-y-2">
        <Label htmlFor="clientEmail">Client Email</Label>
        <Input
          id="clientEmail"
          type="email"
          placeholder="client@example.com"
          value={recipientEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isComposing}
        />
      </div>

      {/* Add Message Button - Only show when email is entered */}
      {!isComposing && recipientEmail && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 justify-center"
          onClick={() => onComposingChange(true)}
        >
          <Mail className="h-4 w-4" />
          Add Message
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Message Composer Section - Expands when Add Message is clicked */}
      {isComposing && recipientEmail && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Compose Message</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onComposingChange(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="emailSubject" className="text-sm">
              Subject
            </Label>
            <Input
              id="emailSubject"
              placeholder={getDefaultSubject()}
              value={customSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm">
              Message *
            </Label>
            <Textarea
              id="customMessage"
              placeholder={`Write your message here...`}
              value={customMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={5}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {customMessage.length} characters
              </p>
              <p className="text-xs text-blue-600">
                📎 {documentLabel} {documentNumber} will be attached
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
