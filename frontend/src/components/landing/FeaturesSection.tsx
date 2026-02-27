import * as LucideIcons from "lucide-react";
import { 
  FileText, 
  Users, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CreditCard,
  BarChart3,
  Send,
  Shield,
  LucideIcon,
} from "lucide-react";
import { useLandingPage } from "@/hooks/useLandingPage";
import type { FeatureItem, StatItem } from "@/api/services/landing-page.service";

const defaultFeatures: FeatureItem[] = [
  {
    icon: "FileText",
    title: "Professional Invoices",
    description: "Create and send beautiful invoices in seconds. Customize templates and track payment status.",
    order: 1,
  },
  {
    icon: "Users",
    title: "Client Management",
    description: "Keep all your client information organized. View history, track interactions, and build relationships.",
    order: 2,
  },
  {
    icon: "Receipt",
    title: "Expense Tracking",
    description: "Capture receipts, categorize expenses, and stay on top of your business spending.",
    order: 3,
  },
  {
    icon: "TrendingUp",
    title: "Revenue Insights",
    description: "Visualize your income trends and make data-driven decisions for growth.",
    order: 4,
  },
  {
    icon: "Clock",
    title: "Recurring Billing",
    description: "Set up automatic recurring invoices for retainer clients and subscription services.",
    order: 5,
  },
  {
    icon: "Send",
    title: "Quote Management",
    description: "Create quotes, share with clients, and convert approved quotes to invoices instantly.",
    order: 6,
  },
];

const defaultStats: StatItem[] = [
  { icon: "BarChart3", value: "50%", label: "Faster invoicing" },
  { icon: "CreditCard", value: "2x", label: "Faster payments" },
  { icon: "Shield", value: "100%", label: "Secure & private" },
];

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Users,
  Receipt,
  TrendingUp,
  Clock,
  Send,
  BarChart3,
  CreditCard,
  Shield,
};

const toPascalCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toCamelCase = (value: string) => {
  const pascal = toPascalCase(value);
  return pascal.length > 0 ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : pascal;
};

const getIcon = (name: string, fallback: LucideIcon): LucideIcon => {
  if (!name) return fallback;

  const normalized = name.trim();
  const candidates = [
    normalized,
    normalized.replace(/[-_\s]+/g, ""),
    toPascalCase(normalized),
    toCamelCase(normalized),
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
  ];

  for (const candidate of candidates) {
    const mapped = iconMap[candidate];
    if (mapped) return mapped;

    const lucideIcon = (LucideIcons as Record<string, unknown>)[candidate];
    if (lucideIcon && (typeof lucideIcon === "function" || typeof lucideIcon === "object")) {
      return lucideIcon as LucideIcon;
    }
  }

  return fallback;
};

export function FeaturesSection() {
  const { data: landingPage } = useLandingPage();

  const section = landingPage?.featuresSection;
  const badge = section?.badge || "Powerful Features";
  const headline = section?.headline || "Everything you need to manage your finances";
  const description =
    section?.description ||
    "VAYPR brings all your financial operations together in one beautiful, easy-to-use platform.";

  const features =
    section?.features && section.features.length > 0
      ? [...section.features].sort((a, b) => a.order - b.order)
      : defaultFeatures;

  const stats =
    landingPage?.statsSection?.stats && landingPage.statsSection.stats.length > 0
      ? landingPage.statsSection.stats
      : defaultStats;

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            (() => {
              const FeatureIcon = getIcon(feature.icon, FileText);
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <FeatureIcon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })()
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            (() => {
              const StatIcon = getIcon(stat.icon, BarChart3);
              return (
                <div key={stat.label} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <StatIcon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      </div>
    </section>
  );
}
