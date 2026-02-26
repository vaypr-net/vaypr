import { useParams, Navigate } from "react-router-dom";
import { useSupportPageBySlug } from "@/hooks/useSupportPages";
import { Loader2 } from "lucide-react";

const defaultContent = {
  title: "Support",
  description: "Content will be available soon.",
  bodyHtml: "<p>Please check back soon.</p>"
};

const SupportPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useSupportPageBySlug(slug || "");
  const content = (page as any)?.content ?? defaultContent;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{page?.title || content?.title || defaultContent.title}</h1>

        {(page as any)?.description || content?.description ? (
          <p className="text-xl text-muted-foreground mb-8">{(page as any)?.description || content?.description}</p>
        ) : null}

        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: (page as any)?.content || content?.bodyHtml || defaultContent.bodyHtml }}
        />

        {page?.updatedAt && (
          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(page.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </article>
    </div>
  );
};

export default SupportPage;
