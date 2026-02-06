import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  corporatePagesService,
  CreateCorporatePageDto,
  UpdateCorporatePageDto,
  CorporatePageType,
} from '../api/services/corporate-pages.service';
import { useToast } from './use-toast';

const CORPORATE_PAGES_QUERY_KEY = ['corporate-pages'];

export const useCorporatePages = (params?: { enabledOnly?: boolean }) => {
  return useQuery({
    queryKey: [...CORPORATE_PAGES_QUERY_KEY, params],
    queryFn: () => corporatePagesService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCorporatePage = (id: string) => {
  return useQuery({
    queryKey: [...CORPORATE_PAGES_QUERY_KEY, id],
    queryFn: () => corporatePagesService.getOne(id),
    enabled: !!id,
  });
};

export const useCorporatePageBySlug = (slug: string) => {
  return useQuery({
    queryKey: [...CORPORATE_PAGES_QUERY_KEY, 'slug', slug],
    queryFn: () => corporatePagesService.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useCorporatePageByType = (type: CorporatePageType) => {
  return useQuery({
    queryKey: [...CORPORATE_PAGES_QUERY_KEY, 'type', type],
    queryFn: () => corporatePagesService.getByType(type),
    enabled: !!type,
  });
};

export const useCreateCorporatePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCorporatePageDto) => corporatePagesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Corporate page created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create corporate page',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCorporatePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCorporatePageDto }) =>
      corporatePagesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Corporate page updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update corporate page',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCorporatePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => corporatePagesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Corporate page deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete corporate page',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleCorporatePageEnabled = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => corporatePagesService.toggleEnabled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
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

export const useToggleCorporatePageFooter = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => corporatePagesService.toggleFooterVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
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

export const useInitializeCorporatePages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => corporatePagesService.initializeDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CORPORATE_PAGES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Default corporate pages initialized successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initialize corporate pages',
        variant: 'destructive',
      });
    },
  });
};
