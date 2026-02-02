import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Settings2, Zap, HeadphonesIcon, FileText, Receipt, Users, RefreshCw, PieChart, Palette, Brush, Globe, Brain, Code, Mail, UserCheck, TrendingUp, Layers, Link2, Building2, Briefcase, ShoppingCart, Scale, Database, GraduationCap, LayoutDashboard, AlertTriangle } from "lucide-react";

// Enterprise Value Pillars
const valuePillars = [{
  icon: Shield,
  title: "Control & Permissions",
  description: "Granular role-based access, approval workflows, and audit trails for complete financial governance."
}, {
  icon: Zap,
  title: "Automate at Scale",
  description: "Eliminate manual work with recurring billing, automated reminders, and intelligent categorization."
}, {
  icon: Layers,
  title: "Integrate with Your Stack",
  description: "Connect VAYPR to your ERP, CRM, and accounting tools via secure REST APIs and webhooks."
}, {
  icon: HeadphonesIcon,
  title: "Dedicated Support",
  description: "A named account manager, priority escalation, and tailored onboarding for your teams."
}];

// Enterprise Capabilities
const enterpriseCapabilities = {
  "Billing & Documents": [{
    icon: FileText,
    title: "Unlimited Invoices",
    description: "Create and manage invoices at scale with consistent formatting and controls."
  }, {
    icon: FileText,
    title: "Unlimited Quotes",
    description: "Generate professional quotes and convert them into invoices seamlessly."
  }, {
    icon: Receipt,
    title: "Unlimited Receipts",
    description: "Store and organize receipts for clean reconciliation and reporting."
  }],
  "Automation & Subscriptions": [{
    icon: RefreshCw,
    title: "Recurring Subscriptions",
    description: "Automate recurring billing schedules, renewals, and reminders."
  }, {
    icon: PieChart,
    title: "Expense Tracking",
    description: "Capture, categorize, and monitor expenses across teams and projects."
  }, {
    icon: Settings2,
    title: "Advanced Expense Tracking",
    description: "Add granular rules, approvals, and audit-friendly workflows."
  }],
  "Branding & Customization": [{
    icon: Palette,
    title: "Custom Templates",
    description: "Build standardized templates aligned with your corporate identity."
  }, {
    icon: Brush,
    title: "Graphic Designer for Templates",
    description: "Get expert help crafting polished, on-brand templates quickly."
  }, {
    icon: Globe,
    title: "White-label Options",
    description: "Present a fully branded experience for subsidiaries or client-facing portals."
  }],
  "Integrations & Platform": [{
    icon: Brain,
    title: "AI Integration System",
    description: "Automate data extraction, categorization, and workflow suggestions using AI-ready tools."
  }, {
    icon: Code,
    title: "API Access",
    description: "Connect VAYPR to internal systems and external apps with secure endpoints."
  }, {
    icon: Database,
    title: "Secure Data Connectors",
    description: "Sync VAYPR with ERPs, banking feeds, and cloud tools using pre-built connectors, scheduled imports, and validation checks."
  }],
  "Support & Success": [{
    icon: Mail,
    title: "Priority Email Support",
    description: "Faster responses and escalations when your team needs help."
  }, {
    icon: UserCheck,
    title: "Dedicated Account Manager",
    description: "A single point of contact for onboarding, rollout, and ongoing success."
  }, {
    icon: GraduationCap,
    title: "Onboarding & Enablement",
    description: "Guided setup, tailored best practices, and team training to accelerate rollout and drive adoption across your org."
  }],
  "Insights & Analytics": [{
    icon: TrendingUp,
    title: "Smart Financial Analytics",
    description: "High-level visibility into trends, performance, and operational efficiency."
  }, {
    icon: LayoutDashboard,
    title: "Real-Time Performance Dashboards",
    description: "Track key KPIs in one place with customizable dashboards, filters, and shareable views for every stakeholder."
  }, {
    icon: AlertTriangle,
    title: "Forecasting & Anomaly Alerts",
    description: "Run what-if scenarios, project trends, and get notified when spend, cash flow, or performance metrics deviate from plan."
  }]
};

// Integration logos (placeholders)
const integrations = [{
  name: "Slack",
  icon: "💬"
}, {
  name: "Zapier",
  icon: "⚡"
}, {
  name: "QuickBooks",
  icon: "📊"
}, {
  name: "Xero",
  icon: "📈"
}, {
  name: "Salesforce",
  icon: "☁️"
}, {
  name: "HubSpot",
  icon: "🔶"
}];

