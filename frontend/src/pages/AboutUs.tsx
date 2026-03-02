import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import {
  Target,
  Heart,
  Zap,
  Users,
  Globe,
  Award,
  LucideIcon,
} from "lucide-react";
import { useCorporatePageBySlug } from "@/hooks/useCorporatePages";

const defaultContent = {
  heroTitle: "About VAYPR",
  heroDescription:
    "We're on a mission to simplify financial management for businesses worldwide. What started as a frustration with complex invoicing software has grown into a platform trusted by thousands of businesses across 150+ countries.",
  stats: [
    { value: "50K+", label: "Active Users" },
    { value: "2M+", label: "Invoices Created" },
    { value: "150+", label: "Countries" },
    { value: "99.9%", label: "Uptime" }
  ],
  storyTitle: "Our Story",
  storyParagraphs: [
    "VAYPR was born in 2023 out of a simple frustration: why is creating and managing invoices so unnecessarily complicated? Our founders, Sarah and Marcus, had spent years working with enterprise financial software and saw firsthand how it failed small and medium businesses.",
    "We set out to build something different-a financial management platform that's powerful enough for growing businesses but simple enough that anyone can use it from day one. No training required. No complex setup. Just beautiful, professional documents in minutes.",
    "Today, VAYPR helps over 50,000 businesses manage their invoicing, quotes, and expenses. We've processed over 2 million invoices and helped our users get paid faster, look more professional, and spend less time on admin work. And we're just getting started."
  ],
  valuesTitle: "Our Values",
  valuesDescription:
    "These principles guide every decision we make, from product features to customer support.",
  values: [
    {
      icon: Target,
      title: "Simplicity First",
      description:
        "We believe powerful tools shouldn't be complicated. Every feature is designed to be intuitive and easy to use."
    },
    {
      icon: Heart,
      title: "Customer Obsessed",
      description:
        "Our customers are at the heart of everything we do. We listen, learn, and build what you actually need."
    },
    {
      icon: Zap,
      title: "Move Fast",
      description: "We ship improvements weekly, not yearly. Your feedback today becomes tomorrow's feature."
    },
    {
      icon: Users,
      title: "Inclusive by Design",
      description: "We build for everyone. VAYPR is accessible, affordable, and works for businesses of all sizes."
    }
  ],
  teamTitle: "Meet the Team",
  teamDescription: "We're a small but mighty team passionate about helping businesses succeed.",
  team: [
    {
      name: "Sarah Chen",
      role: "CEO & Co-founder",
      bio: "Former product lead at Stripe. Passionate about making finance accessible."
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO & Co-founder",
      bio: "Engineering leader with 15+ years building scalable SaaS products."
    },
    {
      name: "Emily Thompson",
      role: "Head of Design",
      bio: "Award-winning designer focused on creating delightful user experiences."
    },
    {
      name: "David Kim",
      role: "Head of Customer Success",
      bio: "Dedicated to helping every customer succeed with VAYPR."
    }
  ],
  recognitionTitle: "Recognition",
  recognitionDescription:
    "We're honored to be recognized for our work in making financial management simpler.",
  recognitionItems: [
    { name: "G2 Leader 2025", category: "Invoicing Software" },
    { name: "Product Hunt", category: "#1 Product of the Day" },
    { name: "Capterra", category: "Best Value 2025" }
  ],
  ctaTitle: "Join 50,000+ Businesses",
  ctaDescription: "Ready to simplify your financial management? Start your free trial today.",
  ctaButtonText: "Start Free Trial",
  ctaButtonLink: "Contact Sales",
  ctaEnabled: true,
};

