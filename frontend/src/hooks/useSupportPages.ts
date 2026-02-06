import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  supportPagesService,
  CreateSupportPageDto,
  UpdateSupportPageDto,
  PageType,
} from '../api/services/support-pages.service';
import { useToast } from './use-toast';

const SUPPORT_PAGES_QUERY_KEY = ['support-pages'];

export const useSupportPages = (params?: { enabledOnly?: boolean }) => {
  return useQuery({
    queryKey: [...SUPPORT_PAGES_QUERY_KEY, params],
    queryFn: () => supportPagesService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSupportPage = (id: string) => {
  return useQuery({
    queryKey: [...SUPPORT_PAGES_QUERY_KEY, id],
    queryFn: () => supportPagesService.getOne(id),
    enabled: !!id,
  });
};

export const useSupportPageBySlug = (slug: string) => {
  return useQuery({
    queryKey: [...SUPPORT_PAGES_QUERY_KEY, 'slug', slug],
    queryFn: () => supportPagesService.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useSupportPageByType = (type: PageType) => {
  return useQuery({
    queryKey: [...SUPPORT_PAGES_QUERY_KEY, 'type', type],
    queryFn: () => supportPagesService.getByType(type),
    enabled: !!type,
  });
};

export const useCreateSupportPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSupportPageDto) => supportPagesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Support page created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create support page',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSupportPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupportPageDto }) =>
      supportPagesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Support page updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update support page',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSupportPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => supportPagesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Support page deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete support page',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleSupportPageEnabled = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => supportPagesService.toggleEnabled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Page status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update page status',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleSupportPageFooter = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => supportPagesService.toggleFooterVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Footer visibility updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update footer visibility',
        variant: 'destructive',
      });
    },
  });
};

export const useInitializeSupportPages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => supportPagesService.initializeDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Default support pages initialized successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initialize support pages',
        variant: 'destructive',
      });
    },
  });
};
