import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { useSupportPageBySlug } from "@/hooks/useSupportPages";

const defaultContent = {
  title: "Refund Policy",
  description: "We want you to be completely satisfied with VAYPR. Here's everything you need to know about our refund process.",
  lastUpdated: "January 15, 2026",
  guaranteeTitle: "30-Day Money-Back Guarantee",
  guaranteeDescription:
    "Try VAYPR risk-free. If you're not satisfied within the first 30 days, we'll refund your payment in full.",
  eligibleTitle: "Eligible for Refund",
  eligibleItems: [
    {
      title: "First-time subscribers within 30 days",
      description: "New customers who haven't used a refund before and request within 30 days of initial purchase."
    },
    {
      title: "Service unavailability",
      description: "Extended downtime or service issues that prevented you from using VAYPR for 48+ consecutive hours."
    },
    {
      title: "Accidental duplicate charges",
      description: "If you were charged twice for the same billing period, we'll refund the duplicate charge immediately."
    },
    {
      title: "Annual plan downgrades",
      description: "Prorated refund available when downgrading from an annual plan within 30 days."
    }
  ],
  notEligibleTitle: "Not Eligible for Refund",
  notEligibleItems: [
    {
      title: "Requests after 30 days",
      description: "Refund requests submitted more than 30 days after the initial purchase."
    },
    {
      title: "Violation of Terms of Service",
      description: "Accounts terminated due to abuse, fraud, or violation of our terms."
    },
    {
      title: "Previous refund recipients",
      description: "Customers who have already received a refund for a previous subscription."
    },
    {
      title: "Partial month usage",
      description: "We don't offer prorated refunds for partial months on monthly plans."
    }
  ],
  requestTitle: "How to Request a Refund",
  requestSteps: [
    {
      title: "Contact Support",
      description: "Email billing@vaypr.net with your account email and reason for refund."
    },
    {
      title: "Review Process",
      description: "Our team will review your request within 1-2 business days."
    },
    {
      title: "Receive Refund",
      description: "Approved refunds are processed within 5-10 business days to your original payment method."
    }
  ],
  contactTitle: "Questions About Refunds?",
  contactDescription: "Our billing team is happy to help with any questions about refunds or your subscription.",
  contactEmail: "billing@vaypr.net"
};

export default function RefundPolicy() {
  const { data: apiContent } = useSupportPageBySlug("refund");
  const content = (apiContent as any)?.content ?? defaultContent;

  return <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <RotateCcw className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {content?.title || defaultContent.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content?.description || defaultContent.description}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: {apiContent?.updatedAt
              ? new Date(apiContent.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : content?.lastUpdated || defaultContent.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* 30-Day Guarantee Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 mb-12 text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {content?.guaranteeTitle || defaultContent.guaranteeTitle}
            </h2>
            <p className="text-muted-foreground">
              {content?.guaranteeDescription || defaultContent.guaranteeDescription}
            </p>
          </div>

          {/* Eligible for Refund */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              {content?.eligibleTitle || defaultContent.eligibleTitle}
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              {(content?.eligibleItems || defaultContent.eligibleItems).map((item: { title: string; description: string }, index: number) => <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>)}
            </div>
          </div>

          {/* Not Eligible for Refund */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              {content?.notEligibleTitle || defaultContent.notEligibleTitle}
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              {(content?.notEligibleItems || defaultContent.notEligibleItems).map((item: { title: string; description: string }, index: number) => <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>)}
            </div>
          </div>

          {/* How to Request */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              {content?.requestTitle || defaultContent.requestTitle}
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {(content?.requestSteps || defaultContent.requestSteps).map((step: { title: string; description: string }, index: number) => <div key={index} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">{index + 1}</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>)}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-muted/30 border border-border rounded-2xl p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {content?.contactTitle || defaultContent.contactTitle}
            </h3>
            <p className="text-muted-foreground mb-6">
              {content?.contactDescription || defaultContent.contactDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${content?.contactEmail || defaultContent.contactEmail}`}>{content?.contactEmail || defaultContent.contactEmail}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
