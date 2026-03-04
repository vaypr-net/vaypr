import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmailSettings } from '@/hooks/api/useEmailSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SenderSelectorProps {
  value?: string;
  onChange?: (senderId: string | undefined) => void;
  selectedSenderId?: string; // Alternative prop name
  onSenderChange?: (senderId: string | undefined) => void; // Alternative prop name
  label?: string;
  required?: boolean;
  senders?: any[]; // Optional, will use internal fetch if not provided
  allowEmpty?: boolean;
}

export const SenderSelector = ({
  value,
  onChange,
  selectedSenderId,
  onSenderChange,
  label = 'Send From',
  required = false,
  senders: externalSenders,
  allowEmpty = true,
}: SenderSelectorProps) => {
  const DEFAULT_OPTION_VALUE = '__default_sender__';
  const { senders: fetchedSenders = [] } = useEmailSettings();
  
  // Support both naming conventions
  const currentValue = value || selectedSenderId;
  const handleChange = onChange || onSenderChange;
  const sendersList = Array.isArray(externalSenders) ? externalSenders : fetchedSenders;
  
  const activeSenders = sendersList
    .filter((s: any) => !s.priority || s.priority > 0)
    .filter((s: any) => {
      const senderId = s?._id || s?.id;
      return typeof senderId === 'string' && senderId.trim().length > 0;
    });

  if (!sendersList || sendersList.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            No sender emails configured. Go to Settings → Email to add sender emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (activeSenders.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            No verified sender emails available. Configure verified emails in Settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="sender-select">{label} {required && <span className="text-red-500">*</span>}</Label>
      <Select
        value={currentValue || (allowEmpty ? DEFAULT_OPTION_VALUE : '')}
        onValueChange={(val) =>
          handleChange?.(val === DEFAULT_OPTION_VALUE ? undefined : val || undefined)
        }
      >
        <SelectTrigger id="sender-select">
          <SelectValue placeholder="Select a sender..." />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && (
            <SelectItem value={DEFAULT_OPTION_VALUE}>Default (Login Email)</SelectItem>
          )}
          {activeSenders.map((sender: any) => {
            const senderId = sender._id || sender.id;
            const email = sender.email || sender.address;
            const displayName = sender.displayName || sender.name || email;
            const isPrimary = sender.priority === 1 || sender.isPrimary;
            const isSecondary = sender.priority === 2 || sender.isSecondary;
            
            return (
              <SelectItem key={senderId} value={senderId}>
                {displayName} &lt;{email}&gt;
                {isPrimary && ' 🌟 Primary'}
                {isSecondary && ' ⭐ Secondary'}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 mt-1">
        {allowEmpty ? 'Default uses your login email sender flow.' : 'Select which email address to send from.'}
      </p>
    </div>
  );
};
