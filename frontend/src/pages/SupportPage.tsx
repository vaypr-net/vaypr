import { useParams, Navigate } from "react-router-dom";
import { useSupportPageBySlug } from "@/hooks/useSupportPages";
import { Loader2 } from "lucide-react";

const SupportPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useSupportPageBySlug(slug || "");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>

        {page.description && (
          <p className="text-xl text-muted-foreground mb-8">{page.description}</p>
        )}

        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {page.updatedAt && (
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
