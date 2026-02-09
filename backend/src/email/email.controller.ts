import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { EmailRouterService } from './email-router.service';
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
 * Email Controller
 * 
 * Routes emails to either Gmail or Brevo based on user configuration
 * - If user has brandingDomain → uses Brevo
 * - If user has no brandingDomain → uses Gmail
 */
@Controller('email')
export class EmailController {
  constructor(private readonly emailRouterService: EmailRouterService) {}

  /**
   * Send email via user's configured email service
   * 
   * POST /email/send
   * 
   * Automatically routes to Gmail or Brevo based on user's branding domain
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

    // Send email via appropriate service
    const result = await this.emailRouterService.sendEmail(
      userId,
      sendEmailDto.to,
      sendEmailDto.subject,
      sendEmailDto.body,
      sendEmailDto.attachmentData,
      sendEmailDto.attachmentFilename,
    );

    return result;
  }
}
