import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { usePublicFaqs, usePublicFaqCategories } from "@/hooks/usePublicFaqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FAQs() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: faqs = [], isLoading } = usePublicFaqs(
    selectedCategory === "all" ? undefined : selectedCategory,
  );
  const { data: categories = [] } = usePublicFaqCategories();

  const groupedFaqs = faqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, typeof faqs>,
  );

  const orderedCategories = Object.keys(groupedFaqs).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg font-display">V</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">VAYPR</span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about VAYPR. Can't find what you're looking for? 
            Our support team is here to help.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {categories.length > 0 && (
            <div className="mb-8 max-w-sm">
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
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {!isLoading && faqs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No published FAQs found.
            </div>
          )}

          {!isLoading &&
            orderedCategories.map((category) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                  {category}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {groupedFaqs[category].map((faq) => (
                    <AccordionItem
                      key={faq._id}
                      value={faq._id}
                      className="border border-border rounded-lg px-6 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}

          {/* Still have questions */}
          <div className="mt-16 text-center p-8 bg-muted/30 rounded-2xl border border-border">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our friendly support team is here to help.
            </p>
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
