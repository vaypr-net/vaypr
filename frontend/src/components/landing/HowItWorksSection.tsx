import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLandingPage } from "@/hooks/useLandingPage";
import type { HowItWorksStep } from "@/api/services/landing-page.service";

const defaultSteps: HowItWorksStep[] = [
  {
    number: "01",
    title: "Sign up in seconds",
    description: "Create your free account and set up your business profile. No credit card required.",
    features: ["Free to start", "No setup fees", "Instant access"],
    order: 1,
  },
  {
    number: "02",
    title: "Add your clients",
    description: "Import existing clients or add them manually. Keep all contact info organized in one place.",
    features: ["Bulk import", "Smart organization", "Contact history"],
    order: 2,
  },
  {
    number: "03",
    title: "Create & send invoices",
    description: "Generate professional invoices, share via link or email, and get paid faster than ever.",
    features: ["Custom templates", "One-click sending", "Payment tracking"],
    order: 3,
  },
  {
    number: "04",
    title: "Track & grow",
    description: "Monitor your revenue, manage expenses, and use insights to grow your business.",
    features: ["Real-time analytics", "Expense tracking", "Growth insights"],
    order: 4,
  },
];

export function HowItWorksSection() {
  const { data: landingPage } = useLandingPage();

  const section = landingPage?.howItWorksSection;
  const badge = section?.badge || "How It Works";
  const headline = section?.headline || "Get started in four simple steps";
  const description = section?.description || "From sign-up to your first paid invoice in minutes, not hours.";
  const steps =
    section?.steps && section.steps.length > 0
      ? [...section.steps].sort((a, b) => a.order - b.order)
      : defaultSteps;

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            {badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            {headline}
          </h2>
          <p className="text-muted-foreground text-lg">
            {description}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative p-8 rounded-3xl bg-card border border-border group hover:border-primary/30 transition-all duration-300"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-display font-bold">{step.number}</span>
              </div>

              <div className="ml-4">
                <h3 className="font-display text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-3">
                  {step.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector Line (for larger screens) */}
              {index < steps.length - 1 && index % 2 === 0 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-glow text-base px-8 h-12">
            <Link to="/signup">
              Start Your Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
