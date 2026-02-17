import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { PricingDialog } from "./PricingDialog";

export function CTASection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-[1px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary animate-gradient opacity-80" />
          
          <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 md:p-12 lg:p-16 text-center">
            {/* Decorative Elements */}
            <div className="absolute top-8 left-8 animate-pulse-slow">
              <Sparkles className="w-8 h-8 text-primary/50" />
            </div>
            <div className="absolute bottom-8 right-8 animate-pulse-slow" style={{ animationDelay: "1s" }}>
              <Sparkles className="w-6 h-6 text-accent/50" />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to simplify your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                finances?
              </span>
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Join thousands of businesses using VAYPR to manage invoices, track expenses, and grow their revenue. Start free today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PricingDialog>
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-glow text-base px-8 h-12">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </PricingDialog>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base px-8 h-12">
                <Link to="/login">Sign In to Dashboard</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Free forever plan available
            </p>

            {/* Policy Links - Static for Google crawlability */}
            <div className="mt-8 pt-8 border-t border-border/50 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <span className="text-border/50">•</span>
              <a href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <span className="text-border/50">•</span>
              <a href="/contact" className="hover:text-foreground transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
