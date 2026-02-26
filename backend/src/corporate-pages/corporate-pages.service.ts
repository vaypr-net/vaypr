import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCorporatePageDto } from './dto/create-corporate-page.dto';
import { UpdateCorporatePageDto } from './dto/update-corporate-page.dto';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { 
  CorporatePage, 
  CorporatePageDocument, 
  CorporatePageType,
  Guide,
  GuideDocument
} from './entities/corporate-page.entity';

@Injectable()
export class CorporatePagesService {
  constructor(
    @InjectModel(CorporatePage.name)
    private corporatePageModel: Model<CorporatePageDocument>,
    @InjectModel(Guide.name)
    private guideModel: Model<GuideDocument>,
  ) {}

  async create(createCorporatePageDto: CreateCorporatePageDto): Promise<CorporatePage> {
    // Check if page with same slug already exists
    const existingPage = await this.corporatePageModel.findOne({ slug: createCorporatePageDto.slug }).exec();
    if (existingPage) {
      throw new ConflictException(`Page with slug '${createCorporatePageDto.slug}' already exists`);
    }

    const page = new this.corporatePageModel(createCorporatePageDto);
    return page.save();
  }

  async findAll(enabledOnly?: boolean): Promise<CorporatePage[]> {
    const filter: any = {};
    
    if (enabledOnly) {
      filter.enabled = true;
    }

    return this.corporatePageModel
      .find(filter)
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<CorporatePage> {
    const page = await this.corporatePageModel.findById(id).exec();

    if (!page) {
      throw new NotFoundException(`Corporate page with ID ${id} not found`);
    }

    return page;
  }

  async findBySlug(slug: string): Promise<CorporatePage> {
    const page = await this.corporatePageModel.findOne({ slug, enabled: true }).exec();

    if (!page) {
      throw new NotFoundException(`Page '${slug}' not found`);
    }

    return page;
  }

  async findByType(type: CorporatePageType): Promise<CorporatePage> {
    const page = await this.corporatePageModel.findOne({ type }).exec();

    if (!page) {
      throw new NotFoundException(`Page of type '${type}' not found`);
    }

    return page;
  }

  async update(id: string, updateCorporatePageDto: UpdateCorporatePageDto): Promise<CorporatePage> {
    // Ensure slug is never updated to preserve page route
    // @ts-ignore - slug should never be in updateCorporatePageDto, but just in case
    const { slug, ...safeUpdateData } = { ...updateCorporatePageDto };

    const page = await this.corporatePageModel
      .findByIdAndUpdate(id, safeUpdateData, { new: true })
      .exec();

    if (!page) {
      throw new NotFoundException(`Corporate page with ID ${id} not found`);
    }

    return page;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.corporatePageModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Corporate page with ID ${id} not found`);
    }

    return { message: 'Corporate page deleted successfully' };
  }

  async toggleEnabled(id: string): Promise<CorporatePage> {
    const page = await this.corporatePageModel.findById(id).exec();
    
    if (!page) {
      throw new NotFoundException(`Corporate page with ID ${id} not found`);
    }
    
    page.enabled = !page.enabled;
    return page.save();
  }

  async toggleFooterVisibility(id: string): Promise<CorporatePage> {
    const page = await this.corporatePageModel.findById(id).exec();
    
    if (!page) {
      throw new NotFoundException(`Corporate page with ID ${id} not found`);
    }
    
    page.showInFooter = !page.showInFooter;
    return page.save();
  }

  /**
   * Initialize default corporate pages if they don't exist
   */
  async initializeDefaultPages(): Promise<void> {
    const defaultPages = [
      {
        slug: 'about',
        title: 'About Us',
        type: CorporatePageType.ABOUT,
        metaDescription: 'Learn about VAYPR\'s mission, vision, and the team behind the platform.',
        icon: 'Building2',
        heroTitle: 'About VAYPR',
        heroSubtitle: 'Empowering businesses with modern financial management tools',
        sections: [
          {
            title: 'Our Mission',
            content: 'At VAYPR, our mission is to simplify financial management for businesses of all sizes. We believe that every business deserves access to professional-grade invoicing, expense tracking, and financial tools without the complexity or high costs of traditional solutions.',
            order: 1,
          },
          {
            title: 'Our Story',
            content: 'Founded in 2024, VAYPR was born out of a simple observation: small businesses and freelancers were struggling with outdated, expensive, or overly complicated financial management tools. We set out to create a platform that combines powerful features with an intuitive interface, making professional financial management accessible to everyone.',
            order: 2,
          },
          {
            title: 'Our Values',
            content: 'We are committed to:\n• Customer Success: Your growth is our priority\n• Innovation: Continuously improving our platform\n• Transparency: Clear pricing, no hidden fees\n• Security: Protecting your data with enterprise-grade security\n• Simplicity: Making complex tasks simple',
            order: 3,
          },
          {
            title: 'Why Choose VAYPR',
            content: 'VAYPR stands out with its user-friendly interface, comprehensive feature set, and exceptional customer support. Whether you\'re a freelancer sending your first invoice or a growing business managing hundreds of clients, VAYPR scales with your needs.',
            order: 4,
          },
        ],
        teamMembers: [
          {
            name: 'John Smith',
            position: 'CEO & Co-Founder',
            bio: 'Former finance executive with 15+ years of experience in fintech and SaaS.',
            order: 1,
          },
          {
            name: 'Sarah Johnson',
            position: 'CTO & Co-Founder',
            bio: 'Software architect passionate about building scalable, user-friendly platforms.',
            order: 2,
          },
          {
            name: 'Michael Chen',
            position: 'Head of Product',
            bio: 'Product strategist focused on creating delightful user experiences.',
            order: 3,
          },
        ],
        ctaSection: {
          enabled: true,
          title: 'Ready to Join Us?',
          description: 'Start managing your finances with VAYPR today. No credit card required.',
          buttonText: 'Get Started Free',
          buttonLink: '/signup',
        },
        content: {
          heroTitle: 'About VAYPR',
          heroDescription:
            'We are on a mission to simplify financial management for businesses worldwide.',
          values: [
            {
              title: 'Customer Obsessed',
              description:
                'Everything we build starts from real customer workflows and outcomes.',
            },
            {
              title: 'Simplicity First',
              description:
                'Powerful tools should still feel intuitive for every team member.',
            },
            {
              title: 'Reliable Platform',
              description:
                'Security, performance, and consistency are built into every release.',
            },
          ],
          team: [
            {
              name: 'John Smith',
              role: 'CEO & Co-Founder',
              bio: 'Former finance executive with 15+ years of fintech experience.',
            },
            {
              name: 'Sarah Johnson',
              role: 'CTO & Co-Founder',
              bio: 'Software architect focused on scalable and user-friendly systems.',
            },
            {
              name: 'Michael Chen',
              role: 'Head of Product',
              bio: 'Product strategist focused on customer value and usability.',
            },
          ],
        },
        enabled: true,
        showInFooter: true,
        order: 1,
      },
      {
        slug: 'b2b',
        title: 'B2B Services',
        type: CorporatePageType.B2B,
        metaDescription: 'Enterprise solutions and B2B services from VAYPR. Custom integrations, white-label options, and dedicated support.',
        icon: 'Briefcase',
        heroTitle: 'Enterprise Solutions',
        heroSubtitle: 'Powerful B2B financial management tools for growing organizations',
        sections: [
          {
            title: 'Enterprise-Grade Platform',
            content: 'VAYPR\'s B2B solutions are designed for organizations that need more than standard invoicing. We offer custom integrations, white-label options, and dedicated account management to help your business scale efficiently.',
            order: 1,
          },
          {
            title: 'Custom Integration',
            content: 'Seamlessly integrate VAYPR with your existing business systems. Our API-first approach allows you to connect with accounting software, CRM platforms, payment processors, and more. Our technical team works with you to ensure smooth integration and ongoing support.',
            order: 2,
          },
          {
            title: 'White Label Solutions',
            content: 'Offer VAYPR\'s powerful financial management tools under your own brand. Perfect for agencies, platforms, and service providers who want to provide billing solutions to their clients without building from scratch.',
            order: 3,
          },
          {
            title: 'Dedicated Support',
            content: 'Enterprise clients receive priority support with dedicated account managers, custom onboarding, and training sessions for your team. We ensure your organization gets the most value from VAYPR.',
            order: 4,
          },
        ],
        features: [
          {
            title: 'API Access',
            description: 'Full REST API access for custom integrations and automation',
            icon: 'Code',
            order: 1,
          },
          {
            title: 'Custom Branding',
            description: 'White-label solutions with your company branding',
            icon: 'Palette',
            order: 2,
          },
          {
            title: 'Advanced Analytics',
            description: 'Comprehensive financial reporting and business intelligence',
            icon: 'BarChart3',
            order: 3,
          },
          {
            title: 'Multi-Entity Support',
            description: 'Manage multiple business entities from a single account',
            icon: 'Building',
            order: 4,
          },
          {
            title: 'Custom Workflows',
            description: 'Tailored approval processes and automated workflows',
            icon: 'Workflow',
            order: 5,
          },
          {
            title: 'Priority Support',
            description: 'Dedicated account manager and 24/7 technical support',
            icon: 'Headphones',
            order: 6,
          },
        ],
        ctaSection: {
          enabled: true,
          title: 'Let\'s Build Together',
          description: 'Contact our B2B team to discuss custom solutions for your organization.',
          buttonText: 'Schedule a Demo',
          buttonLink: '/contact',
        },
        content: {
          heroEyebrow: 'Enterprise Finance Platform',
          heroTitleLine1: 'Built for Enterprise',
          heroTitleLine2: 'Finance Operations',
          heroDescription:
            'Centralize invoicing, subscriptions, expenses, and reporting with approvals and integrations.',
          valuePillars: [
            {
              title: 'Control & Permissions',
              description: 'Role-based access, approval flows, and audit-friendly operations.',
            },
            {
              title: 'Automate at Scale',
              description: 'Recurring billing, reminders, and workflow automation for large teams.',
            },
            {
              title: 'Integrate with Your Stack',
              description: 'Connect VAYPR with ERP, CRM, and accounting tools.',
            },
          ],
          industries: [
            {
              title: 'SaaS & Tech',
              description: 'Automate recurring billing and subscription operations.',
            },
            {
              title: 'Agencies & Consulting',
              description: 'Manage retainers, milestones, and branded client billing.',
            },
            {
              title: 'Retail & E-commerce',
              description: 'Handle high-volume invoicing with clear reporting.',
            },
          ],
        },
        enabled: true,
        showInFooter: true,
        order: 2,
      },
      {
        slug: 'guides',
        title: 'Guides & Tutorials',
        type: CorporatePageType.GUIDES,
        metaDescription: 'Guides and tutorials to help you use VAYPR effectively.',
        icon: 'BookOpen',
        heroTitle: 'Guides & Tutorials',
        heroSubtitle: 'Learn how to get the most out of VAYPR with our guides',
        sections: [
          {
            title: 'Getting Started',
            content: 'Quick Start Guide - Get up and running with VAYPR in under 10 minutes.\n\nSetting Up Your Business Profile - Configure your company details, logo, and default settings.\n\nUnderstanding the Dashboard - Navigate the dashboard efficiently and discover key features.',
            order: 1,
          },
          {
            title: 'Invoicing',
            content: 'Creating Professional Invoices - Master the art of creating clear, professional invoices.\n\nCustomizing Invoice Templates - Design stunning invoice templates that match your brand identity.\n\nSetting Up Recurring Invoices - Automate billing with recurring invoices.',
            order: 2,
          },
          {
            title: 'Client Management',
            content: 'Managing Your Client Database - Organize and maintain client information.\n\nClient Portal Overview - Give your clients access to view and pay invoices.\n\nTracking Client Payment History - Monitor payment patterns and client histories.',
            order: 3,
          },
          {
            title: 'Payments & Billing',
            content: 'Payment Methods Setup - Configure payment options including credit cards and bank transfers.\n\nHandling Partial Payments - Accept and track partial payments and payment plans.\n\nLate Payment Reminders - Set up automated reminders for overdue invoices.',
            order: 4,
          },
          {
            title: 'Reports & Analytics',
            content: 'Understanding Your Reports - Make sense of your financial data with reporting tools.\n\nTax Preparation Guide - Export the right data for tax filing.\n\nCash Flow Analysis - Monitor your business cash flow and predict future income.',
            order: 5,
          },
          {
            title: 'Advanced Settings',
            content: 'API Integration Guide - Connect VAYPR with your existing tools using our REST API.\n\nTeam & Permissions - Set up team members with appropriate access levels.\n\nWebhooks & Automation - Automate workflows by connecting VAYPR to external services.',
            order: 6,
          },
        ],
        content: {
          title: 'Guides & Tutorials',
          description:
            'Learn how to get the most out of VAYPR with step-by-step practical guides.',
          categories: [
            {
              category: 'Getting Started',
              items: [
                {
                  title: 'Quick Start Guide',
                  description:
                    'Get up and running with VAYPR in under 10 minutes. Learn the basics of creating your first invoice.',
                  duration: '10 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
                {
                  title: 'Setting Up Your Business Profile',
                  description:
                    'Configure your company details, logo, and default settings for professional documents.',
                  duration: '5 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
                {
                  title: 'Understanding the Dashboard',
                  description:
                    'Navigate the dashboard efficiently and discover key features to manage your business.',
                  duration: '8 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
              ],
            },
            {
              category: 'Invoicing',
              items: [
                {
                  title: 'Creating Professional Invoices',
                  description:
                    'Master the art of creating clear, professional invoices that get you paid faster.',
                  duration: '15 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
                {
                  title: 'Customizing Invoice Templates',
                  description:
                    'Design stunning invoice templates that match your brand identity.',
                  duration: '20 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Setting Up Recurring Invoices',
                  description:
                    'Automate your billing with recurring invoices for retainer clients and subscriptions.',
                  duration: '12 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Multi-Currency Invoicing',
                  description:
                    'Learn how to invoice international clients in their local currency.',
                  duration: '10 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
              ],
            },
            {
              category: 'Client Management',
              items: [
                {
                  title: 'Managing Your Client Database',
                  description:
                    'Organize and maintain your client information for efficient invoicing and communication.',
                  duration: '12 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
                {
                  title: 'Client Portal Overview',
                  description:
                    'Give your clients access to view and pay invoices through their personalized portal.',
                  duration: '15 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Tracking Client Payment History',
                  description:
                    'Monitor payment patterns and identify your best (and worst) paying clients.',
                  duration: '10 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
              ],
            },
            {
              category: 'Payments & Billing',
              items: [
                {
                  title: 'Payment Methods Setup',
                  description:
                    'Configure payment options including credit cards, bank transfers, and PayPal.',
                  duration: '15 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Handling Partial Payments',
                  description:
                    'Accept and track partial payments and payment plans for large invoices.',
                  duration: '8 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Late Payment Reminders',
                  description:
                    'Set up automated reminders to chase overdue invoices professionally.',
                  duration: '10 min',
                  difficulty: 'Beginner',
                  slug: '#',
                },
              ],
            },
            {
              category: 'Reports & Analytics',
              items: [
                {
                  title: 'Understanding Your Reports',
                  description:
                    'Make sense of your financial data with our comprehensive reporting tools.',
                  duration: '20 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Tax Preparation Guide',
                  description:
                    'Export the right data and reports for seamless tax filing.',
                  duration: '15 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Cash Flow Analysis',
                  description:
                    'Monitor your business cash flow and predict future income.',
                  duration: '18 min',
                  difficulty: 'Advanced',
                  slug: '#',
                },
              ],
            },
            {
              category: 'Advanced Settings',
              items: [
                {
                  title: 'API Integration Guide',
                  description:
                    'Connect VAYPR with your existing tools using our REST API.',
                  duration: '30 min',
                  difficulty: 'Advanced',
                  slug: '#',
                },
                {
                  title: 'Team & Permissions',
                  description:
                    'Set up team members with appropriate access levels and permissions.',
                  duration: '12 min',
                  difficulty: 'Intermediate',
                  slug: '#',
                },
                {
                  title: 'Webhooks & Automation',
                  description:
                    'Automate workflows by connecting VAYPR to Zapier, Make, and more.',
                  duration: '25 min',
                  difficulty: 'Advanced',
                  slug: '#',
                },
              ],
            },
          ],
          helpTitle: 'Need more help?',
          helpDescription:
            'Contact our support team if you need tailored walkthroughs for your workflow.',
        },
        enabled: true,
        showInFooter: true,
        order: 3,
      },
    ];

    for (const pageData of defaultPages) {
      const existingPage = await this.corporatePageModel.findOne({ type: pageData.type }).exec();
      if (!existingPage) {
        const page = new this.corporatePageModel(pageData);
        await page.save();
        continue;
      }

      const hasContent =
        existingPage.content &&
        typeof existingPage.content === 'object' &&
        Object.keys(existingPage.content).length > 0;

      if (!hasContent && pageData.content) {
        existingPage.content = pageData.content as any;
        await existingPage.save();
        continue;
      }

      if (
        existingPage.type === CorporatePageType.GUIDES &&
        pageData.content &&
        typeof existingPage.content === 'object'
      ) {
        const existingCategories = Array.isArray((existingPage.content as any).categories)
          ? (existingPage.content as any).categories
          : [];
        if (existingCategories.length < 6) {
          existingPage.content = {
            ...(pageData.content as any),
            ...(existingPage.content as any),
            categories: (pageData.content as any).categories,
          };
          await existingPage.save();
        }
      }
    }
  }

  // ==================== GUIDES METHODS ====================

  async createGuide(createGuideDto: CreateGuideDto): Promise<Guide> {
    const guide = new this.guideModel(createGuideDto);
    return guide.save();
  }

  async findAllGuides(publishedOnly?: boolean): Promise<Guide[]> {
    const filter: any = {};
    
    if (publishedOnly) {
      filter.published = true;
    }

    return this.guideModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneGuide(id: string): Promise<Guide> {
    const guide = await this.guideModel.findById(id).exec();

    if (!guide) {
      throw new NotFoundException(`Guide with ID ${id} not found`);
    }

    return guide;
  }

  async updateGuide(id: string, updateGuideDto: UpdateGuideDto): Promise<Guide> {
    const guide = await this.guideModel
      .findByIdAndUpdate(id, updateGuideDto, { new: true })
      .exec();

    if (!guide) {
      throw new NotFoundException(`Guide with ID ${id} not found`);
    }

    return guide;
  }

  async removeGuide(id: string): Promise<{ message: string }> {
    const result = await this.guideModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Guide with ID ${id} not found`);
    }

    return { message: 'Guide deleted successfully' };
  }

  async toggleGuidePublished(id: string): Promise<Guide> {
    const guide = await this.guideModel.findByIdAndUpdate(
      id, 
      [{ $set: { published: { $not: '$published' } } }], 
      { new: true, updatePipeline: true }
    ).exec();
    
    if (!guide) {
      throw new NotFoundException(`Guide with ID ${id} not found`);
    }
    
    return guide;
  }

  async incrementGuideDownloads(id: string): Promise<Guide> {
    const guide = await this.guideModel
      .findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true })
      .exec();

    if (!guide) {
      throw new NotFoundException(`Guide with ID ${id} not found`);
    }

    return guide;
  }
}