// Industries
const industries = [{
  icon: Layers,
  title: "SaaS & Tech",
  description: "Automate subscription billing, manage usage-based pricing, and integrate with your existing stack."
}, {
  icon: Briefcase,
  title: "Agencies & Consultancies",
  description: "Streamline client billing with project-based invoicing, retainer management, and branded portals."
}, {
  icon: ShoppingCart,
  title: "E-commerce & Retail",
  description: "Multi-currency support, bulk invoicing, and seamless integration with sales platforms."
}, {
  icon: Scale,
  title: "Professional Services",
  description: "Time tracking integration, expense management, and detailed reporting for law firms and accountants."
}];

// Trusted company logos (placeholders)
const trustedLogos = ["TechCorp", "FinanceHub", "CloudScale", "DataFlow", "InnovateCo", "GlobalTech"];
export default function B2BServices() {
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-lg font-display">V</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-xl text-foreground tracking-tight">VAYPR</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">for Business</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-28 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/3 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              Enterprise Finance Platform
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Built for Enterprise
              <br />
              <span className="text-primary">Finance Operations</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Centralize invoicing, subscriptions, expenses, and reporting with approvals, integrations, and dedicated support, designed for scale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
              <Button size="lg" asChild className="h-12 px-8 text-base font-medium shadow-lg shadow-primary/20">
                <Link to="/contact">
                  Talk to Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Trusted by teams in <span className="text-foreground font-medium">SaaS</span>, <span className="text-foreground font-medium">Agencies</span>, <span className="text-foreground font-medium">Retail</span>, and <span className="text-foreground font-medium">Professional Services</span>
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Value Pillars */}
      <section className="py-16 sm:py-24 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {valuePillars.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return <div key={idx} className="group p-6 lg:p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* Enterprise Capabilities */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4 tracking-tight">
              Enterprise Capabilities
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A comprehensive suite of tools designed for organizations that demand reliability, 
              scalability, and complete control over their financial operations.
            </p>
          </div>

          <div className="space-y-12 lg:space-y-16 max-w-6xl mx-auto">
            {Object.entries(enterpriseCapabilities).map(([category, features]) => <div key={category}>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-6 text-center">
                  {category}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return <div key={idx} className="flex gap-4 p-5 rounded-xl bg-card border border-border/60 hover:border-border transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1.5">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </div>;
              })}
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Integrations & Automation */}
      <section className="py-16 sm:py-24 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
                <Link2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4 tracking-tight">
                Integrations & Automation
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connect your existing stack with secure REST APIs, webhooks, and AI-powered automation.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 lg:gap-6 mb-8">
              {integrations.map((integration, idx) => <div key={idx} className="aspect-square flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group">
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{integration.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{integration.name}</span>
                </div>)}
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Plus custom integrations for enterprise needs
            </p>
          </div>
        </div>
      </section>

      {/* Trusted Across Industries */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4 tracking-tight">
              Trusted Across Industries
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how organizations like yours use VAYPR to streamline their financial operations.
            </p>
          </div>

          {/* Trusted Logos */}
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12 mb-12 lg:mb-16">
            {trustedLogos.map((logo, idx) => <div key={idx} className="text-muted-foreground/40 font-display font-bold text-lg hover:text-muted-foreground/60 transition-colors">
                {logo}
              </div>)}
          </div>

          {/* Industry Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
            {industries.map((industry, idx) => {
            const IconComponent = industry.icon;
            return <div key={idx} className="group p-6 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    {industry.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{industry.description}</p>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-violet-50/80 via-slate-50/60 to-violet-50/40 dark:from-violet-950/20 dark:via-slate-900/40 dark:to-violet-950/10 border border-violet-200/60 dark:border-violet-800/30 rounded-3xl p-10 sm:p-14 lg:p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-8">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6 tracking-tight">
                Ready to Scale Finance Operations?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Let's map VAYPR to your workflows, integrations, and approval structure.
              </p>
              
              <Button size="lg" asChild className="h-13 px-10 text-base font-medium shadow-lg shadow-primary/20">
                <Link to="/contact">
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <p className="mt-8 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  Enterprise onboarding
                </span>
                <span className="mx-3 text-border">•</span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  Dedicated support
                </span>
                <span className="mx-3 text-border">•</span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  Custom rollout
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VAYPR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
}