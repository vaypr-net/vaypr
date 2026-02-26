import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { ArrowRight, FileText, FileCheck, Receipt, Users, CalendarCheck, TrendingUp, Palette, LucideIcon } from "lucide-react";
import { PricingDialog } from "./PricingDialog";
import { useLandingPage } from "@/hooks/useLandingPage";

const defaultFeatures = [
  { icon: FileText, label: "Invoices" },
  { icon: FileCheck, label: "Quotes" },
  { icon: Receipt, label: "Receipts" },
  { icon: Users, label: "Clients" },
  { icon: CalendarCheck, label: "Subscriptions" },
  { icon: TrendingUp, label: "Expense\nTracking" },
  { icon: Palette, label: "Custom\nTemplates" },
];

const heroFeatureIconMap: Record<string, LucideIcon> = {
  FileText,
  FileCheck,
  Receipt,
  Users,
  CalendarCheck,
  TrendingUp,
  Palette,
};

const resolveHeroIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return FileText;
  const namedIcon = (LucideIcons as Record<string, unknown>)[iconName];
  if (typeof namedIcon === "function") {
    return namedIcon as LucideIcon;
  }
  return heroFeatureIconMap[iconName] || FileText;
};

export function HeroSection() {
  const { data: landingPage } = useLandingPage();

  const hero = landingPage?.heroSection;

  const badge = hero?.badge ?? "Billing & Financial Software";
  const headline = hero?.headline ?? "Send invoices. Track expenses.\nGet paid faster.";
  const subheadline = hero?.subheadline ??
    "VAYPR keeps your invoicing, quotes, receipts, and clients organized,\nbuilt for your first job and ready when you scale.";
  const primaryText = hero?.primaryButtonText ?? "Start Free";
  const secondaryText = hero?.secondaryButtonText ?? "Sign In";
  const features =
    hero?.heroFeatures && hero.heroFeatures.length > 0
      ? [...hero.heroFeatures]
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((item) => ({
            icon: resolveHeroIcon(item.icon),
            label: item.label,
          }))
      : defaultFeatures;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/30" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <p className="text-primary font-medium italic text-lg mb-6 animate-fade-in-up">
            {badge}
          </p>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up text-foreground" style={{ animationDelay: "0.1s" }}>
            {headline.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {subheadline.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br className="hidden sm:block" />
              </span>
            ))}
          </p>

          {/* Feature Icons */}
          <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10 md:gap-12 mb-12 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2 min-w-[80px]">
                <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/70 stroke-[1.5]" />
                <span className="text-sm text-muted-foreground whitespace-pre-line text-center leading-tight">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <PricingDialog>
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-glow text-base px-8 h-12">
                {primaryText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </PricingDialog>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base px-8 h-12">
              <Link to="/login">{secondaryText}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
