import { Injectable, BadRequestException } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { BrevoService } from '../brevo/brevo.service';
import { UserService } from '../user/user.service';

/**
 * Email Router Service
 * 
 * Routes emails to either Gmail or Brevo based on user's configuration:
 * - If user has brandingDomain set → use Brevo (from that domain)
 * - If user has no brandingDomain → use Gmail (from their Gmail address)
 */
@Injectable()
export class EmailRouterService {
  constructor(
    private readonly gmailService: GmailService,
    private readonly brevoService: BrevoService,
    private readonly userService: UserService,
  ) {}

  /**
   * Send email via appropriate service (Gmail or Brevo)
   * 
   * @param userId - User ID (from JWT)
   * @param toEmail - Recipient email
   * @param subject - Email subject
   * @param htmlBody - Email body (HTML)
   * @param attachmentData - Optional PDF attachment (base64)
   * @param attachmentFilename - Attachment filename
   */
  async sendEmail(
    userId: string,
    toEmail: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
  ): Promise<{ success: boolean; message: string; messageId?: string; sentVia: 'gmail' | 'brevo' }> {
    // Get user details
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    console.log(`[EmailRouter] User email: ${user.email}, brandingDomain: ${user.brandingDomain || 'NONE'}`);

    // If user has a verified branding domain → use Brevo ONLY (no Gmail fallback)
    if (user.brandingDomain && user.brandingDomain.trim() !== '') {
      console.log(`[EmailRouter] ✓ Sending via Brevo domain: ${user.brandingDomain}`);

      // Use user's own email address as sender (e.g., "ali@softwareforge.tech")
      const senderEmail = user.email;

      try {
        const result = await this.brevoService.sendEmail(
          senderEmail,
          toEmail,
          subject,
          htmlBody,
          attachmentData,
          attachmentFilename,
        );

        return {
          ...result,
          sentVia: 'brevo',
        };
      } catch (error) {
        console.error(`[EmailRouter] Brevo send failed:`, error.message);
        throw error; // Don't fallback to Gmail - fail if Brevo fails
      }
    }

    // No branding domain → use Gmail
    console.log(`[EmailRouter] ✗ No branding domain. Sending via Gmail`);

    const result = await this.gmailService.sendEmailFromUser(
      userId,
      toEmail,
      subject,
      htmlBody,
      attachmentData,
      attachmentFilename,
    );

    return {
      ...result,
      sentVia: 'gmail',
    };
  }
}
