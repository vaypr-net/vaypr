import { Injectable, BadRequestException } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { BrevoService } from '../brevo/brevo.service';
import { UserService } from '../user/user.service';
import { SenderService } from '../sender/sender.service';
import { EmailSettingsService } from '../email-settings/email-settings.service';
import { UserSender } from '../sender/entities/user-sender.entity';

/**
 * Email Router Service
 * 
 * Routes emails via:
 * 1. EmailSettings.defaultSenderId (if senderId not provided)
 * 2. User-configured senders (Primary/Secondary)
 * 3. Legacy fallback: brandingDomain + Gmail (for backward compatibility)
 * 
 * Supported flows:
 * - If senderId provided: try selected → primary → secondary → legacy fallback
 * - If no senderId: try defaultSenderId (from settings) → primary → secondary → legacy fallback
 * - If no senders configured: use legacy fallback (brandingDomain/gmail)
 */
@Injectable()
export class EmailRouterService {
  constructor(
    private readonly gmailService: GmailService,
    private readonly brevoService: BrevoService,
    private readonly userService: UserService,
    private readonly senderService: SenderService,
    private readonly emailSettingsService: EmailSettingsService,
  ) {}

  private getDomainFromEmail(email: string): string | null {
    const parts = (email || '').toLowerCase().split('@');
    if (parts.length !== 2 || !parts[1]) {
      return null;
    }
    return parts[1].trim();
  }

  /**
   * Send email via appropriate service (Brevo/Gmail)
   * 
   * NEW: Supports sender selection
   * LEGACY: Falls back to brandingDomain + Gmail for backward compatibility
   * 
   * @param userId - User ID (from JWT)
   * @param toEmail - Recipient email
   * @param subject - Email subject
   * @param htmlBody - Email body (HTML)
   * @param attachmentData - Optional PDF attachment (base64)
   * @param attachmentFilename - Attachment filename
   * @param replyTo - Optional reply-to email
   * @param senderId - Optional sender ID (new feature)
   */
  async sendEmail(
    userId: string,
    toEmail: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
    replyTo?: string,
    senderId?: string,
    useLoginEmailAsSender: boolean = false,
  ): Promise<{ success: boolean; message: string; messageId?: string; sentVia: 'gmail' | 'brevo' }> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get user's email settings to apply defaults
    const settings = await this.emailSettingsService.getSettingsByUserId(userId);
    
    // If no explicit senderId but settings has defaultSenderId, use it
    const effectiveSenderId = senderId || (settings?.defaultSenderId?.toString() || undefined);
    
    // Determine reply-to: explicit parameter, or settings default, or sender's reply-to
    let effectiveReplyTo = replyTo || (settings?.defaultReplyToEmail || undefined);

    if (!useLoginEmailAsSender) {
      // Try new sender resolution chain if available
      try {
        const senders = await this.senderService.getResolutionChainWithSelected(userId, effectiveSenderId);

        if (senders.length > 0) {
          // Try each sender in the resolution chain
          for (const sender of senders) {
            try {
              if (sender.provider === 'brevo') {
                const result = await this.brevoService.sendEmail(
                  sender.email,
                  toEmail,
                  subject,
                  htmlBody,
                  attachmentData,
                  attachmentFilename,
                  {
                    senderName: sender.displayName,
                    replyTo: sender.replyToEmail || effectiveReplyTo,
                  },
                );

                console.log(
                  `[EmailRouter] Email sent via Brevo sender: ${sender.displayName} <${sender.email}>`,
                );

                return {
                  ...result,
                  sentVia: 'brevo',
                };
              } else if (sender.provider === 'gmail') {
                const result = await this.gmailService.sendEmailFromUser(
                  userId,
                  toEmail,
                  subject,
                  htmlBody,
                  attachmentData,
                  attachmentFilename,
                  sender.replyToEmail || effectiveReplyTo,
                );

                console.log(`[EmailRouter] Email sent via Gmail sender: ${sender.displayName}`);

                return {
                  ...result,
                  sentVia: 'gmail',
                };
              }
            } catch (error) {
              console.warn(
                `[EmailRouter] Failed with sender ${sender.email} (${sender.provider}):`,
                error.message,
              );
              // Continue to next sender
            }
          }
        }
      } catch (error) {
        console.warn('[EmailRouter] Sender resolution error:', error.message);
        // Fall through to legacy fallback
      }
    } else {
      console.log('[EmailRouter] Explicitly using login-email sender flow');
    }

    // LEGACY FALLBACK: Use brandingDomain + Gmail (backward compatibility)
    console.log('[EmailRouter] Using legacy fallback (brandingDomain + Gmail)');

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

    // Try Brevo with user's primary domain
    if (shouldTryBrevo) {
      try {
        const result = await this.brevoService.sendEmail(
          user.email,
          toEmail,
          subject,
          htmlBody,
          attachmentData,
          attachmentFilename,
          { replyTo: effectiveReplyTo },
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

    // Final fallback: Gmail
    console.log(`[EmailRouter] Sending via Gmail final fallback`);

    const result = await this.gmailService.sendEmailFromUser(
      userId,
      toEmail,
      subject,
      htmlBody,
      attachmentData,
      attachmentFilename,
      effectiveReplyTo,
    );

    return {
      ...result,
      sentVia: 'gmail',
    };
  }
}
