import { useParams, Navigate } from "react-router-dom";
import { useCorporatePageBySlug } from "@/hooks/useCorporatePages";
import { Loader2 } from "lucide-react";

const defaultContent = {
  title: "Corporate",
  description: "Content will be available soon.",
  sections: [],
  bodyHtml: "<p>Please check back soon.</p>"
};

const CorporatePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useCorporatePageBySlug(slug || "");
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

        {/* Render page.content (if present) */}
        {(page as any)?.content && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: (page as any).content }}
          />
        )}

        {!(page as any)?.content && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content?.bodyHtml || defaultContent.bodyHtml }}
          />
        )}

        {/* Render structured sections as plain text with paragraph breaks */}
        {(page?.sections && page.sections.length > 0 ? page.sections : content?.sections || []).length > 0 && (
          <div className="space-y-8 mt-6">
            {(page?.sections && page.sections.length > 0 ? page.sections : content?.sections || []).map((s: any, idx: number) => (
              <section key={`${s.order ?? idx}-${s.title ?? idx}`}>
                {s.title && <h2 className="text-2xl font-semibold mb-4">{s.title}</h2>}
                {/* Render content as plain text, converting paragraphs separated by newlines */}
                <div className="space-y-4 text-foreground leading-relaxed">
                  {(s.content || "")
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((paragraph: string, pIdx: number) => (
                      <p key={pIdx} className="whitespace-pre-wrap">
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

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

export default CorporatePage;
