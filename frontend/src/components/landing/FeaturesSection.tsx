import { 
  FileText, 
  Users, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CreditCard,
  BarChart3,
  Send,
  Shield
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    description: "Create and send beautiful invoices in seconds. Customize templates and track payment status.",
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Keep all your client information organized. View history, track interactions, and build relationships.",
  },
  {
    icon: Receipt,
    title: "Expense Tracking",
    description: "Capture receipts, categorize expenses, and stay on top of your business spending.",
  },
  {
    icon: TrendingUp,
    title: "Revenue Insights",
    description: "Visualize your income trends and make data-driven decisions for growth.",
  },
  {
    icon: Clock,
    title: "Recurring Billing",
    description: "Set up automatic recurring invoices for retainer clients and subscription services.",
  },
  {
    icon: Send,
    title: "Quote Management",
    description: "Create quotes, share with clients, and convert approved quotes to invoices instantly.",
  },
];

const stats = [
  { icon: BarChart3, value: "50%", label: "Faster invoicing" },
  { icon: CreditCard, value: "2x", label: "Faster payments" },
  { icon: Shield, value: "100%", label: "Secure & private" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            Powerful Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Everything you need to manage your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              finances
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            VAYPR brings all your financial operations together in one beautiful, easy-to-use platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
