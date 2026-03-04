import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailSettingsService, type UserSender, type CreateSenderPayload } from '@/api/services/email-settings.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Crown, Star, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from '@/api/axios';

interface UserProfile {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  verifiedDomains?: string[];
  pendingDomains?: string[];
  brandingDomain?: string;
  authProvider?: string;
  email?: string;
  fullName?: string;
}

interface GmailStatusResponse {
  hasPermission?: boolean;
}

interface BrevoDomainResponse {
  _id?: string;
  id?: string;
  domain?: string;
  status?: string;
}

export const SendersManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSender, setNewSender] = useState({
    email: '',
    displayName: '',
    provider: '' as 'gmail' | 'brevo' | '',
  });
  const [senderToDelete, setSenderToDelete] = useState<UserSender | null>(null);
  const [availableProviders, setAvailableProviders] = useState<{ gmail: boolean; brevo: boolean }>({
    gmail: false,
    brevo: false,
  });
  const [isCheckingProviders, setIsCheckingProviders] = useState(true);
  const [providerCheckError, setProviderCheckError] = useState<string | null>(null);

  // Fetch senders
  const { data: senders = [], isLoading } = useQuery({
    queryKey: ['senders'],
    queryFn: () => emailSettingsService.getSenders(),
    staleTime: 5 * 60 * 1000,
  });

  const resolveAvailableProviders = async (existingSenders: UserSender[] = []) => {
    const [userResult, gmailResult, brevoDomainsResult] = await Promise.allSettled([
      axios.get('/user/me'),
      axios.get('/gmail/status'),
      axios.get('/brevo/domains'),
    ]);

    const user =
      userResult.status === 'fulfilled' ? (userResult.value.data as UserProfile) : undefined;
    const gmailStatus =
      gmailResult.status === 'fulfilled'
        ? (gmailResult.value.data as GmailStatusResponse)
        : undefined;
    const brevoDomains =
      brevoDomainsResult.status === 'fulfilled'
        ? ((brevoDomainsResult.value.data as BrevoDomainResponse[]) || [])
        : [];

    const hasGmail =
      !!gmailStatus?.hasPermission ||
      !!user?.googleAccessToken ||
      existingSenders.some((s) => s.provider === 'gmail');

    const hasBrevoVerifiedDomain =
      brevoDomains.some((d) => (d.status || '').toUpperCase() === 'VERIFIED') ||
      (user?.verifiedDomains?.length || 0) > 0;

    const hasBrevo = hasBrevoVerifiedDomain || existingSenders.some((s) => s.provider === 'brevo');

    return { hasGmail, hasBrevo };
  };

  // Fetch provider availability
  useEffect(() => {
    const checkProviders = async () => {
      try {
        setIsCheckingProviders(true);
        setProviderCheckError(null);
        const providers = await resolveAvailableProviders(senders);
        setAvailableProviders({ gmail: providers.hasGmail, brevo: providers.hasBrevo });
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error);
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to check providers';
        setProviderCheckError(errorMsg);
        
        // Don't disable form if check fails - let user try anyway
        // Backend will validate
        setAvailableProviders({
          gmail: true, // Assume available
          brevo: true, // Assume available
        });
      } finally {
        setIsCheckingProviders(false);
      }
    };

    checkProviders();
  }, [senders]);

  // Create sender mutation
  const createSenderMutation = useMutation({
    mutationFn: (payload: CreateSenderPayload) => emailSettingsService.createSender(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: 'Sender Added',
        description: 'New sender email has been added successfully.',
      });
      setNewSender({ email: '', displayName: '', provider: '' });
      setIsAddingNew(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to add sender',
        variant: 'destructive',
      });
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (senderId: string) => emailSettingsService.setPrimary(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: 'Primary Sender Set',
        description: 'This sender is now your primary email.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to set primary sender',
        variant: 'destructive',
      });
    },
  });

  // Set secondary mutation
  const setSecondaryMutation = useMutation({
    mutationFn: (senderId: string) => emailSettingsService.setSecondary(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: 'Secondary Sender Set',
        description: 'This sender is now your secondary email.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to set secondary sender',
        variant: 'destructive',
      });
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: (senderId: string) => emailSettingsService.deleteSender(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: 'Sender Removed',
        description: 'Sender email has been removed successfully.',
      });
      setSenderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to remove sender',
        variant: 'destructive',
      });
    },
  });

  const handleAddSender = () => {
    if (!newSender.email || !newSender.displayName || !newSender.provider) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields including provider selection',
        variant: 'destructive',
      });
      return;
    }

    createSenderMutation.mutate({
      email: newSender.email,
      displayName: newSender.displayName,
      provider: newSender.provider,
    });
  };

  const getPriorityBadge = (sender: UserSender) => {
    if (sender.priority === 1 || sender.isPrimary) {
      return <Badge className="bg-blue-100 text-blue-800">🌟 Primary</Badge>;
    }
    if (sender.priority === 2 || sender.isSecondary) {
      return <Badge className="bg-amber-100 text-amber-800">⭐ Secondary</Badge>;
    }
    return <Badge variant="outline">Extra</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const hasNoProviders = !availableProviders.gmail && !availableProviders.brevo;

  return (
    <div className="space-y-6">
      {/* No Providers Alert */}
      {hasNoProviders && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>No email provider connected.</strong> Please go to your settings and connect either Gmail or Brevo to add sender emails.
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Check Error Alert */}
      {providerCheckError && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 flex items-center justify-between">
            <span>Could not verify email providers. You can still try to add senders.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCheckingProviders(true);
                setTimeout(() => {
                  const checkProviders = async () => {
                    try {
                      const providers = await resolveAvailableProviders(senders);
                      setAvailableProviders({ gmail: providers.hasGmail, brevo: providers.hasBrevo });
                      setProviderCheckError(null);
                    } catch (error) {
                      console.error('Retry failed:', error);
                    } finally {
                      setIsCheckingProviders(false);
                    }
                  };
                  checkProviders();
                }, 100);
              }}
              disabled={isCheckingProviders}
            >
              {isCheckingProviders ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Sender Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Sender Email
          </CardTitle>
          <CardDescription>
            Add another email address to send documents from. You can have multiple senders from different providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender-email">Email Address *</Label>
              <Input
                id="sender-email"
                type="email"
                placeholder="hello@company.com"
                value={newSender.email}
                onChange={(e) => setNewSender({ ...newSender, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-name">Display Name *</Label>
              <Input
                id="sender-name"
                placeholder="Company Support"
                value={newSender.displayName}
                onChange={(e) => setNewSender({ ...newSender, displayName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-select">Email Provider *</Label>
            <Select
              value={newSender.provider}
              onValueChange={(value) => setNewSender({ ...newSender, provider: value as 'gmail' | 'brevo' })}
            >
              <SelectTrigger id="provider-select">
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.gmail && (
                  <SelectItem value="gmail">📧 Gmail (Your Google Account)</SelectItem>
                )}
                {availableProviders.brevo && (
                  <SelectItem value="brevo">✉️ Brevo (From Verified Domain)</SelectItem>
                )}
                {!availableProviders.gmail && (
                  <SelectItem value="gmail-disabled" disabled>
                    Gmail (Not Connected)
                  </SelectItem>
                )}
                {!availableProviders.brevo && (
                  <SelectItem value="brevo-disabled" disabled>
                    Brevo (No Verified Domains)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {newSender.provider === 'gmail' && 'Email will be sent from your Google account.'}
              {newSender.provider === 'brevo' && 'Email will be sent from your Brevo verified domain.'}
              {!newSender.provider && 'Choose which email service to send from.'}
            </p>
          </div>

          <Button
            onClick={handleAddSender}
            disabled={createSenderMutation.isPending}
            className="w-full md:w-auto gap-2"
          >
            {createSenderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Sender
          </Button>
        </CardContent>
      </Card>

      {/* Senders List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sender Emails</CardTitle>
          <CardDescription>
            Manage your configured sender addresses. You can set one as primary and one as secondary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {senders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sender emails configured yet. Add one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {senders.map((sender) => (
                <div
                  key={sender.id || sender._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{sender.displayName}</p>
                        <p className="text-sm text-gray-600">{sender.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {sender.provider === 'gmail' ? '📧 Gmail' : '✉️ Brevo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getPriorityBadge(sender)}
                      {sender.verified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">✓ Verified</Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {/* Set Primary Button */}
                    {sender.priority !== 1 && !sender.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrimaryMutation.mutate(sender.id || sender._id)}
                        disabled={setPrimaryMutation.isPending}
                        title="Set as Primary Sender"
                        className="gap-1"
                      >
                        {setPrimaryMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Crown className="h-3 w-3" />
                        )}
                        <span className="hidden sm:inline">Primary</span>
                      </Button>
                    )}

                    {/* Set Secondary Button */}
                    {sender.priority !== 2 && !sender.isSecondary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSecondaryMutation.mutate(sender.id || sender._id)}
                        disabled={setSecondaryMutation.isPending}
                        title="Set as Secondary Sender"
                        className="gap-1"
                      >
                        {setSecondaryMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                        <span className="hidden sm:inline">Secondary</span>
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setSenderToDelete(sender)}
                      disabled={deleteSenderMutation.isPending}
                      title="Remove this sender"
                    >
                      {deleteSenderMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!senderToDelete} onOpenChange={(open) => !open && setSenderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Sender?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{senderToDelete?.displayName}</strong> ({senderToDelete?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (senderToDelete) {
                  deleteSenderMutation.mutate(senderToDelete.id || senderToDelete._id);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
