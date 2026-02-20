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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePublicFaqs, usePublicFaqCategories } from '@/hooks/usePublicFaqs';

export function FAQsSection() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: faqs = [], isLoading } = usePublicFaqs(
    selectedCategory === 'all' ? undefined : selectedCategory,
  );
  const { data: categories = [] } = usePublicFaqCategories();

  // Group FAQs by category
  const groupedFaqs = faqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, typeof faqs>,
  );

  const orderedCategories = Object.keys(groupedFaqs).sort((a, b) => {
    // Show selected category first if not 'all'
    if (selectedCategory !== 'all') {
      if (a === selectedCategory) return -1;
      if (b === selectedCategory) return 1;
    }
    return a.localeCompare(b);
  });

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

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex justify-center mb-12">
            <div className="w-full max-w-sm">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="max-w-4xl mx-auto space-y-12">
              {orderedCategories.map((category) => (
                <div key={category}>
                  <h3 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
                    <span className="w-1 h-6 bg-primary rounded-full" />
                    {category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-3">
                    {groupedFaqs[category].map((faq, idx) => (
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
              ))}
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
