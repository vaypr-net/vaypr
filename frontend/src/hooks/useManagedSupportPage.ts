import { useMemo } from "react";
import { useSupportPages } from "@/hooks/useSupportPages";

const normalize = (value?: string) => (value || "").trim().replace(/^\/+/, "").toLowerCase();

export function useManagedSupportPage(canonicalSlug: string) {
  const { data: pages = [] } = useSupportPages({ enabledOnly: true });

  return useMemo(() => {
    const slug = normalize(canonicalSlug);

    return pages.find((page) => {
      const pageSlug = normalize(page.slug);
      const pageType = normalize(String((page as any).type));
      return pageSlug === slug || pageType === slug;
    });
  }, [pages, canonicalSlug]);
}
