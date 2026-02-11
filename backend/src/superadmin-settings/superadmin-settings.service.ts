import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateSuperadminSettingsDto } from './dto/create-superadmin-settings.dto';
import { UpdateSuperadminSettingsDto } from './dto/update-superadmin-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
}
