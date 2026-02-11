import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SuperadminSettingsService,
  UpsertSuperadminSettingsDto,
  ChangePasswordDto,
} from '@/api/services/superadmin-settings.service';
import { AuditLogService } from '@/api/services/audit-log.service';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_QUERY_KEY = ['superadmin-settings'] as const;
const AUDIT_LOGS_QUERY_KEY = ['superadmin-audit-logs'] as const;

export function useGetSuperadminSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => SuperadminSettingsService.getSettings(),
    retry: false,
  });
}

export function useUpsertSuperadminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpsertSuperadminSettingsDto) => {
      try {
        return await SuperadminSettingsService.updateSettings(data);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return SuperadminSettingsService.createSettings(data);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Profile settings updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update settings.',
        variant: 'destructive',
      });
    },
  });
}

export function useChangeSuperadminPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ChangePasswordDto) => SuperadminSettingsService.changePassword(data),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data?.message || 'Password changed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to change password.',
        variant: 'destructive',
      });
    },
  });
}

export function useGetAuditLogs(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, limit, offset],
    queryFn: () => AuditLogService.getAuditLogs(limit, offset),
  });
}
