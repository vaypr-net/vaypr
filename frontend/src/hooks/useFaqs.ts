import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { faqsService, CreateFaqDto, UpdateFaqDto, ReorderFaqDto } from '../api/services/faqs.service';
import { useToast } from './use-toast';

const FAQS_QUERY_KEY = ['faqs'];
const FAQ_CATEGORIES_QUERY_KEY = ['faq-categories'];

export const useFaqs = (params?: { category?: string; publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: [...FAQS_QUERY_KEY, params],
    queryFn: () => faqsService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFaq = (id: string) => {
  return useQuery({
    queryKey: [...FAQS_QUERY_KEY, id],
    queryFn: () => faqsService.getOne(id),
    enabled: !!id,
  });
};

export const useFaqCategories = () => {
  return useQuery({
    queryKey: FAQ_CATEGORIES_QUERY_KEY,
    queryFn: () => faqsService.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateFaqDto) => faqsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_CATEGORIES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'FAQ created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create FAQ',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFaqDto }) =>
      faqsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_CATEGORIES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update FAQ',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => faqsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAQ_CATEGORIES_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete FAQ',
        variant: 'destructive',
      });
    },
  });
};

export const useReorderFaqs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ReorderFaqDto[]) => faqsService.reorder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'FAQs reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder FAQs',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleFaqPublished = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => faqsService.togglePublished(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'FAQ status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update FAQ status',
        variant: 'destructive',
      });
    },
  });
};
