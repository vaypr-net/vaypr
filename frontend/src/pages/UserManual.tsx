import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const manualSections = [
  {
    icon: Settings,
    title: "Getting Started",
    steps: [
      "Create your account and complete your business profile.",
      "Add your logo, business details, tax settings, and preferred currency.",
      "Invite your team or continue as a single account owner.",
    ],
  },
  {
    icon: FileText,
    title: "Invoices, Quotes, and Receipts",
    steps: [
      "Create invoices from the dashboard and add line items, tax, discounts, and notes.",
      "Send quotes to customers and convert approved quotes into invoices.",
      "Generate receipts after payment so your records stay organized.",
    ],
  },
  {
    icon: Users,
    title: "Client Management",
    steps: [
      "Save client contact details once and reuse them across documents.",
      "Review each client history to track quotes, invoices, receipts, and payments.",
      "Keep records accurate before sending documents by email.",
    ],
  },
  {
    icon: Mail,
    title: "Email and Delivery",
    steps: [
      "Send documents directly from VAYPR using the connected email service.",
      "Use clear subject lines and notes so clients understand what action is needed.",
      "Check delivery and follow up when a client has not responded.",
    ],
  },
  {
    icon: CreditCard,
    title: "Billing and Payments",
    steps: [
      "Choose the plan that matches your monthly document volume.",
      "Keep payment details updated to avoid service interruption.",
      "Review subscription and transaction history from your account area.",
    ],
  },
  {
    icon: LifeBuoy,
    title: "Support and Troubleshooting",
    steps: [
      "Confirm your business profile and client email before reporting delivery issues.",
      "Refresh the dashboard if a recent document does not appear immediately.",
      "Contact support with the document number and a short description of the issue.",
    ],
  },
];

export default function UserManual() {
  return (
    <div>
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            User Manual
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A practical guide to setting up VAYPR, managing clients, creating business
            documents, sending emails, and keeping your billing workflow running smoothly.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
              Quick Reference
            </p>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Learn the core workflow
            </h2>
            <p className="text-muted-foreground">
              Use these sections as a checklist when setting up a new account or helping
              a team member understand the platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {manualSections.map(({ icon: Icon, title, steps }) => (
              <article key={title} className="border border-border rounded-lg p-6 bg-card">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                  {title}
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Need help with a specific setup?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Start with the guide, then contact support if you need help with your
              account, document delivery, billing, or integrations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
