import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailSettingsService, EmailSettings, UpdateEmailSettingsPayload, UserSender } from '@/api/services/email-settings.service';

export const useEmailSettings = () => {
  const queryClient = useQueryClient();

  // Fetch email settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: () => emailSettingsService.getSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch senders list
  const {
    data: senders = [],
    isLoading: sendersLoading,
    error: sendersError,
  } = useQuery({
    queryKey: ['senders'],
    queryFn: () => emailSettingsService.getSenders(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update email settings mutation
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateEmailSettingsPayload) =>
      emailSettingsService.updateSettings(payload),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['emailSettings'], updatedSettings);
    },
  });

  return {
    settings,
    settingsLoading,
    settingsError,
    refetchSettings,
    senders,
    sendersLoading,
    sendersError,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};
