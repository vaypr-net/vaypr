import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  SocialLinksService, 
  CreateSocialLinkDto, 
  UpdateSocialLinkDto 
} from '@/api/services/social-links.service';
import { useToast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================

const SOCIAL_LINKS_QUERY_KEYS = {
  all: ['social-links'] as const,
  list: () => [...SOCIAL_LINKS_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...SOCIAL_LINKS_QUERY_KEYS.all, 'detail', id] as const,
};

// ==================== SOCIAL LINKS HOOKS ====================

/**
 * Fetch all social links (ordered)
 */
export function useGetSocialLinks() {
  return useQuery({
    queryKey: SOCIAL_LINKS_QUERY_KEYS.list(),
    queryFn: () => SocialLinksService.getAll(),
  });
}

/**
 * Fetch a single social link by ID
 */
export function useGetSocialLinkById(id: string) {
  return useQuery({
    queryKey: SOCIAL_LINKS_QUERY_KEYS.detail(id),
    queryFn: () => SocialLinksService.getById(id),
    enabled: !!id,
  });
}

/**
 * Create a new social link
 */
export function useCreateSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSocialLinkDto) => SocialLinksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.all });
      
      toast({
        title: 'Success',
        description: 'Social link created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create social link',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing social link
 */
export function useUpdateSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSocialLinkDto }) =>
      SocialLinksService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.detail(data._id) });
      
      toast({
        title: 'Success',
        description: 'Social link updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update social link',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a social link
 */
export function useDeleteSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => SocialLinksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.all });
      
      toast({
        title: 'Success',
        description: 'Social link deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete social link',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reorder social links (bulk operation)
 */
export function useReorderSocialLinks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (linkIds: string[]) => SocialLinksService.reorder(linkIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.all });
      
      toast({
        title: 'Success',
        description: 'Social links reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder social links',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle social link enabled status
 */
export function useToggleSocialLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => SocialLinksService.toggleEnabled(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_QUERY_KEYS.detail(data._id) });
      
      toast({
        title: 'Success',
        description: `Social link ${data.enabled ? 'enabled' : 'disabled'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle social link',
        variant: 'destructive',
      });
    },
  });
}
