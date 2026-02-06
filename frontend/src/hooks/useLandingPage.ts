import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import landingPageService, {
  LandingPage,
  UpdateLandingPageDto,
  UpdateSectionDto,
  SectionName,
} from '@/api/services/landing-page.service';

// Query Keys
export const landingPageKeys = {
  all: ['landingPage'] as const,
  settings: () => [...landingPageKeys.all, 'settings'] as const,
};

// ===== Queries =====

/**
 * Hook to get landing page settings
 */
export function useLandingPage() {
  return useQuery({
    queryKey: landingPageKeys.settings(),
    queryFn: () => landingPageService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== Mutations =====

/**
 * Hook to update all landing page settings
 */
export function useUpdateLandingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dto: UpdateLandingPageDto) =>
      landingPageService.updateSettings(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingPageKeys.settings() });
      toast({
        title: 'Success',
        description: 'Landing page settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to update landing page settings',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a specific section
 */
export function useUpdateLandingSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      section,
      data,
    }: {
      section: SectionName;
      data: UpdateSectionDto;
    }) => landingPageService.updateSection(section, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingPageKeys.settings() });
      const sectionName = variables.section.replace('Section', '');
      toast({
        title: 'Success',
        description: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section updated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update section',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reset landing page to defaults
 */
export function useResetLandingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => landingPageService.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingPageKeys.settings() });
      toast({
        title: 'Success',
        description: 'Landing page reset to defaults successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to reset landing page to defaults',
        variant: 'destructive',
      });
    },
  });
}
