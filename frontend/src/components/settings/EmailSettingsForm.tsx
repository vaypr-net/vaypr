import { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useEmailSettings } from '@/hooks/api/useEmailSettings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const EmailSettingsForm = () => {
  const { toast } = useToast();
  const {
    settings,
    settingsLoading,
    settingsError,
    senders,
    sendersLoading,
    updateSettings,
    isUpdating,
  } = useEmailSettings();

  const [formData, setFormData] = useState({
    supportInboxEmail: '',
    supportInboxName: '',
    defaultSenderId: '',
    defaultReplyToEmail: '',
    defaultReplyToName: '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setFormData({
        supportInboxEmail: settings.supportInboxEmail || '',
        supportInboxName: settings.supportInboxName || '',
        defaultSenderId: settings.defaultSenderId || '',
        defaultReplyToEmail: settings.defaultReplyToEmail || '',
        defaultReplyToName: settings.defaultReplyToName || '',
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.supportInboxEmail) {
      toast({
        title: 'Validation Error',
        description: 'Support inbox email is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.supportInboxEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid support inbox email format',
        variant: 'destructive',
      });
      return;
    }

    if (formData.defaultReplyToEmail && !emailRegex.test(formData.defaultReplyToEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid default reply-to email format',
        variant: 'destructive',
      });
      return;
    }

    // Prepare payload
    const payload: any = {
      supportInboxEmail: formData.supportInboxEmail,
    };

    if (formData.supportInboxName) {
      payload.supportInboxName = formData.supportInboxName;
    }

    if (formData.defaultSenderId) {
      payload.defaultSenderId = formData.defaultSenderId;
    } else {
      payload.defaultSenderId = null; // Clear default sender
    }

    if (formData.defaultReplyToEmail) {
      payload.defaultReplyToEmail = formData.defaultReplyToEmail;
    } else {
      payload.defaultReplyToEmail = null;
    }

    if (formData.defaultReplyToName) {
      payload.defaultReplyToName = formData.defaultReplyToName;
    }

    updateSettings(payload, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Email settings updated successfully',
        });
        setHasChanges(false);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || error?.message || 'Failed to update settings';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      },
    });
  };

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2">Loading email settings...</span>
      </div>
    );
  }

  if (settingsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load email settings. Please try again.</AlertDescription>
      </Alert>
    );
  }

  const primarySender = senders.find((s) => s.isPrimary);
  const secondarySender = senders.find((s) => s.isSecondary);

  return (
    <div className="space-y-6">
      {/* Support Inbox Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Support Inbox
          </CardTitle>
          <CardDescription>
            Configure where contact form messages and support emails are delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-email">Support Inbox Email *</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="support@example.com"
              value={formData.supportInboxEmail}
              onChange={(e) => handleInputChange('supportInboxEmail', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Contact form messages will be sent to this email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-name">Display Name (Optional)</Label>
            <Input
              id="support-name"
              placeholder="e.g., Support Team"
              value={formData.supportInboxName}
              onChange={(e) => handleInputChange('supportInboxName', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Sender Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Email Sender</CardTitle>
          <CardDescription>
            Choose which sender to use by default when sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {senders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Senders Configured</AlertTitle>
              <AlertDescription>
                You need to add at least one sender in the Senders management to use this feature.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="default-sender">Default Sender</Label>
                <Select
                  value={formData.defaultSenderId}
                  onValueChange={(value) => handleInputChange('defaultSenderId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="default-sender">
                    <SelectValue placeholder="Select a sender (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Use Primary/Secondary</SelectItem>
                    {senders.map((sender) => (
                      <SelectItem key={sender.id} value={sender.id}>
                        {sender.displayName} &lt;{sender.email}&gt;
                        {sender.isPrimary && ' (Primary)'}
                        {sender.isSecondary && ' (Secondary)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  If not selected, emails will use your Primary sender, then Secondary sender
                </p>
              </div>

              {/* Show sender status info */}
              {(primarySender || secondarySender) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-blue-900">Sender Resolution Order:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>
                          Selected Sender (if you choose one above)
                        </li>
                        <li>
                          Primary Sender: {primarySender ? `${primarySender.displayName} <${primarySender.email}>` : 'Not set'}
                        </li>
                        <li>
                          Secondary Sender: {secondarySender ? `${secondarySender.displayName} <${secondarySender.email}>` : 'Not set'}
                        </li>
                        <li>Legacy Fallback (if no senders available)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Default Reply-To Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Reply-To Address</CardTitle>
          <CardDescription>
            Set a default reply-to address if your sender doesn't have one configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply-email">Reply-To Email (Optional)</Label>
            <Input
              id="reply-email"
              type="email"
              placeholder="reply@example.com"
              value={formData.defaultReplyToEmail}
              onChange={(e) => handleInputChange('defaultReplyToEmail', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-name">Reply-To Name (Optional)</Label>
            <Input
              id="reply-name"
              placeholder="e.g., Reply Team"
              value={formData.defaultReplyToName}
              onChange={(e) => handleInputChange('defaultReplyToName', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          className="gap-2"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Email Settings
            </>
          )}
        </Button>
        {hasChanges && !isUpdating && (
          <p className="text-sm text-amber-600 self-center">You have unsaved changes</p>
        )}
      </div>
    </div>
  );
};
