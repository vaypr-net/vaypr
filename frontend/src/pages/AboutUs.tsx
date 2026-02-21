import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Heart, Zap, Users, Globe, Award } from "lucide-react";

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Invoices Created" },
  { value: "150+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

const values = [
  {
    icon: Target,
    title: "Simplicity First",
    description: "We believe powerful tools shouldn't be complicated. Every feature is designed to be intuitive and easy to use."
  },
  {
    icon: Heart,
    title: "Customer Obsessed",
    description: "Our customers are at the heart of everything we do. We listen, learn, and build what you actually need."
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
];

const team = [
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
];

export default function AboutUs() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            About VAYPR
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to simplify financial management for businesses worldwide. 
            What started as a frustration with complex invoicing software has grown into 
            a platform trusted by thousands of businesses across 150+ countries.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Our Story</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              VAYPR was born in 2023 out of a simple frustration: why is creating and managing invoices 
              so unnecessarily complicated? Our founders, Sarah and Marcus, had spent years working with 
              enterprise financial software and saw firsthand how it failed small and medium businesses.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              We set out to build something different—a financial management platform that's powerful 
              enough for growing businesses but simple enough that anyone can use it from day one. 
              No training required. No complex setup. Just beautiful, professional documents in minutes.
            </p>
            <p className="text-lg leading-relaxed">
              Today, VAYPR helps over 50,000 businesses manage their invoicing, quotes, and expenses. 
              We've processed over 2 million invoices and helped our users get paid faster, look more 
              professional, and spend less time on admin work. And we're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide every decision we make, from product features to customer support.
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
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Meet the Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're a small but mighty team passionate about helping businesses succeed.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-display font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
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
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Recognition</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            We're honored to be recognized for our work in making financial management simpler.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-card border border-border rounded-lg px-6 py-3">
              <p className="font-medium text-foreground">G2 Leader 2025</p>
              <p className="text-sm text-muted-foreground">Invoicing Software</p>
            </div>
            <div className="bg-card border border-border rounded-lg px-6 py-3">
              <p className="font-medium text-foreground">Product Hunt</p>
              <p className="text-sm text-muted-foreground">#1 Product of the Day</p>
            </div>
            <div className="bg-card border border-border rounded-lg px-6 py-3">
              <p className="font-medium text-foreground">Capterra</p>
              <p className="text-sm text-muted-foreground">Best Value 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Join 50,000+ Businesses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Ready to simplify your financial management? Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
