import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSupportPageDto } from './dto/create-support-page.dto';
import { UpdateSupportPageDto } from './dto/update-support-page.dto';
import { SupportPage, SupportPageDocument, PageType } from './entities/support-page.entity';

@Injectable()
export class SupportPagesService {
  constructor(
    @InjectModel(SupportPage.name)
    private supportPageModel: Model<SupportPageDocument>,
  ) {}

  async create(createSupportPageDto: CreateSupportPageDto): Promise<SupportPage> {
    // Check if page with same slug already exists
    const existingPage = await this.supportPageModel.findOne({ slug: createSupportPageDto.slug }).exec();
    if (existingPage) {
      throw new ConflictException(`Page with slug '${createSupportPageDto.slug}' already exists`);
    }

    const page = new this.supportPageModel(createSupportPageDto);
    return page.save();
  }

  async findAll(enabledOnly?: boolean): Promise<SupportPage[]> {
    const filter: any = {};
    
    if (enabledOnly) {
      filter.enabled = true;
    }

    return this.supportPageModel
      .find(filter)
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SupportPage> {
    const page = await this.supportPageModel.findById(id).exec();

    if (!page) {
      throw new NotFoundException(`Support page with ID ${id} not found`);
    }

    return page;
  }

  async findBySlug(slug: string): Promise<SupportPage> {
    const page = await this.supportPageModel.findOne({ slug, enabled: true }).exec();

    if (!page) {
      throw new NotFoundException(`Page '${slug}' not found`);
    }

    return page;
  }

  async findByType(type: PageType): Promise<SupportPage> {
    const page = await this.supportPageModel.findOne({ type }).exec();

    if (!page) {
      throw new NotFoundException(`Page of type '${type}' not found`);
    }

    return page;
  }

  async update(id: string, updateSupportPageDto: UpdateSupportPageDto): Promise<SupportPage> {
    // Ensure slug is never updated to preserve page route
    // @ts-ignore - slug should never be in updateSupportPageDto, but just in case
    const { slug, ...safeUpdateData } = { ...updateSupportPageDto };

    const page = await this.supportPageModel
      .findByIdAndUpdate(id, safeUpdateData, { new: true })
      .exec();

    if (!page) {
      throw new NotFoundException(`Support page with ID ${id} not found`);
    }

    return page;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.supportPageModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Support page with ID ${id} not found`);
    }

    return { message: 'Support page deleted successfully' };
  }

  async toggleEnabled(id: string): Promise<SupportPage> {
    const page = await this.supportPageModel.findById(id).exec();
    
    if (!page) {
      throw new NotFoundException(`Support page with ID ${id} not found`);
    }
    
    page.enabled = !page.enabled;
    return page.save();
  }

  async toggleFooterVisibility(id: string): Promise<SupportPage> {
    const page = await this.supportPageModel.findById(id).exec();
    
    if (!page) {
      throw new NotFoundException(`Support page with ID ${id} not found`);
    }
    
    page.showInFooter = !page.showInFooter;
    return page.save();
  }

  /**
   * Initialize default support pages if they don't exist
   */
  async initializeDefaultPages(): Promise<void> {
    const defaultPages = [
      {
        slug: 'contact',
        title: 'Contact Us',
        type: PageType.CONTACT,
        metaDescription: 'Get in touch with the VAYPR team. We\'re here to help!',
        icon: 'Mail',
        sections: [
          {
            title: 'Get in Touch',
            content: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
            order: 1,
          },
          {
            title: 'Email',
            content: 'support@vaypr.com',
            order: 2,
          },
        ],
        contactFormSettings: {
          enabled: true,
          recipientEmail: 'support@vaypr.com',
          subjectOptions: ['General Inquiry', 'Technical Support', 'Billing Question', 'Partnership'],
          responseMessage: 'Thank you for contacting us! We typically respond within 24 hours.',
        },
        enabled: true,
        showInFooter: true,
        order: 1,
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        type: PageType.PRIVACY,
        metaDescription: 'Learn how VAYPR collects, uses, and protects your data.',
        icon: 'Shield',
        sections: [
          {
            title: 'Introduction',
            content: 'At VAYPR, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.',
            order: 1,
          },
          {
            title: 'Information We Collect',
            content: 'We collect information that you provide directly to us, including:\n- Name and contact information\n- Business details\n- Payment information\n- Usage data and analytics',
            order: 2,
          },
          {
            title: 'How We Use Your Information',
            content: 'We use your information to:\n- Provide and improve our services\n- Process your transactions\n- Send you updates and notifications\n- Ensure security and prevent fraud',
            order: 3,
          },
          {
            title: 'Data Security',
            content: 'We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits.',
            order: 4,
          },
          {
            title: 'Your Rights',
            content: 'You have the right to:\n- Access your personal data\n- Request corrections or deletions\n- Opt out of marketing communications\n- Export your data',
            order: 5,
          },
          {
            title: 'Contact Us',
            content: 'If you have questions about this Privacy Policy, please contact us at privacy@vaypr.com',
            order: 6,
          },
        ],
        enabled: true,
        showInFooter: true,
        order: 2,
      },
      {
        slug: 'refund',
        title: 'Refund Policy',
        type: PageType.REFUND,
        metaDescription: 'Understand VAYPR\'s refund and cancellation policies.',
        icon: 'RefreshCcw',
        sections: [
          {
            title: 'Refund Eligibility',
            content: 'We offer refunds under the following conditions:\n- Subscription cancellations within 14 days of initial purchase\n- Technical issues that prevent you from using our service\n- Duplicate payments or billing errors',
            order: 1,
          },
          {
            title: 'Subscription Cancellations',
            content: 'You may cancel your subscription at any time. Your access will continue until the end of your current billing period. No refunds are provided for partial billing periods.',
            order: 2,
          },
          {
            title: 'How to Request a Refund',
            content: 'To request a refund:\n1. Contact our support team at billing@vaypr.com\n2. Provide your account details and reason for refund\n3. Allow 5-7 business days for processing\n4. Refunds will be issued to your original payment method',
            order: 3,
          },
          {
            title: 'Exceptions',
            content: 'Refunds are not available for:\n- Annual subscriptions after 14 days\n- Add-on services or custom development\n- Third-party integrations or services',
            order: 4,
          },
          {
            title: 'Chargebacks',
            content: 'Please contact us before initiating a chargeback. Chargebacks may result in account suspension and additional fees.',
            order: 5,
          },
          {
            title: 'Questions',
            content: 'For questions about refunds or billing, please contact billing@vaypr.com',
            order: 6,
          },
        ],
        enabled: true,
        showInFooter: true,
        order: 3,
      },
      {
        slug: 'terms',
        title: 'Terms of Service',
        type: PageType.TERMS,
        metaDescription: 'Read VAYPR\'s Terms of Service and understand our service agreement.',
        icon: 'FileText',
        sections: [
          {
            title: 'Acceptance of Terms',
            content: 'By accessing and using VAYPR, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.',
            order: 1,
          },
          {
            title: 'Use of Service',
            content: 'VAYPR provides invoicing and business management tools. You agree to:\n- Use the service only for lawful purposes\n- Not attempt to gain unauthorized access to our systems\n- Not use the service to transmit harmful content\n- Maintain the security of your account credentials',
            order: 2,
          },
          {
            title: 'Account Responsibilities',
            content: 'You are responsible for:\n- Maintaining accurate account information\n- All activities that occur under your account\n- Notifying us of any unauthorized use\n- Complying with all applicable laws and regulations',
            order: 3,
          },
          {
            title: 'Subscription and Billing',
            content: 'Subscription fees are billed in advance on a monthly or annual basis. You agree to provide accurate billing information and authorize us to charge your payment method. Fees are non-refundable except as stated in our Refund Policy.',
            order: 4,
          },
          {
            title: 'Intellectual Property',
            content: 'VAYPR and its content are protected by copyright, trademark, and other laws. You retain ownership of your data, but grant us the right to use it to provide our services. We retain all rights to the VAYPR platform and software.',
            order: 5,
          },
          {
            title: 'Data and Privacy',
            content: 'We collect and process your data as described in our Privacy Policy. You are responsible for the accuracy and legality of data you upload to our service.',
            order: 6,
          },
          {
            title: 'Service Availability',
            content: 'We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications without prior notice.',
            order: 7,
          },
          {
            title: 'Termination',
            content: 'We may suspend or terminate your account if you violate these terms. You may cancel your subscription at any time through your account settings. Upon termination, you will lose access to your account and data.',
            order: 8,
          },
          {
            title: 'Limitation of Liability',
            content: 'VAYPR is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.',
            order: 9,
          },
          {
            title: 'Changes to Terms',
            content: 'We reserve the right to modify these terms at any time. We will notify you of significant changes via email or through the service. Continued use after changes constitutes acceptance.',
            order: 10,
          },
          {
            title: 'Governing Law',
            content: 'These terms are governed by the laws of Kuwait. Any disputes will be resolved in the courts of Kuwait.',
            order: 11,
          },
          {
            title: 'Contact Information',
            content: 'For questions about these Terms of Service, please contact us at legal@vaypr.com',
            order: 12,
          },
        ],
        enabled: true,
        showInFooter: true,
        order: 4,
      },
    ];

    for (const pageData of defaultPages) {
      const existingPage = await this.supportPageModel.findOne({ type: pageData.type }).exec();
      if (!existingPage) {
        const page = new this.supportPageModel(pageData);
        await page.save();
      }
    }
  }
}
