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

  private getDomainFromEmail(email: string): string | null {
    const parts = (email || '').toLowerCase().split('@');
    if (parts.length !== 2 || !parts[1]) {
      return null;
    }
    return parts[1].trim();
  }

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

    const emailDomain = this.getDomainFromEmail(user.email);
    const brandingDomain = user.brandingDomain?.trim().toLowerCase() || '';
    const verifiedDomains = (user.verifiedDomains || []).map((d) => d.trim().toLowerCase());

    const shouldTryBrevo =
      !!brandingDomain ||
      (!!emailDomain && verifiedDomains.includes(emailDomain)) ||
      !!emailDomain;

    console.log(
      `[EmailRouter] User email: ${user.email}, brandingDomain: ${brandingDomain || 'NONE'}, emailDomain: ${emailDomain || 'NONE'}`,
    );

    // Prefer Brevo for custom-domain style users.
    if (shouldTryBrevo) {
      try {
        const result = await this.brevoService.sendEmail(
          user.email,
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
        console.error(`[EmailRouter] Brevo send failed for ${user.email}:`, error.message);
        // If Brevo fails but user has Gmail connected, fallback to Gmail.
        if (!user.googleAccessToken) {
          throw new BadRequestException(
            'Failed to send via custom domain. Verify your Brevo domain DNS/authentication or connect Google account.',
          );
        }
      }
    }

    // Fallback to Gmail
    console.log(`[EmailRouter] Sending via Gmail fallback`);

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
