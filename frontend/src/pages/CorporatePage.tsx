import { useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useCorporatePageBySlug } from "@/hooks/useCorporatePages";
import { Loader2 } from "lucide-react";

const CorporatePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useCorporatePageBySlug(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>
          
          {page.description && (
            <p className="text-xl text-muted-foreground mb-8">{page.description}</p>
          )}
          
          {/* Render page.content (if present) */}
          {page.content && (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}

          {/* Render structured sections as plain text with paragraph breaks */}
          {page.sections && page.sections.length > 0 && (
            <div className="space-y-8 mt-6">
              {page.sections.map((s: any, idx: number) => (
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
          
          {page.updatedAt && (
            <div className="mt-12 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default CorporatePage;
