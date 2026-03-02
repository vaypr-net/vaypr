import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
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
}

/**
 * Contact Controller
 * 
 * Handles contact form submissions from the /contact page
 */
@Controller('contact')
export class ContactController {
  private brevoApiKey: string;
  private brevoApiUrl = 'https://api.brevo.com/v3';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectModel(SuperAdminSettings.name) private superAdminSettingsModel: Model<SuperAdminSettings>,
  ) {
    // Get API key from environment variables
    this.brevoApiKey = this.configService.get('BREVO_API_KEY') as string;
    if (!this.brevoApiKey) {
      throw new Error('BREVO_API_KEY is not defined in environment variables');
    }
  }

  /**
   * Submit contact form
   * 
   * POST /contact/submit
   * Sends email to support team AND confirmation to user
   * 
   * Flow:
   * 1. User submits form from their email (user@example.com)
   * 2. Email sent TO: support@vaypr.net (with user's details)
   * 3. Confirmation email sent TO: user@example.com
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() contactFormDto: ContactFormDto) {
    const { name, email, mobile, subject, message } = contactFormDto;

    // Validate form data
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: 'Missing required fields: name, email, subject, message',
      };
    }

    try {
      // Get support email from super admin settings
      const settings = await this.superAdminSettingsModel.findOne().exec();
      const SUPPORT_EMAIL = settings?.supportEmail || process.env.SUPPORT_EMAIL || 'support@vaypr.net';
      
      const senderEmail = email; // Use user's email as sender

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

      // Send email to support team via Brevo (FROM: user's email with user's name)
      console.log(`[CONTACT] Sending email to support (${SUPPORT_EMAIL}) from ${senderEmail}...`);
      const supportEmailResponse = await this.sendEmailViaBrevo(
        senderEmail,
        SUPPORT_EMAIL,
        `[${subject.toUpperCase()}] ${name} - ${email}`,
        emailToSupport,
        name,  // Pass user's name as display name
      );
      console.log(`[CONTACT] Support email response:`, supportEmailResponse);

      // Send confirmation email to user (FROM: support email)
      console.log(`[CONTACT] Sending confirmation email to user (${email})...`);
      const userEmailResponse = await this.sendEmailViaBrevo(
        SUPPORT_EMAIL,
        email,
        'We received your message - VAYPR Support',
        emailToUser,
        'VAYPR Support',  // Use app name as display name for confirmation
      );
      console.log(`[CONTACT] User confirmation email response:`, userEmailResponse);

      console.log('Contact form emails sent successfully:', {
        senderEmail: email,
        senderName: name,
        subject: subject,
        supportEmail: SUPPORT_EMAIL,
      });

      return {
        success: true,
        message: `Your message has been received. A confirmation email has been sent to ${email}.`,
        data: {
          senderEmail: email,
          senderName: name,
          supportEmail: SUPPORT_EMAIL,
          subject: subject,
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

  /**
   * Send email via Brevo API
   */
  private async sendEmailViaBrevo(
    fromEmail: string,
    toEmail: string,
    subject: string,
    htmlContent: string,
    displayName: string = 'VAYPR',
  ): Promise<any> {
    try {
      console.log(`[BREVO] Preparing to send email from ${displayName} <${fromEmail}> to ${toEmail}`);
      
      const payload = {
        sender: {
          name: displayName,
          email: fromEmail,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      };

      console.log(`[BREVO] Payload:`, JSON.stringify(payload, null, 2));
      console.log(`[BREVO] API Key configured: ${this.brevoApiKey ? 'YES' : 'NO'}`);
      console.log(`[BREVO] API URL: ${this.brevoApiUrl}/smtp/email`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.brevoApiUrl}/smtp/email`, payload, {
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log(`[BREVO] ✅ Email sent successfully to ${toEmail}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[BREVO] ❌ Failed to send email to ${toEmail}`);
      console.error(`[BREVO] Error status:`, error.response?.status);
      console.error(`[BREVO] Error data:`, error.response?.data);
      console.error(`[BREVO] Error message:`, error.message);
      throw new Error(`Failed to send email via Brevo: ${error.response?.data?.message || error.message}`);
    }
  }
}
