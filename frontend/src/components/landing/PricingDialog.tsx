import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    badge: "Free Forever",
    description: "Perfect for freelancers just getting started.",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    features: [
      "Up to 3 Invoices/month",
      "Up to 2 Quotes/month",
      "10 Clients",
      "1 Custom Template",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Business",
    badge: "Most Popular",
    description: "Full access for growing businesses.",
    monthlyPrice: "KD15",
    yearlyPrice: "KD150",
    features: [
      "Unlimited Invoices",
      "Unlimited Quotes & Receipts",
      "Unlimited Clients",
      "Priority Support",
    ],
    cta: "Get Business",
    highlighted: true,
  },
  {
    name: "Enterprise",
    badge: "Custom",
    description: "Advanced features & dedicated support.",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    features: [
      "Everything in Business",
      "API Access",
      "Dedicated Manager",
      "White-label Options",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

interface PricingDialogProps {
  children: React.ReactNode;
}

export function PricingDialog({ children }: PricingDialogProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        {/* Decorative elements */}
        <div className="absolute top-4 right-12 animate-pulse">
          <Sparkles className="w-5 h-5 text-primary/40" />
        </div>
        <div className="absolute bottom-4 left-4 animate-pulse" style={{ animationDelay: "1s" }}>
          <Sparkles className="w-4 h-4 text-accent/40" />
        </div>

        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="font-display text-2xl sm:text-3xl font-bold">
              Choose your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                perfect plan
              </span>
            </DialogTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Start free, upgrade when you're ready
            </p>
          </DialogHeader>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-muted rounded-full p-1">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
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
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  isYearly
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <span className="ml-1 text-xs text-emerald-500 font-semibold">-15%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]",
                  plan.highlighted
                    ? "bg-card border-2 border-primary shadow-lg shadow-primary/10"
                    : "bg-card/50 border border-border hover:border-primary/30"
                )}
              >
                {/* Badge */}
                <div className="mb-3">
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-lg text-xs font-semibold",
                      plan.highlighted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {plan.badge}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-3">
                  {plan.monthlyPrice === "Free" || plan.monthlyPrice === "Custom" ? (
                    <span className="text-3xl font-bold text-foreground">
                      {plan.monthlyPrice}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        /{isYearly ? "yr" : "mo"}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground text-xs mb-4">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    "w-full",
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90 shadow-glow"
                      : plan.name === "Enterprise"
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : ""
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => setOpen(false)}
                >
                  <Link to={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                    {plan.cta}
                    {plan.highlighted && <ArrowRight className="w-3 h-3 ml-1" />}
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            No credit card required • Cancel anytime • 24/7 support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
