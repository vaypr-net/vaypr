import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailSettings } from './entities/email-settings.entity';
import { User } from '../user/entities/user.entity';
import { UserSender } from '../sender/entities/user-sender.entity';
import { UpdateEmailSettingsDto, EmailSettingsResponseDto } from './dto/email-settings.dto';

@Injectable()
export class EmailSettingsService {
  constructor(
    @InjectModel(EmailSettings.name) private emailSettingsModel: Model<EmailSettings>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSender.name) private userSenderModel: Model<UserSender>,
  ) {}

  /**
   * Get email settings for user (auto-create if missing)
   */
  async getOrCreateSettings(userId: string): Promise<EmailSettingsResponseDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Try to find existing settings
    let settings = await this.emailSettingsModel.findOne({
      ownerId: userObjectId,
    });

    // If not found, create default row with supportInboxEmail = user's email
    if (!settings) {
      const user = await this.userModel.findById(userObjectId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      settings = await this.emailSettingsModel.create({
        ownerId: userObjectId,
        supportInboxEmail: user.email, // Default to user's email
        supportInboxName: 'Support Inbox',
        // Leave defaultSenderId, defaultReplyToEmail, defaultReplyToName unset (undefined)
      });
    }

    return this.toResponseDto(settings);
  }

  /**
   * Update email settings
   */
  async updateSettings(
    userId: string,
    dto: UpdateEmailSettingsDto,
  ): Promise<EmailSettingsResponseDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Ensure settings exist
    let settings = await this.emailSettingsModel.findOne({
      ownerId: userObjectId,
    });

    if (!settings) {
      // Auto-create if missing
      return this.getOrCreateSettings(userId);
    }

    // Validate supportInboxEmail if provided
    if (dto.supportInboxEmail !== undefined) {
      if (!this.isValidEmail(dto.supportInboxEmail)) {
        throw new BadRequestException('Invalid support inbox email');
      }
      settings.supportInboxEmail = dto.supportInboxEmail.toLowerCase();
    }

    // Update optional fields
    if (dto.supportInboxName !== undefined) {
      settings.supportInboxName = dto.supportInboxName;
    }

    // Validate defaultSenderId if provided
    if (dto.defaultSenderId !== undefined) {
      if (dto.defaultSenderId === null) {
        // Explicitly clear default sender
        settings.defaultSenderId = undefined;
      } else {
        // Validate sender exists, belongs to user, and is active/verified
        const sender = await this.userSenderModel.findOne({
          _id: new Types.ObjectId(dto.defaultSenderId),
          userId: userObjectId,
        });

        if (!sender) {
          throw new BadRequestException('Sender not found');
        }

        if (sender.status !== 'active') {
          throw new BadRequestException('Only active senders can be set as default');
        }

        if (!sender.verified) {
          throw new BadRequestException('Only verified senders can be set as default');
        }

        settings.defaultSenderId = sender._id;
      }
    }

    // Validate defaultReplyToEmail if provided
    if (dto.defaultReplyToEmail !== undefined) {
      if (dto.defaultReplyToEmail === null) {
        // Remove the field
        settings.defaultReplyToEmail = undefined;
      } else {
        if (!this.isValidEmail(dto.defaultReplyToEmail)) {
          throw new BadRequestException('Invalid default reply-to email');
        }
        settings.defaultReplyToEmail = dto.defaultReplyToEmail.toLowerCase();
      }
    }

    if (dto.defaultReplyToName !== undefined) {
      settings.defaultReplyToName = dto.defaultReplyToName === null ? undefined : dto.defaultReplyToName;
    }

    settings.updatedAt = new Date();
    await settings.save();

    return this.toResponseDto(settings);
  }

  /**
   * Get settings by userId (returns null if not found, unlike getOrCreate)
   */
  async getSettingsByUserId(userId: string): Promise<EmailSettings | null> {
    return this.emailSettingsModel.findOne({
      ownerId: new Types.ObjectId(userId),
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(settings: EmailSettings): EmailSettingsResponseDto {
    return {
      id: settings._id.toString(),
      ownerId: settings.ownerId.toString(),
      supportInboxEmail: settings.supportInboxEmail,
      supportInboxName: settings.supportInboxName,
      defaultSenderId: settings.defaultSenderId?.toString() || null,
      defaultReplyToEmail: settings.defaultReplyToEmail,
      defaultReplyToName: settings.defaultReplyToName,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
