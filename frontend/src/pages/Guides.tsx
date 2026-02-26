import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Download, FileText, Users, CreditCard, BarChart3, Settings, Zap } from "lucide-react";
import { useCorporatePageBySlug, useGuides } from "@/hooks/useCorporatePages";

const guides = [
  {
    category: "Getting Started",
    icon: Zap,
    items: [
      {
        title: "Quick Start Guide",
        description: "Get up and running with VAYPR in under 10 minutes. Learn the basics of creating your first invoice.",
        duration: "10 min",
        difficulty: "Beginner",
        slug: "#"
      },
      {
        title: "Setting Up Your Business Profile",
        description: "Configure your company details, logo, and default settings for professional documents.",
        duration: "5 min",
        difficulty: "Beginner",
        slug: "#"
      },
      {
        title: "Understanding the Dashboard",
        description: "Navigate the dashboard efficiently and discover key features to manage your business.",
        duration: "8 min",
        difficulty: "Beginner",
        slug: "#"
      }
    ]
  },
  {
    category: "Invoicing",
    icon: FileText,
    items: [
      {
        title: "Creating Professional Invoices",
        description: "Master the art of creating clear, professional invoices that get you paid faster.",
        duration: "15 min",
        difficulty: "Beginner",
        slug: "#"
      },
      {
        title: "Customizing Invoice Templates",
        description: "Design stunning invoice templates that match your brand identity.",
        duration: "20 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Setting Up Recurring Invoices",
        description: "Automate your billing with recurring invoices for retainer clients and subscriptions.",
        duration: "12 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Multi-Currency Invoicing",
        description: "Learn how to invoice international clients in their local currency.",
        duration: "10 min",
        difficulty: "Intermediate",
        slug: "#"
      }
    ]
  },
  {
    category: "Client Management",
    icon: Users,
    items: [
      {
        title: "Managing Your Client Database",
        description: "Organize and maintain your client information for efficient invoicing and communication.",
        duration: "12 min",
        difficulty: "Beginner",
        slug: "#"
      },
      {
        title: "Client Portal Overview",
        description: "Give your clients access to view and pay invoices through their personalized portal.",
        duration: "15 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Tracking Client Payment History",
        description: "Monitor payment patterns and identify your best (and worst) paying clients.",
        duration: "10 min",
        difficulty: "Beginner",
        slug: "#"
      }
    ]
  },
  {
    category: "Payments & Billing",
    icon: CreditCard,
    items: [
      {
        title: "Payment Methods Setup",
        description: "Configure payment options including credit cards, bank transfers, and PayPal.",
        duration: "15 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Handling Partial Payments",
        description: "Accept and track partial payments and payment plans for large invoices.",
        duration: "8 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Late Payment Reminders",
        description: "Set up automated reminders to chase overdue invoices professionally.",
        duration: "10 min",
        difficulty: "Beginner",
        slug: "#"
      }
    ]
  },
  {
    category: "Reports & Analytics",
    icon: BarChart3,
    items: [
      {
        title: "Understanding Your Reports",
        description: "Make sense of your financial data with our comprehensive reporting tools.",
        duration: "20 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Tax Preparation Guide",
        description: "Export the right data and reports for seamless tax filing.",
        duration: "15 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Cash Flow Analysis",
        description: "Monitor your business cash flow and predict future income.",
        duration: "18 min",
        difficulty: "Advanced",
        slug: "#"
      }
    ]
  },
  {
    category: "Advanced Settings",
    icon: Settings,
    items: [
      {
        title: "API Integration Guide",
        description: "Connect VAYPR with your existing tools using our REST API.",
        duration: "30 min",
        difficulty: "Advanced",
        slug: "#"
      },
      {
        title: "Team & Permissions",
        description: "Set up team members with appropriate access levels and permissions.",
        duration: "12 min",
        difficulty: "Intermediate",
        slug: "#"
      },
      {
        title: "Webhooks & Automation",
        description: "Automate workflows by connecting VAYPR to Zapier, Make, and more.",
        duration: "25 min",
        difficulty: "Advanced",
        slug: "#"
      }
    ]
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "Intermediate":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "Advanced":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Guides() {
  const { data: apiContent } = useCorporatePageBySlug("guides");
  const { data: uploadedGuides = [] } = useGuides();
  const content = (apiContent as any)?.content;
  const visibleUploadedGuides = uploadedGuides.some((guide: any) => guide?.published)
    ? uploadedGuides.filter((guide: any) => guide?.published)
    : uploadedGuides;
  const uploadedCategories = Object.values(
    visibleUploadedGuides.reduce((acc: Record<string, any>, guide: any) => {
      const category = (guide?.category || "General").toString().trim();
      if (!acc[category]) {
        acc[category] = { category, items: [] };
      }
      acc[category].items.push({
        title: guide.title,
        description: guide.description,
        duration: guide.duration || "",
        difficulty: guide.difficulty || "Beginner",
        slug: guide.fileUrl,
        fileUrl: guide.fileUrl,
      });
      return acc;
    }, {}),
  ) as Array<{ category: string; items: any[] }>;
  const categories =
    uploadedCategories.length > 0
      ? uploadedCategories
      : content?.categories?.length >= 6
        ? content.categories
        : guides;
  const uploadedGuideUrlByTitle = new Map(
    visibleUploadedGuides.map((guide: any) => [String(guide.title || "").toLowerCase().trim(), guide.fileUrl]),
  );

  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {content?.title || "Guides & Tutorials"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content?.description || "Learn how to get the most out of VAYPR with our comprehensive guides. From quick starts to advanced features, we've got you covered."}
          </p>
        </div>
      </section>

      {/* Guides Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {categories.map((category, idx) => {
            const IconComponent = category.icon || guides[idx % guides.length]?.icon || BookOpen;
            return (
              <div key={idx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-foreground">
                    {category.category}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {category.items.map((guide, guideIdx) => (
                    <div
                      key={guideIdx}
                      className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                    >
                      {(() => {
                        const titleKey = String(guide.title || "").toLowerCase().trim();
                        const mappedFileUrl = uploadedGuideUrlByTitle.get(titleKey);
                        const guideUrl = mappedFileUrl || guide.fileUrl || guide.downloadUrl || guide.slug;
                        const canDownload = Boolean(guideUrl && guideUrl !== "#");
                        return (
                          <>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {guide.title}
                        </h3>
                        <Button
                          size="sm"
                          variant={canDownload ? "default" : "outline"}
                          className="h-8 px-3 text-xs"
                          disabled={!canDownload}
                          asChild={canDownload}
                        >
                          {canDownload ? (
                            <a href={guideUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Download PDF
                            </a>
                          ) : (
                            <span>
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF Pending
                            </span>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {guide.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getDifficultyColor(guide.difficulty)}>
                          {guide.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {guide.duration}
                        </span>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Help CTA */}
          <div className="mt-16 text-center p-8 bg-muted/30 rounded-2xl border border-border">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {content?.helpTitle || "Can't find what you need?"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {content?.helpDescription || "Our support team is ready to help you with any questions or custom training needs."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/faqs">Browse FAQs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
