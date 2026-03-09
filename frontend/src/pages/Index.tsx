import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";

const Index = () => {
  const showTestimonials = false;

  return (
    <div>
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        {showTestimonials && <TestimonialsSection />}
        <PricingSection />
        <CTASection />
      </main>
    </div>
  );
};

export default Index;
