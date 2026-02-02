import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    badge: "Starter",
    description: "Perfect for freelancers and small businesses just getting started with professional invoicing.",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    features: [
      "Up to 3 Invoices per month",
      "Up to 2 Quotes per month",
      "Up to 3 Receipts per month",
      "10 Clients",
      "1 Recurring Subscription",
      "Up to 5 Expense Tracking",
      "1 Custom Template",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Business",
    badge: "Business",
    description: "Ideal for growing businesses that need full access to invoicing, quotes, and expense tracking.",
    monthlyPrice: "KD15",
    yearlyPrice: "KD150",
    features: [
      "Unlimited Invoices",
      "Unlimited Quotes",
      "Unlimited Receipts",
      "Unlimited Clients",
      "Recurring Subscriptions",
      "Expense Tracking",
      "Custom Templates",
      "Priority Email Support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Enterprise",
    badge: "Enterprise",
    description: "For larger organizations needing custom solutions, dedicated support, and advanced features.",
    monthlyPrice: "Let's Talk!",
    yearlyPrice: "Let's Talk!",
    features: [
      "Everything in Business",
      "Graphic Designer For Templates",
      "Ai Integration System",
      "API Access",
      "Dedicated Account Manager",
      "Smart Financial Analytics",
      "Advanced Expense Tracking",
      "White-label Options",
    ],
    cta: "Book a Call",
    highlighted: false,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Choose your right plan!
          </h2>
          <p className="text-muted-foreground text-lg">
            Select from best plans, ensuring a perfect match. Need more or less?
            <br />
            Customize your subscription for a seamless fit!
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                !isYearly
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                isYearly
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly (save 15%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-2xl transition-all duration-300 hover-lift",
                plan.highlighted
                  ? "bg-card border-2 border-primary shadow-xl"
                  : "bg-card border border-border hover:border-primary/30"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Badge */}
              <div className="mb-6">
                <span
                  className={cn(
                    "inline-block px-4 py-1.5 rounded-lg text-sm font-semibold",
                    plan.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border border-border"
                  )}
                >
                  {plan.badge}
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-6 min-h-[60px]">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                {plan.monthlyPrice === "Free" || plan.monthlyPrice === "Let's Talk!" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.monthlyPrice}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={cn(
                  "w-full",
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90"
                    : plan.name === "Enterprise"
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-transparent border border-border hover:bg-muted"
                )}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