export default function AboutUs() {
  const { data: apiContent, isLoading } = useCorporatePageBySlug("about");
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }
  const content = (apiContent as any)?.content ?? defaultContent;
  const cmsSections = ((apiContent as any)?.sections || [])
    .slice()
    .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
  const isValuesLikeSection = (section: any) => {
    const title = (section?.title || "").toString().toLowerCase().trim();
    const content = (section?.content || "").toString().toLowerCase();
    return (
      title.includes("value") ||
      content.includes("we are committed to") ||
      content.includes("customer success") ||
      content.includes("simplicity: making complex tasks simple")
    );
  };
  const filteredCmsSections = cmsSections.filter((section: any) => {
    const title = (section?.title || "").toString().toLowerCase();
    return !(
      isValuesLikeSection(section) ||
      title.includes("team") ||
      title.includes("recognition")
    );
  });
  const valueIcons = [Target, Heart, Zap, Users];
  const stats = content?.stats || defaultContent.stats;
  const dedupeByContent = (items: any[] = [], keys: string[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const signature = keys.map((key) => (item?.[key] || "").toString().trim().toLowerCase()).join("||");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };
  const team = dedupeByContent(content?.team || defaultContent.team, ["name", "role", "bio", "imageUrl"]);
  const recognitionItems = dedupeByContent(
    content?.recognitionItems || defaultContent.recognitionItems,
    ["name", "category"],
  );
  const rawSecondCtaField = (content?.ctaButtonLink || "").toString().trim();
  const secondCtaText =
    rawSecondCtaField && !rawSecondCtaField.startsWith("/") && !rawSecondCtaField.startsWith("http")
      ? rawSecondCtaField
      : "Contact Sales";
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
  const resolveFromLucide = (iconName: string): LucideIcon | null => {
    const normalized = iconName.trim();
    const candidates = [
      normalized,
      normalized.replace(/[-_\s]+/g, ""),
      toPascalCase(normalized),
      toCamelCase(normalized),
      normalized.charAt(0).toUpperCase() + normalized.slice(1),
    ];
    for (const candidate of candidates) {
      const namedIcon = (LucideIcons as Record<string, unknown>)[candidate];
      if (namedIcon && (typeof namedIcon === "function" || typeof namedIcon === "object")) {
        return namedIcon as LucideIcon;
      }
    }
    return null;
  };
  const resolveValueIcon = (iconValue: any, fallbackIcon: LucideIcon): LucideIcon => {
    if (typeof iconValue === "string") {
      const lucideIcon = resolveFromLucide(iconValue.trim());
      if (lucideIcon) return lucideIcon;
      return fallbackIcon;
    }
    if (typeof iconValue === "function") {
      return iconValue as LucideIcon;
    }
    return fallbackIcon;
  };

  const values = dedupeByContent(content?.values || defaultContent.values, ["title", "description"]).map((value: any, index: number) => {
    const defaultItem = defaultContent.values[index] || {};
    const fallbackIcon =
      defaultItem?.icon ||
      valueIcons[index % valueIcons.length];
    return {
      ...defaultItem,
      ...value,
      icon: resolveValueIcon(value?.icon, fallbackIcon),
    };
  });

  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {content?.heroTitle || defaultContent.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {content?.heroDescription || defaultContent.heroDescription}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center min-w-[140px]">
                <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-14">
          {filteredCmsSections.length > 0 ? filteredCmsSections.map((section: any, idx: number) => (
            <div key={`${section?.title || "section"}-${idx}`}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                  {section?.title || `Section ${idx + 1}`}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none text-muted-foreground">
                {(section?.content || "")
                  .split(/\n\n+/)
                  .filter((p: string) => p.trim().length > 0)
                  .map((paragraph: string, pIdx: number) => (
                    <p
                      key={pIdx}
                      className={`text-lg leading-relaxed ${pIdx === 0 ? "" : "mt-6"}`}
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </div>
          )) : (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                  {content?.storyTitle || defaultContent.storyTitle}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed mb-6">
                  {(content?.storyParagraphs || defaultContent.storyParagraphs)[0]}
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  {(content?.storyParagraphs || defaultContent.storyParagraphs)[1]}
                </p>
                <p className="text-lg leading-relaxed">
                  {(content?.storyParagraphs || defaultContent.storyParagraphs)[2]}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">{content?.valuesTitle || defaultContent.valuesTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {content?.valuesDescription || defaultContent.valuesDescription}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, idx) => {
              const IconComponent = value.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">{content?.teamTitle || defaultContent.teamTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {content?.teamDescription || defaultContent.teamDescription}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 text-center">
                {member.imageUrl ? (
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-display font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recognition */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">{content?.recognitionTitle || defaultContent.recognitionTitle}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {content?.recognitionDescription || defaultContent.recognitionDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {recognitionItems.map((item: { name: string; category: string }, idx: number) => (
              <div key={idx} className="bg-card border border-border rounded-lg px-6 py-3">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {(content?.ctaEnabled ?? defaultContent.ctaEnabled) && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              {content?.ctaTitle || defaultContent.ctaTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {content?.ctaDescription || defaultContent.ctaDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">
                  {content?.ctaButtonText || defaultContent.ctaButtonText}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">{secondCtaText}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
