import { RichTextContent } from "@/components/landing/RichTextContent";

interface ManagedSection {
  title: string;
  content: string;
  order: number;
}

interface ManagedPageSectionsProps {
  sections?: ManagedSection[];
  title?: string;
}

export function ManagedPageSections({ sections, title = "Additional Information" }: ManagedPageSectionsProps) {
  const usableSections = (sections ?? [])
    .filter((section) => Boolean(section?.title?.trim()) || Boolean(section?.content?.trim()))
    .sort((a, b) => a.order - b.order);

  if (usableSections.length === 0) return null;

  return (
    <section className="py-16 border-t border-border/60 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground mb-8">{title}</h2>
        <div className="space-y-8">
          {usableSections.map((section, idx) => (
            <article key={`${section.order}-${idx}`} className="bg-card border border-border rounded-xl p-6">
              {section.title?.trim() && (
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {section.title}
                </h3>
              )}
              {section.content?.trim() && (
                <div className="text-muted-foreground">
                  <RichTextContent text={section.content} />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
