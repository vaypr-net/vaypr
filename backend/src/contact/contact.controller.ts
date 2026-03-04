import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailSettingsService } from '../email-settings/email-settings.service';
import { EmailRouterService } from '../email/email-router.service';
import { UserService } from '../user/user.service';
import { SuperAdminSettings } from '../superadmin-settings/entities/superadmin-settings.entity';

/**
 * DTO for contact form submission
 */
export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsMongoId()
  @IsOptional()
  ownerId?: string; // Optional: which user/tenant this contact form is for
}

/**
 * Contact Controller
 * 
 * Handles contact form submissions from the /contact page.
 * Now uses DB-based EmailSettings instead of environment variables.
 */
@Controller('contact')
export class ContactController {
  constructor(
    @InjectModel(SuperAdminSettings.name) private superAdminSettingsModel: Model<SuperAdminSettings>,
    private readonly emailSettingsService: EmailSettingsService,
    private readonly emailRouterService: EmailRouterService,
    private readonly userService: UserService,
  ) {}

  /**
   * Submit contact form
   * 
   * POST /contact/submit
   * Sends email to support inbox AND confirmation to user
   * Uses EmailSettings.supportInboxEmail instead of env vars
   * Uses EmailRouter with proper sender resolution instead of direct Brevo call
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() contactFormDto: ContactFormDto) {
    const { name, email, mobile, subject, message, ownerId } = contactFormDto;

    // Validate form data
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: 'Missing required fields: name, email, subject, message',
      };
    }

    try {
      // Determine which user/tenant to send to
      let targetOwnerId = ownerId;

      if (!targetOwnerId) {
        // If no owner specified, try to get from config or SuperAdmin
        // For now, require ownerId to be specified for proper email routing
        return {
          success: false,
          message: 'Contact form configuration error. Please contact support directly.',
        };
      }

      // Load email settings for target owner
      const emailSettings = await this.emailSettingsService.getSettingsByUserId(targetOwnerId);

      if (!emailSettings) {
        return {
          success: false,
          message: 'Support inbox not configured. Please try again later.',
        };
      }

      const supportInboxEmail = emailSettings.supportInboxEmail;

      if (!supportInboxEmail) {
        return {
          success: false,
          message: 'Support inbox email not configured. Please contact support directly.',
        };
      }

      // Verify owner exists
      const owner = await this.userService.findOne(targetOwnerId);
      if (!owner) {
        return {
          success: false,
          message: 'Invalid contact form configuration.',
        };
      }

      // Email to support team
      const emailToSupport = `
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${mobile ? `<p><strong>Mobile:</strong> ${mobile}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>This is an automated message from your VAYPR contact form</small></p>
      `;

      // Confirmation email to user
      const emailToUser = `
        <h2>Thank you for contacting VAYPR</h2>
        <p>Hi ${name},</p>
        <p>We received your message and will get back to you within 24 hours.</p>
        <hr>
        <p><strong>Your Message:</strong></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>VAYPR Support Team</p>
      `;

      // Send email to support team via EmailRouter with Reply-To = submitter's email
      console.log(`[CONTACT] Sending email to support (${supportInboxEmail}) from configured sender...`);
      const supportEmailResponse = await this.emailRouterService.sendEmail(
        targetOwnerId,
        supportInboxEmail,
        `[${subject.toUpperCase()}] ${name} - ${email}`,
        emailToSupport,
        undefined, // attachmentData
        undefined, // attachmentFilename
        email, // ✅ Reply-To: form submitter's email
        undefined, // senderId: use defaults from settings
      );
      console.log(`[CONTACT] Support email response:`, supportEmailResponse);

      // Send confirmation email to user via EmailRouter
      console.log(`[CONTACT] Sending confirmation email to user (${email})...`);
      const userEmailResponse = await this.emailRouterService.sendEmail(
        targetOwnerId,
        email,
        'We received your message - VAYPR Support',
        emailToUser,
        undefined,
        undefined,
        supportInboxEmail, // Reply-To: support inbox
        undefined,
      );
      console.log(`[CONTACT] User confirmation email response:`, userEmailResponse);

      console.log('Contact form emails sent successfully:', {
        submitterEmail: email,
        submitterName: name,
        supportInboxEmail,
        subject,
      });

      return {
        success: true,
        message: `Your message has been received. A confirmation email has been sent to ${email}.`,
        data: {
          submitterEmail: email,
          submitterName: name,
          supportInboxEmail,
          subject,
        },
      };
    } catch (error: any) {
      console.error('[CONTACT] ❌ Contact form submission error:', error.message);
      console.error('[CONTACT] Full error:', error);
      return {
        success: false,
        message: 'Failed to submit contact form. ' + error.message,
        error: error.message,
      };
    }
  }
}

