import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSender, SenderProvider, SenderStatus } from './entities/user-sender.entity';
import { CreateSenderDto, UpdateSenderDto, SenderResponseDto } from './dto/sender.dto';
import { User } from '../user/entities/user.entity';
import { BrevoDomain } from '../brevo/entities/brevo.entity';

@Injectable()
export class SenderService {
  constructor(
    @InjectModel(UserSender.name) private userSenderModel: Model<UserSender>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BrevoDomain.name) private brevoDomainModel: Model<BrevoDomain>,
  ) {}

  /**
   * List all active senders for a user, sorted by priority
   */
  async listUserSenders(userId: string): Promise<SenderResponseDto[]> {
    const senders = await this.userSenderModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .sort({ priority: 1, createdAt: 1 })
      .exec();

    return senders.map((s) => this.toResponseDto(s));
  }

  /**
   * Get all senders for a user (including inactive)
   */
  async getAllUserSenders(userId: string): Promise<SenderResponseDto[]> {
    const senders = await this.userSenderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ priority: 1, createdAt: 1 })
      .exec();

    return senders.map((s) => this.toResponseDto(s));
  }

  /**
   * Create a new sender
   */
  async createSender(userId: string, dto: CreateSenderDto): Promise<SenderResponseDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Check if sender with same email already exists
    const existing = await this.userSenderModel.findOne({
      userId: userObjectId,
      email: dto.email.toLowerCase(),
    });

    if (existing) {
      throw new BadRequestException(`Sender email ${dto.email} already exists for this user`);
    }

    // Validate based on provider
    let verified = false;
    if (dto.provider === 'brevo') {
      // Extract domain from email
      const domain = dto.email.split('@')[1];
      if (!domain) {
        throw new BadRequestException('Invalid email format');
      }

      // Multi-account support: any globally verified domain can be used for sender creation.
      // Domain ownership is not restricted at sender level.
      const brevoDomain = await this.brevoDomainModel.findOne({
        domain: domain.toLowerCase(),
      });

      if (!brevoDomain) {
        throw new BadRequestException(
          `Domain ${domain} is not found in Brevo domains. Add it first in Domains settings.`,
        );
      }

      // Sender can be created for user-owned domain; mark verified only when domain is verified.
      verified = brevoDomain.status === 'VERIFIED';

      // Keep user's verifiedDomains in sync for provider detection.
      if (verified) {
        await this.userModel.findByIdAndUpdate(userObjectId, {
          $addToSet: { verifiedDomains: domain.toLowerCase() },
        });
      }
    } else if (dto.provider === 'gmail') {
      // Check if user has Gmail connected
      const user = await this.userModel.findById(userObjectId);
      if (!user?.googleAccessToken && !user?.googleRefreshToken) {
        throw new BadRequestException('Gmail not connected. Please connect your Google account first.');
      }

      verified = true;
    }

    const newSender = await this.userSenderModel.create({
      userId: userObjectId,
      email: dto.email.toLowerCase(),
      displayName: dto.displayName,
      provider: dto.provider,
      replyToEmail: dto.replyToEmail?.toLowerCase(),
      replyToName: dto.replyToName,
      verified,
      status: 'active',
      priority: null,
    });

    return this.toResponseDto(newSender);
  }

  /**
   * Update sender
   */
  async updateSender(
    userId: string,
    senderId: string,
    dto: UpdateSenderDto,
  ): Promise<SenderResponseDto> {
    const sender = await this.userSenderModel.findOne({
      _id: new Types.ObjectId(senderId),
      userId: new Types.ObjectId(userId),
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (dto.displayName) {
      sender.displayName = dto.displayName;
    }

    if (dto.replyToEmail !== undefined) {
      sender.replyToEmail = dto.replyToEmail?.toLowerCase();
    }

    if (dto.replyToName !== undefined) {
      sender.replyToName = dto.replyToName;
    }

    sender.updatedAt = new Date();
    await sender.save();

    return this.toResponseDto(sender);
  }

  /**
   * Set sender as primary (and clear any existing primary)
   */
  async setPrimary(userId: string, senderId: string): Promise<SenderResponseDto> {
    const userObjectId = new Types.ObjectId(userId);
    const senderObjectId = new Types.ObjectId(senderId);

    const sender = await this.userSenderModel.findOne({
      _id: senderObjectId,
      userId: userObjectId,
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (!sender.verified) {
      throw new BadRequestException('Only verified senders can be set as primary');
    }

    if (sender.status !== 'active') {
      throw new BadRequestException('Only active senders can be set as primary');
    }

    // Clear any existing primary for this user
    await this.userSenderModel.updateMany(
      { userId: userObjectId, priority: 1 },
      { priority: null },
    );

    // Set this sender as primary
    sender.priority = 1;
    sender.updatedAt = new Date();
    await sender.save();

    return this.toResponseDto(sender);
  }

  /**
   * Set sender as secondary (and clear any existing secondary)
   */
  async setSecondary(userId: string, senderId: string): Promise<SenderResponseDto> {
    const userObjectId = new Types.ObjectId(userId);
    const senderObjectId = new Types.ObjectId(senderId);

    const sender = await this.userSenderModel.findOne({
      _id: senderObjectId,
      userId: userObjectId,
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (!sender.verified) {
      throw new BadRequestException('Only verified senders can be set as secondary');
    }

    if (sender.status !== 'active') {
      throw new BadRequestException('Only active senders can be set as secondary');
    }

    // Clear any existing secondary for this user
    await this.userSenderModel.updateMany(
      { userId: userObjectId, priority: 2 },
      { priority: null },
    );

    // Set this sender as secondary
    sender.priority = 2;
    sender.updatedAt = new Date();
    await sender.save();

    return this.toResponseDto(sender);
  }

  /**
   * Get primary sender for user
   */
  async getPrimary(userId: string): Promise<UserSender | null> {
    return this.userSenderModel.findOne({
      userId: new Types.ObjectId(userId),
      priority: 1,
      status: 'active',
    });
  }

  /**
   * Get secondary sender for user
   */
  async getSecondary(userId: string): Promise<UserSender | null> {
    return this.userSenderModel.findOne({
      userId: new Types.ObjectId(userId),
      priority: 2,
      status: 'active',
    });
  }

  /**
   * Get sender by ID
   */
  async getById(userId: string, senderId: string): Promise<UserSender | null> {
    return this.userSenderModel.findOne({
      _id: new Types.ObjectId(senderId),
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Deactivate (soft delete) a sender
   */
  async deactivateSender(userId: string, senderId: string): Promise<SenderResponseDto> {
    const sender = await this.userSenderModel.findOne({
      _id: new Types.ObjectId(senderId),
      userId: new Types.ObjectId(userId),
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    // If this was primary or secondary, clear the priority
    if (sender.priority) {
      sender.priority = null;
    }

    sender.status = 'inactive';
    sender.updatedAt = new Date();
    await sender.save();

    return this.toResponseDto(sender);
  }

  /**
   * Get resolution chain for sending
   * Returns: [primary, secondary] filtered to active/verified only
   */
  async getResolutionChain(userId: string): Promise<UserSender[]> {
    const primary = await this.getPrimary(userId);
    const secondary = await this.getSecondary(userId);

    const chain: UserSender[] = [];
    if (primary) chain.push(primary);
    if (secondary && (!primary || secondary._id.toString() !== primary._id.toString())) {
      chain.push(secondary);
    }

    return chain;
  }

  /**
   * Get resolution chain with optional selected sender
   * Returns: [selected, primary, secondary] without duplicates
   */
  async getResolutionChainWithSelected(
    userId: string,
    selectedSenderId?: string,
  ): Promise<UserSender[]> {
    const chain: UserSender[] = [];
    const added = new Set<string>();

    // Add selected sender first if provided and valid
    if (selectedSenderId) {
      const selected = await this.getById(userId, selectedSenderId);
      if (selected && selected.status === 'active' && selected.verified) {
        chain.push(selected);
        added.add(selected._id.toString());
      }
    }

    // Add primary if not already added
    const primary = await this.getPrimary(userId);
    if (primary && !added.has(primary._id.toString())) {
      chain.push(primary);
      added.add(primary._id.toString());
    }

    // Add secondary if not already added
    const secondary = await this.getSecondary(userId);
    if (secondary && !added.has(secondary._id.toString())) {
      chain.push(secondary);
      added.add(secondary._id.toString());
    }

    return chain;
  }

  /**
   * Extract domain from email
   */
  private extractDomain(email: string): string | null {
    const parts = email.split('@');
    return parts[1] || null;
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(sender: UserSender): SenderResponseDto {
    return {
      id: sender._id.toString(),
      email: sender.email,
      displayName: sender.displayName,
      provider: sender.provider,
      replyToEmail: sender.replyToEmail,
      replyToName: sender.replyToName,
      verified: sender.verified,
      status: sender.status,
      priority: sender.priority,
      createdAt: sender.createdAt,
      isPrimary: sender.priority === 1,
      isSecondary: sender.priority === 2,
    };
  }
}
