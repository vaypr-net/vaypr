import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GmailService } from '../gmail/gmail.service';
import { BrevoService } from '../brevo/brevo.service';
import { UserService } from '../user/user.service';
import { SenderService } from '../sender/sender.service';
import { EmailSettingsService } from '../email-settings/email-settings.service';
import { UserSender } from '../sender/entities/user-sender.entity';
import { BrevoDomain } from '../brevo/entities/brevo.entity';

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
    @InjectModel(BrevoDomain.name) private readonly brevoDomainModel: Model<BrevoDomain>,
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
    fromEmailOverride?: string,
    senderNameOverride?: string,
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
                    senderName: senderNameOverride || sender.displayName,
                    replyTo: replyTo || sender.replyToEmail || effectiveReplyTo,
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
                  replyTo || sender.replyToEmail || effectiveReplyTo,
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

    const fromEmail = (fromEmailOverride || user.email || '').trim().toLowerCase();
    const emailDomain = this.getDomainFromEmail(fromEmail);
    const brandingDomain = user.brandingDomain?.trim().toLowerCase() || '';
    let verifiedDomains = (user.verifiedDomains || []).map((d) => d.trim().toLowerCase());

    // If the user has no verifiedDomains on their record, fall back to any globally
    // verified Brevo domain (e.g. when the SuperAdmin account hasn't stored domains locally)
    if (verifiedDomains.length === 0) {
      const globalDomain = await this.brevoDomainModel
        .findOne({ status: 'VERIFIED' })
        .sort({ createdAt: 1 })
        .lean();
      if (globalDomain) {
        verifiedDomains = [globalDomain.domain.trim().toLowerCase()];
        console.log(`[EmailRouter] Using global verified Brevo domain: ${globalDomain.domain}`);
      }
    }

    // Smart domain resolution:
    // 1. If user's email domain is verified, use it
    // 2. Otherwise use first verified domain (if any)
    // 3. Otherwise try Gmail
    let brevoFromEmail = fromEmail;
    let shouldTryBrevo = false;

    if (emailDomain && verifiedDomains.includes(emailDomain)) {
      // User's email domain is verified - use it
      shouldTryBrevo = true;
      brevoFromEmail = fromEmail;
    } else if (brandingDomain && verifiedDomains.includes(brandingDomain)) {
      // Use brandingDomain if verified
      shouldTryBrevo = true;
      const localPart = fromEmail.split('@')[0] || 'noreply';
      brevoFromEmail = `${localPart}@${brandingDomain}`;
    } else if (verifiedDomains.length > 0) {
      // Use first verified domain (construct email from it)
      shouldTryBrevo = true;
      const localPart = fromEmail.split('@')[0] || 'noreply';
      brevoFromEmail = `${localPart}@${verifiedDomains[0]}`;
    }

    console.log(
      `[EmailRouter] User email: ${fromEmail}, brandingDomain: ${brandingDomain || 'NONE'}, emailDomain: ${emailDomain || 'NONE'}, verifiedDomains: ${verifiedDomains.join(', ') || 'NONE'}, shouldTryBrevo: ${shouldTryBrevo}, brevoFromEmail: ${brevoFromEmail}`,
    );

    // Try Brevo with user's verified domain
    if (shouldTryBrevo) {
      try {
        const result = await this.brevoService.sendEmail(
          brevoFromEmail,
          toEmail,
          subject,
          htmlBody,
          attachmentData,
          attachmentFilename,
          { replyTo: effectiveReplyTo, senderName: senderNameOverride || undefined },
        );

        console.log(`[EmailRouter] Email sent successfully via Brevo from ${brevoFromEmail}`);
        return {
          ...result,
          sentVia: 'brevo',
        };
      } catch (error) {
        console.error(`[EmailRouter] Brevo send failed for ${brevoFromEmail}:`, error.message);
        console.log('[EmailRouter] Will try Gmail fallback...');
        // Continue to Gmail fallback below (don't throw immediately)
      }
    }

    // Final fallback: Gmail (if user has Google account connected)
    if (user.googleAccessToken) {
      console.log(`[EmailRouter] Sending via Gmail fallback`);

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

    // No valid email sending method available
    throw new BadRequestException(
      'Unable to send email. Please either verify a custom domain in Brevo or connect your Google account in Settings.',
    );
  }
}
