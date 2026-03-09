import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { usePublicFaqs, usePublicFaqCategories } from '@/hooks/usePublicFaqs';

export default function FAQs() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: faqs = [], isLoading } = usePublicFaqs(
    selectedCategory === 'all' ? undefined : selectedCategory,
  );
  const { data: categories = [] } = usePublicFaqCategories();



  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about VAYPR. Can't find what you're looking for?{' '}
            <Link to="/contact" className="text-primary hover:underline">
              Reach out to our support team.
            </Link>
          </p>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="py-6 border-y border-border bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
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
        </section>
      )}

      {/* FAQs Content */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && faqs.length === 0 && (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">
                No FAQs found. Please check back soon!
              </p>
            </div>
          )}

          {/* FAQs */}
          {!isLoading && faqs.length > 0 && (
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
          )}
        </div>
      </section>

      {/* CTA */}
      {!isLoading && faqs.length > 0 && (
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Our support team is happy to help you with anything you need.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">
                Contact Support
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
