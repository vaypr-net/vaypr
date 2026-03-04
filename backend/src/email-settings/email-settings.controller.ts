import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailSettingsService } from './email-settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateEmailSettingsDto, EmailSettingsResponseDto } from './dto/email-settings.dto';

/**
 * Email Settings Controller
 * 
 * Manages user-configurable email settings:
 * - Support inbox email (where contact forms deliver)
 * - Default sender (if null, uses primary->secondary sender resolution)
 * - Default reply-to (if sender doesn't have specific reply-to)
 */
@Controller('settings/email')
@UseGuards(JwtAuthGuard)
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  /**
   * Get current user's email settings (auto-creates if missing)
   */
  @Get()
  async getSettings(@Request() req): Promise<EmailSettingsResponseDto> {
    return this.emailSettingsService.getOrCreateSettings(req.user.userId);
  }

  /**
   * Update current user's email settings
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Request() req,
    @Body() updateEmailSettingsDto: UpdateEmailSettingsDto,
  ): Promise<EmailSettingsResponseDto> {
    return this.emailSettingsService.updateSettings(req.user.userId, updateEmailSettingsDto);
  }
}
