import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { usePublicFaqs, usePublicFaqCategories } from '@/hooks/usePublicFaqs';

export function FAQsSection() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: faqs = [], isLoading } = usePublicFaqs(
    selectedCategory === 'all' ? undefined : selectedCategory,
  );
  const { data: categories = [] } = usePublicFaqCategories();

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about VAYPR. Can't find what you're looking for?
            Feel free to reach out to our support team.
          </p>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="mb-12">
            <div className="max-w-4xl mx-auto overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex w-max mx-auto gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {category}
                </button>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* FAQs Content */}
        {!isLoading && faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No FAQs found. Please check back soon!
            </p>
          </div>
        ) : (
          !isLoading && (
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq) => (
                  <AccordionItem
                    key={faq._id}
                    value={faq._id}
                    className="border border-border rounded-lg px-6 data-[state=open]:bg-muted/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                      <span className="text-foreground">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )
        )}

        {/* CTA */}
        {!isLoading && faqs.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6">
              Still have questions? We're here to help!
            </p>
            <Button size="lg" className="gap-2" onClick={() => navigate('/contact')}>
              Contact Support
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
