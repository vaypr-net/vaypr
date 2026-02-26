import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { LandingPage, LandingPageDocument } from './entities/landing-page.entity';

@Injectable()
export class LandingPageService {
  constructor(
    @InjectModel(LandingPage.name)
    private landingPageModel: Model<LandingPageDocument>,
  ) {}

  /**
   * Get landing page settings (singleton pattern - only one document exists)
   * If no settings exist, create default settings
   */
  async getSettings(): Promise<LandingPageDocument> {
    const settings = await this.landingPageModel.findOne().exec();

    if (!settings) {
      // Create default settings if none exist
      return await this.createDefaultSettings();
    }

    return settings;
  }

  /**
   * Update landing page settings
   * Uses upsert to create if doesn't exist
   */
  async updateSettings(updateLandingPageDto: UpdateLandingPageDto): Promise<LandingPageDocument> {
    const settings = await this.landingPageModel
      .findOneAndUpdate(
        {}, // Find any document (singleton)
        { $set: updateLandingPageDto },
        { new: true, upsert: true, runValidators: true },
      )
      .exec();

    return settings;
  }

  /**
   * Update specific section of landing page
   */
  async updateSection(
    section: string,
    data: any,
  ): Promise<LandingPageDocument> {
    const updateQuery = { [section]: data };
    
    const settings = await this.landingPageModel
      .findOneAndUpdate(
        {},
        { $set: updateQuery },
        { new: true, upsert: true, runValidators: true },
      )
      .exec();

    return settings;
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(): Promise<LandingPageDocument> {
    await this.landingPageModel.deleteMany({}).exec();
    return this.createDefaultSettings();
  }

  /**
   * Create default landing page settings
   */
  private async createDefaultSettings(): Promise<LandingPageDocument> {
    const defaultSettings = new this.landingPageModel({
      heroSection: {
        badge: 'Billing & Financial Software',
        headline: 'Send invoices. Track expenses. Get paid faster.',
        subheadline:
          'VAYPR keeps your invoicing, quotes, receipts, and clients organized, built for your first job and ready when you scale.',
        primaryButtonText: 'Start Free',
        secondaryButtonText: 'Sign In',
        heroFeatures: [
          { icon: 'FileText', label: 'Invoices', order: 1 },
          { icon: 'FileCheck', label: 'Quotes', order: 2 },
          { icon: 'Receipt', label: 'Receipts', order: 3 },
          { icon: 'Users', label: 'Clients', order: 4 },
          { icon: 'CalendarCheck', label: 'Subscriptions', order: 5 },
          { icon: 'TrendingUp', label: 'Expense\nTracking', order: 6 },
          { icon: 'Palette', label: 'Custom\nTemplates', order: 7 },
        ],
      },
      featuresSection: {
        badge: 'Powerful Features',
        headline: 'Everything you need to manage your finances',
        description:
          'VAYPR brings all your financial operations together in one beautiful, easy-to-use platform.',
        features: [
          {
            icon: 'FileText',
            title: 'Professional Invoices',
            description:
              'Create and send beautiful invoices in seconds. Customize templates and track payment status.',
            order: 1,
          },
          {
            icon: 'Users',
            title: 'Client Management',
            description:
              'Keep all your client information organized. View history, track interactions, and build relationships.',
            order: 2,
          },
          {
            icon: 'Receipt',
            title: 'Expense Tracking',
            description:
              'Capture receipts, categorize expenses, and stay on top of your business spending.',
            order: 3,
          },
          {
            icon: 'TrendingUp',
            title: 'Revenue Insights',
            description:
              'Visualize your income trends and make data-driven decisions for growth.',
            order: 4,
          },
          {
            icon: 'Clock',
            title: 'Recurring Billing',
            description:
              'Set up automatic recurring invoices for retainer clients and subscription services.',
            order: 5,
          },
          {
            icon: 'Send',
            title: 'Quote Management',
            description:
              'Create quotes, share with clients, and convert approved quotes to invoices instantly.',
            order: 6,
          },
        ],
      },
      statsSection: {
        stats: [
          { icon: 'BarChart3', value: '50%', label: 'Faster invoicing' },
          { icon: 'CreditCard', value: '2x', label: 'Faster payments' },
          { icon: 'Shield', value: '100%', label: 'Secure & private' },
        ],
      },
      howItWorksSection: {
        badge: 'How It Works',
        headline: 'Get started in four simple steps',
        description:
          'From sign-up to your first paid invoice in minutes, not hours.',
        steps: [
          {
            number: '01',
            title: 'Sign up in seconds',
            description:
              'Create your free account and set up your business profile. No credit card required.',
            features: ['Free to start', 'No setup fees', 'Instant access'],
            order: 1,
          },
          {
            number: '02',
            title: 'Add your clients',
            description:
              'Import existing clients or add them manually. Keep all contact info organized in one place.',
            features: ['Bulk import', 'Smart organization', 'Contact history'],
            order: 2,
          },
          {
            number: '03',
            title: 'Create & send invoices',
            description:
              'Generate professional invoices, share via link or email, and get paid faster than ever.',
            features: ['Custom templates', 'One-click sending', 'Payment tracking'],
            order: 3,
          },
          {
            number: '04',
            title: 'Track & grow',
            description:
              'Monitor your revenue, manage expenses, and use insights to grow your business.',
            features: ['Real-time analytics', 'Expense tracking', 'Growth insights'],
            order: 4,
          },
        ],
      },
      testimonialsSection: {
        badge: 'Testimonials',
        headline: 'Loved by businesses everywhere',
        testimonials: [
          {
            name: 'Sarah Chen',
            role: 'Freelance Designer',
            avatar: 'SC',
            content:
              'VAYPR has completely transformed how I manage my freelance business. Invoicing used to take hours, now it takes minutes.',
            rating: 5,
            order: 1,
          },
          {
            name: 'Marcus Johnson',
            role: 'Small Business Owner',
            avatar: 'MJ',
            content:
              'The expense tracking feature alone has saved me thousands in tax season. I can\'t imagine running my business without VAYPR.',
            rating: 5,
            order: 2,
          },
          {
            name: 'Emily Rodriguez',
            role: 'Marketing Consultant',
            avatar: 'ER',
            content:
              'Clean interface, powerful features, and incredible support. This is exactly what small businesses need.',
            rating: 5,
            order: 3,
          },
        ],
        enabled: true,
      },
      pricingSection: {
        headline: 'Choose your right plan!',
        description:
          'Select from best plans, ensuring a perfect match. Need more or less?',
        plans: [
          {
            name: 'Starter',
            badge: 'Starter',
            description:
              'Perfect for freelancers and small businesses just getting started with professional invoicing.',
            monthlyPrice: 'Free',
            yearlyPrice: 'Free',
            features: [
              'Up to 3 Invoices per month',
              'Up to 2 Quotes per month',
              'Up to 3 Receipts per month',
              '10 Clients',
              '1 Recurring Subscription',
              'Up to 5 Expense Tracking',
              '1 Custom Template',
            ],
            cta: 'Get Started',
            highlighted: false,
            order: 1,
          },
          {
            name: 'Business',
            badge: 'Business',
            description:
              'Ideal for growing businesses that need full access to invoicing, quotes, and expense tracking.',
            monthlyPrice: 'KD15',
            yearlyPrice: 'KD150',
            features: [
              'Unlimited Invoices',
              'Unlimited Quotes',
              'Unlimited Receipts',
              'Unlimited Clients',
              'Recurring Subscriptions',
              'Expense Tracking',
              'Custom Templates',
              'Priority Email Support',
            ],
            cta: 'Get Started',
            highlighted: true,
            order: 2,
          },
          {
            name: 'Enterprise',
            badge: 'Enterprise',
            description:
              'For larger organizations needing custom solutions, dedicated support, and advanced features.',
            monthlyPrice: "Let's Talk!",
            yearlyPrice: "Let's Talk!",
            features: [
              'Everything in Business',
              'Graphic Designer For Templates',
              'Ai Integration System',
              'API Access',
              'Dedicated Account Manager',
              'Smart Financial Analytics',
              'Advanced Expense Tracking',
              'White-label Options',
            ],
            cta: 'Book a Call',
            highlighted: false,
            order: 3,
          },
        ],
        enabled: true,
        showYearlyToggle: true,
      },
      ctaSection: {
        headline: 'Ready to simplify your finances?',
        description:
          'Join thousands of businesses using VAYPR to manage invoices, track expenses, and grow their revenue. Start free today.',
        primaryButtonText: 'Get Started Free',
        secondaryButtonText: 'Sign In to Dashboard',
        disclaimer: 'No credit card required • Free forever plan available',
        enabled: true,
      },
      footerSection: {
        companyName: 'VAYPR',
        description:
          'The modern financial management platform for businesses that want to grow.',
        copyright: '© 2024 VAYPR. All rights reserved.',
        socialMediaLinks: [
          { label: 'Facebook', href: '#' },
          { label: 'Instagram', href: '#' },
          { label: 'TikTok', href: '#' },
          { label: 'LinkedIn', href: '#' },
        ],
        supportLinks: [
          { label: 'FAQs', href: '/faqs' },
          { label: 'Contact Us', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Refund Policy', href: '/refund' },
        ],
        corporateLinks: [
          { label: 'Guides', href: '/guides' },
          { label: 'About Us', href: '/about' },
          { label: 'B2B Services', href: '/b2b' },
        ],
        showSocialLinks: true,
      },
    });

    return defaultSettings.save();
  }
}
