import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { CreateSuperadminSettingsDto } from './dto/create-superadmin-settings.dto';
import { UpdateSuperadminSettingsDto } from './dto/update-superadmin-settings.dto';
import { ChangePasswordDto } from '../common/dto/change-password.dto';
import { SuperAdminSettings } from './entities/superadmin-settings.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class SuperadminSettingsService {
  constructor(
    @InjectModel(SuperAdminSettings.name) private superAdminSettingsModel: Model<SuperAdminSettings>,
    private userService: UserService,
  ) {}

  private async buildDefaultSettings(userId: string) {
    const user = await this.userService.findOne(userId);
    const fullName = (user.fullName || '').trim();
    const [firstName = '', ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    return {
      userId: new Types.ObjectId(userId),
      firstName: firstName || 'Super',
      lastName: lastName || 'Admin',
      email: user.email,
      notifyNewSubscribers: true,
      notifyPaymentAlerts: true,
      notifySupportTickets: true,
      twoFactorEnabled: false,
    };
  }

  async create(userId: string, createDto: CreateSuperadminSettingsDto): Promise<SuperAdminSettings> {
    const existing = await this.superAdminSettingsModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (existing) {
      throw new ConflictException('Settings already exist');
    }

    const settings = new this.superAdminSettingsModel({
      ...createDto,
      userId: new Types.ObjectId(userId),
    });

    return settings.save();
  }

  async findByUserId(userId: string): Promise<SuperAdminSettings> {
    const userObjectId = new Types.ObjectId(userId);
    let settings = await this.superAdminSettingsModel.findOne({ userId: userObjectId }).exec();

    if (!settings) {
      const defaults = await this.buildDefaultSettings(userId);
      settings = await new this.superAdminSettingsModel(defaults).save();
    }

    return settings;
  }

  async update(userId: string, updateDto: UpdateSuperadminSettingsDto): Promise<SuperAdminSettings> {
    const defaults = await this.buildDefaultSettings(userId);
    const setOnInsert = Object.fromEntries(
      Object.entries(defaults).filter(([key]) => !(key in updateDto)),
    );

    const settings = await this.superAdminSettingsModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $set: updateDto,
          $setOnInsert: setOnInsert,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      )
      .exec();

    return settings;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const user = await this.userService.findByEmail((await this.userService.findOne(userId)).email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userService.update(userId, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  async aiChat(
    userId: string,
    userMessage: string,
    analyticsContext?: string,
  ): Promise<{ reply: string }> {
    const settings = await this.findByUserId(userId);

    // Use DB-stored key first, then fall back to Railway env variable
    const resolvedApiKey = settings.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();

    if (!resolvedApiKey) {
      throw new BadRequestException(
        'No OpenAI API key configured. Please add your API key in the AI Provider Settings and save it, or set OPENAI_API_KEY in your environment variables.',
      );
    }

    const defaultSystemPrompt =
      'You are a financial analyst assistant. Analyze subscription metrics, revenue trends, churn, and subscriber growth. Provide actionable insights and flag concerning trends.';

    const systemPrompt = settings.systemPrompt?.trim() || defaultSystemPrompt;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (analyticsContext) {
      messages.push({
        role: 'system',
        content: `Current platform analytics data:\n${analyticsContext}`,
      });
    }

    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${resolvedApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const reply: string =
        response.data?.choices?.[0]?.message?.content ?? 'No response from AI.';

      return { reply };
    } catch (err: any) {
      // Surface the real OpenAI error message instead of a generic 500
      const openAiMessage: string =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'OpenAI request failed';
      const errorCode: string = err?.response?.data?.error?.code || '';
      const status: number = err?.response?.status;

      if (status === 401) {
        throw new BadRequestException(`Invalid OpenAI API key. Please check your key and save it again.`);
      }
      if (status === 429) {
        if (errorCode === 'insufficient_quota') {
          throw new BadRequestException(
            `Your OpenAI account has no remaining credits. Please add billing details at platform.openai.com and try again.`,
          );
        }
        throw new BadRequestException(
          `OpenAI rate limit reached. Please wait a moment and try again.`,
        );
      }
      throw new BadRequestException(`AI request failed: ${openAiMessage}`);
    }
  }
}
