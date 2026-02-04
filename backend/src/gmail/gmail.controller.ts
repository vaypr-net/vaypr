import { Controller, Post, Body, UseGuards, Request, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { GmailService } from './gmail.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * DTO for sending email
 */
class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  attachmentData?: string; // Base64 encoded PDF

  @IsOptional()
  @IsString()
  attachmentFilename?: string; // e.g., "Invoice_480.pdf"
}

/**
 * Gmail Controller
 * 
 * Handles email sending via Gmail API
 * User must be authenticated with JWT
 * Email is sent from user's Gmail account (not service account)
 */
@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  /**
   * Send email from user's Gmail account
   * 
   * POST /gmail/send
   * 
   * Request body:
   * {
   *   "to": "recipient@example.com",
   *   "subject": "Email subject",
   *   "body": "<html><body>Email content</body></html>"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Email sent successfully from your Gmail account",
   *   "messageId": "18d5c8a2f3b4e9c1"
   * }
   * 
   * IMPORTANT:
   * - User must have granted Gmail permission (gmail.send scope)
   * - Email sender will be the authenticated user's Gmail address
   * - Uses JWT authentication to identify user
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Request() req,
    @Body() sendEmailDto: SendEmailDto,
  ) {
    const userId = req.user.userId;

    // Validate request body
    if (!sendEmailDto.to || !sendEmailDto.subject || !sendEmailDto.body) {
      return {
        success: false,
        message: 'Missing required fields: to, subject, body',
      };
    }

    // Send email from user's Gmail
    const result = await this.gmailService.sendEmailFromUser(
      userId,
      sendEmailDto.to,
      sendEmailDto.subject,
      sendEmailDto.body,
      sendEmailDto.attachmentData,
      sendEmailDto.attachmentFilename,
    );

    return result;
  }

  /**
   * Check if user has granted Gmail permission
   * 
   * GET /gmail/status
   * 
   * Response:
   * {
   *   "hasPermission": true
   * }
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async checkGmailStatus(@Request() req) {
    const userId = req.user.userId;
    const hasPermission = await this.gmailService.hasGmailPermission(userId);

    return {
      hasPermission,
      message: hasPermission
        ? 'Gmail permission granted'
        : 'Gmail permission not granted. Please log in with Google.',
    };
  }
}
