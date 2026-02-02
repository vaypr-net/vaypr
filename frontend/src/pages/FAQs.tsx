import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, MessageCircle } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is VAYPR?",
        a: "VAYPR is a modern financial management platform designed to help businesses streamline their invoicing, quoting, and expense tracking. We provide tools to create professional documents, manage clients, and track payments all in one place."
      },
      {
        q: "How do I create my first invoice?",
        a: "After signing up, navigate to the Generator page from your dashboard. Select 'Invoice' as your document type, fill in your business details, add line items, and you're ready to send! You can also save templates for future use."
      },
      {
        q: "Is there a free trial?",
        a: "Yes! We offer a generous free tier that includes basic invoicing features. You can upgrade anytime to access premium features like recurring billing, advanced analytics, and priority support."
      }
    ]
  },
  {
    category: "Billing & Payments",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers. Enterprise customers can also pay via invoice."
      },
      {
        q: "Can I change my plan at any time?",
        a: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle."
      },
      {
        q: "How does the recurring billing feature work?",
        a: "Our recurring billing feature allows you to set up automatic invoices that are sent at regular intervals (weekly, monthly, yearly). You can customize the start date, frequency, and even set an end date if needed."
      }
    ]
  },
  {
    category: "Features & Functionality",
    questions: [
      {
        q: "Can I customize my invoice templates?",
        a: "Yes! VAYPR offers extensive customization options. You can add your logo, choose color schemes, customize layouts, and save multiple templates for different purposes or clients."
      },
      {
        q: "Does VAYPR support multiple currencies?",
        a: "Yes, we support over 150 currencies. You can set a default currency for your account and change it on a per-invoice basis when working with international clients."
      },
      {
        q: "Can I track expenses and receipts?",
        a: "Absolutely! Our expense tracking feature lets you upload receipts, categorize expenses, and generate reports. This makes tax time much easier and helps you understand your business spending."
      }
    ]
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        q: "Is my data secure?",
        a: "Security is our top priority. We use bank-level 256-bit SSL encryption, regular security audits, and your data is stored in SOC 2 compliant data centers. We never share your data with third parties."
      },
      {
        q: "Can I export my data?",
        a: "Yes, you can export all your data at any time in various formats including CSV, PDF, and JSON. We believe your data belongs to you."
      },
      {
        q: "Do you offer two-factor authentication?",
        a: "Yes! We strongly recommend enabling 2FA for added security. You can use authenticator apps or SMS verification to protect your account."
      }
    ]
  }
];

export default function FAQs() {
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
          {faqs.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, faqIdx) => (
                  <AccordionItem 
                    key={faqIdx} 
                    value={`${idx}-${faqIdx}`}
                    className="border border-border rounded-lg px-6 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
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
