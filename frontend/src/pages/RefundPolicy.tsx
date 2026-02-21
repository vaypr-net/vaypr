import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
export default function RefundPolicy() {
  return <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <RotateCcw className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Refund Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We want you to be completely satisfied with VAYPR. Here's everything you need to know about our refund process.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: January 15, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* 30-Day Guarantee Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 mb-12 text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              30-Day Money-Back Guarantee
            </h2>
            <p className="text-muted-foreground">
              Try VAYPR risk-free. If you're not satisfied within the first 30 days, we'll refund your payment in full.
            </p>
          </div>

          {/* Eligible for Refund */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Eligible for Refund
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">First-time subscribers within 30 days</h3>
                  <p className="text-muted-foreground text-sm">New customers who haven't used a refund before and request within 30 days of initial purchase.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Service unavailability</h3>
                  <p className="text-muted-foreground text-sm">Extended downtime or service issues that prevented you from using VAYPR for 48+ consecutive hours.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Accidental duplicate charges</h3>
                  <p className="text-muted-foreground text-sm">If you were charged twice for the same billing period, we'll refund the duplicate charge immediately.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Annual plan downgrades</h3>
                  <p className="text-muted-foreground text-sm">Prorated refund available when downgrading from an annual plan within 30 days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Not Eligible for Refund */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              Not Eligible for Refund
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Requests after 30 days</h3>
                  <p className="text-muted-foreground text-sm">Refund requests submitted more than 30 days after the initial purchase.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Violation of Terms of Service</h3>
                  <p className="text-muted-foreground text-sm">Accounts terminated due to abuse, fraud, or violation of our terms.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Previous refund recipients</h3>
                  <p className="text-muted-foreground text-sm">Customers who have already received a refund for a previous subscription.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Partial month usage</h3>
                  <p className="text-muted-foreground text-sm">We don't offer prorated refunds for partial months on monthly plans.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Request */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              How to Request a Refund
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Contact Support</h3>
                <p className="text-sm text-muted-foreground">Email billing@vaypr.net with your account email and reason for refund.</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Review Process</h3>
                <p className="text-sm text-muted-foreground">Our team will review your request within 1-2 business days.</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Receive Refund</h3>
                <p className="text-sm text-muted-foreground">Approved refunds are processed within 5-10 business days to your original payment method.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-muted/30 border border-border rounded-2xl p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Questions About Refunds?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our billing team is happy to help with any questions about refunds or your subscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:billing@vaypr.net">billing@vaypr.net</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
