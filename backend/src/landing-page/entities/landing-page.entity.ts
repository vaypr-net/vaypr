import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LandingPageDocument = LandingPage & Document;

// Hero Section Schema
class HeroFeatureItem {
  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 0 })
  order: number;
}

class HeroSection {
  @Prop({ required: true, default: 'Billing & Financial Software' })
  badge: string;

  @Prop({ required: true, default: 'Send invoices. Track expenses. Get paid faster.' })
  headline: string;

  @Prop({ required: true, default: 'VAYPR keeps your invoicing, quotes, receipts, and clients organized, built for your first job and ready when you scale.' })
  subheadline: string;

  @Prop({ required: true, default: 'Start Free' })
  primaryButtonText: string;

  @Prop({ required: true, default: 'Sign In' })
  secondaryButtonText: string;

  @Prop({ type: [HeroFeatureItem], default: [] })
  heroFeatures: HeroFeatureItem[];
}

// Feature Item Schema
class FeatureItem {
  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  order: number;
}

// Features Section Schema
class FeaturesSection {
  @Prop({ required: true, default: 'Powerful Features' })
  badge: string;

  @Prop({ required: true, default: 'Everything you need to manage your finances' })
  headline: string;

  @Prop({ required: true, default: 'VAYPR brings all your financial operations together in one beautiful, easy-to-use platform.' })
  description: string;

  @Prop({ type: [FeatureItem], default: [] })
  features: FeatureItem[];
}

// Stat Item Schema
class StatItem {
  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  label: string;
}

// Stats Section Schema
class StatsSection {
  @Prop({ type: [StatItem], default: [] })
  stats: StatItem[];
}

// How It Works Step Schema
class HowItWorksStep {
  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: 0 })
  order: number;
}

// How It Works Section Schema
class HowItWorksSection {
  @Prop({ required: true, default: 'How It Works' })
  badge: string;

  @Prop({ required: true, default: 'Get started in four simple steps' })
  headline: string;

  @Prop({ required: true, default: 'From sign-up to your first paid invoice in minutes, not hours.' })
  description: string;

  @Prop({ type: [HowItWorksStep], default: [] })
  steps: HowItWorksStep[];
}

// Testimonial Item Schema
class TestimonialItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  avatar: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 5 })
  rating: number;

  @Prop({ default: 0 })
  order: number;
}

// Testimonials Section Schema
class TestimonialsSection {
  @Prop({ required: true, default: 'Testimonials' })
  badge: string;

  @Prop({ required: true, default: 'Loved by businesses everywhere' })
  headline: string;

  @Prop({ type: [TestimonialItem], default: [] })
  testimonials: TestimonialItem[];

  @Prop({ required: true, default: true })
  enabled: boolean;
}

// Pricing Plan Schema
class PricingPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  badge: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  monthlyPrice: string;

  @Prop({ required: true })
  yearlyPrice: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ required: true, default: 'Get Started' })
  cta: string;

  @Prop({ required: true, default: false })
  highlighted: boolean;

  @Prop({ default: 0 })
  order: number;
}

// Pricing Section Schema
class PricingSection {
  @Prop({ required: true, default: 'Choose your right plan!' })
  headline: string;

  @Prop({ required: true, default: 'Select from best plans, ensuring a perfect match. Need more or less?' })
  description: string;

  @Prop({ type: [PricingPlan], default: [] })
  plans: PricingPlan[];

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: true })
  showYearlyToggle: boolean;
}

// CTA Section Schema
class CTASection {
  @Prop({ required: true, default: 'Ready to simplify your finances?' })
  headline: string;

  @Prop({ required: true, default: 'Join thousands of businesses using VAYPR to manage invoices, track expenses, and grow their revenue. Start free today.' })
  description: string;

  @Prop({ required: true, default: 'Get Started Free' })
  primaryButtonText: string;

  @Prop({ required: true, default: 'Sign In to Dashboard' })
  secondaryButtonText: string;

  @Prop({ required: true, default: 'No credit card required • Free forever plan available' })
  disclaimer: string;

  @Prop({ required: true, default: true })
  enabled: boolean;
}

// Footer Link Schema
class FooterLink {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  href: string;
}

// Footer Section Schema
class FooterSection {
  @Prop({ required: true, default: 'VAYPR' })
  companyName: string;

  @Prop({ required: true, default: 'The modern financial management platform for businesses that want to grow.' })
  description: string;

  @Prop({ required: true, default: '© 2024 VAYPR. All rights reserved.' })
  copyright: string;

  @Prop({ type: [FooterLink], default: [] })
  socialMediaLinks: FooterLink[];

  @Prop({ type: [FooterLink], default: [] })
  supportLinks: FooterLink[];

  @Prop({ type: [FooterLink], default: [] })
  corporateLinks: FooterLink[];

  @Prop({ required: true, default: true })
  showSocialLinks: boolean;
}

@Schema({ timestamps: true })
export class LandingPage {
  @Prop({ type: HeroSection, required: true })
  heroSection: HeroSection;

  @Prop({ type: FeaturesSection, required: true })
  featuresSection: FeaturesSection;

  @Prop({ type: StatsSection, required: true })
  statsSection: StatsSection;

  @Prop({ type: HowItWorksSection, required: true })
  howItWorksSection: HowItWorksSection;

  @Prop({ type: TestimonialsSection, required: true })
  testimonialsSection: TestimonialsSection;

  @Prop({ type: PricingSection, required: true })
  pricingSection: PricingSection;

  @Prop({ type: CTASection, required: true })
  ctaSection: CTASection;

  @Prop({ type: FooterSection, required: true })
  footerSection: FooterSection;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage);

