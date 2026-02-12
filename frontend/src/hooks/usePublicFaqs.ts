import { useQuery } from '@tanstack/react-query';
import { publicFaqsService } from '../api/services/public-faqs.service';

const PUBLIC_FAQS_QUERY_KEY = ['public-faqs'];
const PUBLIC_FAQ_CATEGORIES_QUERY_KEY = ['public-faq-categories'];

export const usePublicFaqs = (category?: string) => {
  return useQuery({
    queryKey: [...PUBLIC_FAQS_QUERY_KEY, category],
    queryFn: () => publicFaqsService.getPublished(category),
    staleTime: 1000 * 60 * 10, // 10 minutes - static content
  });
};

export const usePublicFaqCategories = () => {
  return useQuery({
    queryKey: PUBLIC_FAQ_CATEGORIES_QUERY_KEY,
    queryFn: () => publicFaqsService.getPublicCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes - static content
  });
};
