import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, UseInterceptors, UploadedFile } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmailRouterService } from './email-router.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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

  @IsOptional()
  @IsString()
  senderId?: string; // Optional sender ID from UserSender collection

  @IsOptional()
  @IsBoolean()
  useLoginEmailAsSender?: boolean; // If true, bypass sender chain and use login-email flow
}

/**
 * Email Controller
 * 
 * Routes emails to Gmail or Brevo based on:
 * 1. User-configured senders (if senderId provided)
 * 2. Primary/Secondary senders (if configured)
 * 3. Legacy fallback (brandingDomain + Gmail for backward compatibility)
 */
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailRouterService: EmailRouterService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Send email via user's configured email service
   * 
   * POST /email/send
   * 
   * NEW: Respects user-configured senders if available
   * LEGACY: Falls back to brandingDomain + Gmail for backward compatibility
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
      undefined, // replyTo
      sendEmailDto.senderId, // Pass the optional senderId
      sendEmailDto.useLoginEmailAsSender,
    );

    return result;
  }

  @Post('upload-logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }

    const result = await this.cloudinaryService.uploadImage(file, 'email-branding');
    return {
      success: true,
      message: 'Logo uploaded successfully',
      url: result?.secure_url || result?.url,
      publicId: result?.public_id,
    };
  }
}
