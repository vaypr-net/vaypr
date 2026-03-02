import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UserService } from '../user/user.service';
import { BrevoService } from '../brevo/brevo.service';

/**
 * Gmail Service
 * 
 * Handles sending emails from user's Gmail account using Gmail API
 * 
 * CRITICAL REQUIREMENTS:
 * - Emails MUST be sent as the authenticated user (from their Gmail)
 * - Uses OAuth2 with gmail.send permission
 * - Automatically refreshes access tokens using refresh token
 * - Never uses SMTP or spoofing
 * 
 * TOKEN MANAGEMENT:
 * - Access tokens expire in 1 hour
 * - Refresh tokens are long-lived (stored in DB)
 * - Automatically refreshes access token before API call if expired
 * 
 * SECURITY:
 * - Tokens never exposed to frontend
 * - All email sending happens server-side
 * - User consent required for Gmail permission
 */
@Injectable()
export class GmailService {
  private oauth2Client: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly brevoService: BrevoService,
  ) {
    // Initialize Google OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  /**
   * Refresh Google access token using refresh token
   * 
   * Google access tokens expire after 1 hour
   * This method gets a fresh access token using the stored refresh token
   * 
   * Returns: New access token and expiry time
   */
  private async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: Date }> {
    try {
      // Set the refresh token
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Get new access token
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Failed to refresh access token');
      }

      return {
        accessToken: credentials.access_token,
        expiryDate: new Date(credentials.expiry_date),
      };
    } catch (error) {
      // Token refresh failed - user may have revoked access
      throw new UnauthorizedException(
        'Failed to refresh Google access token. User may have revoked Gmail access. Please reconnect your Gmail account.',
      );
    }
  }

  /**
   * Get valid access token for user
   * 
   * CRITICAL LOGIC:
   * 1. Gmail sending requires ONLY a valid googleAccessToken
   * 2. googleRefreshToken is OPTIONAL (only needed for token refresh)
   * 3. If access token is valid → use it immediately
   * 4. If access token is expired:
   *    - If refresh token exists → refresh the access token
   *    - If refresh token missing → user must reconnect Google account
   * 
   * Returns: Valid access token
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    // Get user from database
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has connected Google account
    if (!user.googleAccessToken) {
      throw new UnauthorizedException(
        'Google account not connected. Please log in with Google to send emails.',
      );
    }

    // Check if access token is still valid
    const now = new Date();
    const tokenExpiry = user.googleTokenExpiry ? new Date(user.googleTokenExpiry) : null;

    // Access token is valid → use it
    if (tokenExpiry && tokenExpiry > now) {
      return user.googleAccessToken;
    }

    // Access token is expired → try to refresh it
    if (!user.googleRefreshToken) {
      // No refresh token → user must reconnect
      throw new UnauthorizedException(
        'Google session expired. Please reconnect your Google account to continue sending emails.',
      );
    }

    // Refresh the access token
    const { accessToken, expiryDate } = await this.refreshAccessToken(user.googleRefreshToken);

    // Update tokens in database
    await this.userService.updateGoogleTokens(userId, accessToken, expiryDate);

    return accessToken;
  }

  /**
   * Encode email in RFC 2822 format with optional PDF attachment
   * 
   * Gmail API requires emails to be in RFC 2822 format and base64url encoded
   * 
   * Supports:
   * - Plain HTML emails (no attachment)
   * - HTML emails with PDF attachment (multipart/mixed)
   */
  private encodeEmail(
    to: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
    replyTo?: string,
  ): string {
    // No attachment - simple HTML email
    if (!attachmentData || !attachmentFilename) {
      const email = [
        `To: ${to}`,
        ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        htmlBody,
      ].join('\n');

      return Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    // With attachment - multipart email
    const boundary = '----=_Part_' + Date.now();
    
    const email = [
      `To: ${to}`,
      ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
      '',
      `--${boundary}`,
      'Content-Type: application/pdf',
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachmentFilename}"`,
      '',
      attachmentData,
      '',
      `--${boundary}--`,
    ].join('\n');

    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send email from user's account
   * 
   * Supports two methods:
   * 1. Gmail API (if user has connected Google account)
   * 2. Brevo API (if user has verified custom domain)
   * 
   * Tries Gmail first if available, falls back to Brevo for users without Google connection
   * 
   * @param userId - User ID from JWT token
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param htmlBody - Email body (HTML format)
   * @param attachmentData - Base64 encoded PDF (optional)
   * @param attachmentFilename - PDF filename (optional)
   * @returns Success message
   */
  async sendEmailFromUser(
    userId: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
    replyTo?: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    // Get user data
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Try Gmail API first if user has Google connection
    if (user.googleAccessToken) {
      try {
        return await this.sendViaGmail(
          userId,
          to,
          subject,
          htmlBody,
          attachmentData,
          attachmentFilename,
          replyTo,
        );
      } catch (error) {
        // If Gmail fails with auth error, fallback to Brevo
        if (error instanceof UnauthorizedException) {
          console.log('[Email] Gmail auth failed, attempting Brevo fallback');
          // Continue to Brevo fallback logic below
        } else {
          // Other errors (not auth) should be thrown
          throw error;
        }
      }
    }

    // Fallback to Brevo if user has verified domains
    if (user.verifiedDomains && user.verifiedDomains.length > 0) {
      try {
        return await this.sendViaBrevo(
          user.verifiedDomains[0], // Use first verified domain as sender
          to,
          subject,
          htmlBody,
          attachmentData,
          attachmentFilename,
        );
      } catch (brevoError) {
        console.error('[Email] Brevo send failed:', brevoError);
        throw new InternalServerErrorException(
          'Failed to send email via Brevo. Please ensure your domain is verified.',
        );
      }
    }

    // No Gmail connection and no verified domains
    throw new UnauthorizedException(
      'Cannot send email: Please either connect your Google account or add a verified custom domain.',
    );
  }

  /**
   * Send email via Gmail API
   */
  private async sendViaGmail(
    userId: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
    replyTo?: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      // Get valid access token (automatically refreshes if expired)
      const accessToken = await this.getValidAccessToken(userId);

      // Set credentials for this request
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // Initialize Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Encode email in RFC 2822 format (with optional attachment)
      const encodedEmail = this.encodeEmail(
        to,
        subject,
        htmlBody,
        attachmentData,
        attachmentFilename,
        replyTo,
      );

      // Send email as the authenticated user
      const response = await gmail.users.messages.send({
        userId: 'me', // 'me' = authenticated user (sends from their Gmail)
        requestBody: {
          raw: encodedEmail,
        },
      });

      const attachmentMsg = attachmentFilename ? ` with attachment (${attachmentFilename})` : '';
      return {
        success: true,
        message: `Email sent successfully from your Gmail account${attachmentMsg}`,
        messageId: response.data.id || undefined,
      };
    } catch (error) {
      // Re-throw auth errors so fallback can be attempted
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Gmail API error
      console.error('Gmail API error:', error);
      throw new InternalServerErrorException(
        'Failed to send email via Gmail API. Please try again later.',
      );
    }
  }

  /**
   * Send email via Brevo API
   */
  private async sendViaBrevo(
    senderDomain: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachmentData?: string,
    attachmentFilename?: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      // Use a default sender like noreply@domain.com for custom domains
      const fromEmail = `noreply@${senderDomain}`;
      
      const result = await this.brevoService.sendEmail(
        fromEmail,
        to,
        subject,
        htmlBody,
        attachmentData,
        attachmentFilename,
      );

      const attachmentMsg = attachmentFilename ? ` with attachment (${attachmentFilename})` : '';
      return {
        success: result.success,
        message: `Email sent successfully from ${senderDomain}${attachmentMsg}`,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Brevo API error:', error);
      throw error;
    }
  }

  /**
   * Check if user has granted Gmail permission
   * 
   * Returns true if user has a Google access token (even without refresh token)
   * Access token alone is sufficient for Gmail sending
   */
  async hasGmailPermission(userId: string): Promise<boolean> {
    try {
      const user = await this.userService.findOne(userId);
      return !!(user?.googleAccessToken);
    } catch {
      return false;
    }
  }
}
