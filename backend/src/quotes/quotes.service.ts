import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from './entities/quote.entity';
import { Client } from '../clients/entities/client.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { PlanLimitService } from '../common/services/plan-limit.service';

@Injectable()
export class QuotesService implements OnModuleInit {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    private planLimitService: PlanLimitService,
  ) {}

  async onModuleInit() {
    try {
      // Drop the old unique index if it exists
      await this.quoteModel.collection.dropIndex('quoteNumber_1');
      console.log('Dropped old quoteNumber unique index');
    } catch (error) {
      // Index might not exist, that's fine
      console.log('Old quoteNumber index not found or already dropped');
    }
    
    // Ensure indexes are created (including the new partial unique index)
    await this.quoteModel.syncIndexes();
    console.log('Quote indexes synchronized');
  }

  async create(createQuoteDto: CreateQuoteDto, userId: string): Promise<Quote> {
    // Check plan limit before creating quote
    await this.planLimitService.enforceLimit(
      userId,
      'quotes',
      this.quoteModel,
      { isDeleted: { $ne: true } },
    );

    if (createQuoteDto.clientId) {
      const client = await this.clientModel.findById(createQuoteDto.clientId);

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${createQuoteDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    this.normalizeItemColumnVisibilityOnCreate(createQuoteDto);
    this.normalizeManualGrandTotalOnCreate(createQuoteDto);

    const quote = new this.quoteModel({
      ...createQuoteDto,
      userId: new Types.ObjectId(userId),
      clientId: createQuoteDto.clientId
        ? new Types.ObjectId(createQuoteDto.clientId)
        : undefined,
    });

    try {
      return await quote.save();
    } catch (error: any) {
      if (this.isDuplicateQuoteNumberError(error)) {
        throw new ConflictException(
          `Quote number "${createQuoteDto.quoteNumber}" already exists. Please use a different quote number.`,
        );
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<Quote[]> {
    return this.quoteModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Quote> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quote ID: ${id}`);
    }

    const quote = await this.quoteModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this quote',
      );
    }

    return quote;
  }

  async update(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    userId: string,
  ): Promise<Quote> {
    const existingQuote = await this.findOne(id, userId);
    this.normalizeItemColumnVisibilityOnUpdate(updateQuoteDto, existingQuote);
    this.normalizeManualGrandTotalOnUpdate(updateQuoteDto, existingQuote);

    if (
      updateQuoteDto.clientId &&
      updateQuoteDto.clientId !== existingQuote.clientId?.toString()
    ) {
      const client = await this.clientModel.findById(updateQuoteDto.clientId);

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${updateQuoteDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    let updatedQuote: Quote | null = null;
    try {
      updatedQuote = await this.quoteModel
        .findByIdAndUpdate(
          id,
          {
            ...updateQuoteDto,
            clientId: updateQuoteDto.clientId
              ? new Types.ObjectId(updateQuoteDto.clientId)
              : existingQuote.clientId,
          },
          { new: true },
        )
        .populate('clientId', 'name email phone clientType')
        .exec();
    } catch (error: any) {
      if (this.isDuplicateQuoteNumberError(error)) {
        const duplicateNumber = updateQuoteDto.quoteNumber || existingQuote.quoteNumber;
        throw new ConflictException(
          `Quote number "${duplicateNumber}" already exists. Please use a different quote number.`,
        );
      }
      throw error;
    }

    if (!updatedQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return updatedQuote;
  }

  private normalizeItemColumnVisibilityOnCreate(dto: CreateQuoteDto): void {
    const hasQuantifiableItems = (dto.items ?? []).some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const allHidden =
      dto.hideQuantity === true &&
      dto.hideUnitPrice === true &&
      dto.hideTotalCost === true;

    if (hasQuantifiableItems && allHidden) {
      dto.hideQuantity = false;
      dto.hideUnitPrice = false;
      dto.hideTotalCost = false;
    }
  }

  private normalizeItemColumnVisibilityOnUpdate(
    dto: UpdateQuoteDto,
    existingQuote: Quote,
  ): void {
    const nextItems = dto.items ?? existingQuote.items ?? [];
    const nextHideQuantity = dto.hideQuantity ?? existingQuote.hideQuantity;
    const nextHideUnitPrice = dto.hideUnitPrice ?? existingQuote.hideUnitPrice;
    const nextHideTotalCost = dto.hideTotalCost ?? existingQuote.hideTotalCost;
    const hasQuantifiableItems = nextItems.some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const allHidden =
      nextHideQuantity === true &&
      nextHideUnitPrice === true &&
      nextHideTotalCost === true;

    if (hasQuantifiableItems && allHidden) {
      dto.hideQuantity = false;
      dto.hideUnitPrice = false;
      dto.hideTotalCost = false;
    }
  }

  private normalizeManualGrandTotalOnCreate(dto: CreateQuoteDto): void {
    const hasQuantifiableItems = (dto.items ?? []).some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const manualGrandTotal = Number(dto.manualGrandTotal ?? 0);
    const useManualGrandTotal = dto.useManualGrandTotal === true;

    if (hasQuantifiableItems && useManualGrandTotal && manualGrandTotal <= 0) {
      dto.useManualGrandTotal = false;
      dto.manualGrandTotal = 0;
    }
  }

  private normalizeManualGrandTotalOnUpdate(
    dto: UpdateQuoteDto,
    existingQuote: Quote,
  ): void {
    const nextItems = dto.items ?? existingQuote.items ?? [];
    const nextUseManualGrandTotal =
      dto.useManualGrandTotal ?? existingQuote.useManualGrandTotal;
    const nextManualGrandTotal = Number(
      dto.manualGrandTotal ?? existingQuote.manualGrandTotal ?? 0,
    );
    const hasQuantifiableItems = nextItems.some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );

    if (hasQuantifiableItems && nextUseManualGrandTotal === true && nextManualGrandTotal <= 0) {
      dto.useManualGrandTotal = false;
      dto.manualGrandTotal = 0;
    }
  }

  private isDuplicateQuoteNumberError(error: any): boolean {
    return (
      !!error &&
      error.code === 11000 &&
      (error.keyPattern?.quoteNumber === 1 ||
        Object.prototype.hasOwnProperty.call(error.keyValue || {}, 'quoteNumber'))
    );
  }

  async remove(id: string, userId: string): Promise<Quote> {
    await this.findOne(id, userId);

    const deletedQuote = await this.quoteModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return deletedQuote;
  }

  async findByClient(clientId: string, userId: string): Promise<Quote[]> {
    const client = await this.clientModel.findById(clientId);

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }

    return this.quoteModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: string, userId: string): Promise<Quote[]> {
    return this.quoteModel
      .find({
        userId: new Types.ObjectId(userId),
        status,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Send "Quote Viewed" notification email
   * CHECKS: quoteViewed preference before sending
   */
  async sendQuoteViewedNotification(
    userId: string,
    quoteData: { quoteNumber: string; clientName: string; amount: number }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'quoteViewed');
      if (!isEnabled) {
        console.log(`[Quote] Skipping "quote viewed" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Quote] Would send "quote viewed" email for quote ${quoteData.quoteNumber}`);
      return true;
    } catch (error) {
      console.error(`[Quote] Error checking notification preference for quoteViewed:`, error);
      return true;
    }
  }

  /**
   * Send "Quote Accepted" notification email
   * CHECKS: quoteAccepted preference before sending
   */
  async sendQuoteAcceptedNotification(
    userId: string,
    quoteData: { quoteNumber: string; clientName: string; amount: number }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'quoteAccepted');
      if (!isEnabled) {
        console.log(`[Quote] Skipping "quote accepted" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Quote] Would send "quote accepted" email for quote ${quoteData.quoteNumber}`);
      return true;
    } catch (error) {
      console.error(`[Quote] Error checking notification preference for quoteAccepted:`, error);
      return true;
    }
  }

  /**
   * Send "Quote Rejected" notification email
   * CHECKS: quoteRejected preference before sending
   */
  async sendQuoteRejectedNotification(
    userId: string,
    quoteData: { quoteNumber: string; clientName: string; amount: number }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'quoteRejected');
      if (!isEnabled) {
        console.log(`[Quote] Skipping "quote rejected" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Quote] Would send "quote rejected" email for quote ${quoteData.quoteNumber}`);
      return true;
    } catch (error) {
      console.error(`[Quote] Error checking notification preference for quoteRejected:`, error);
      return true;
    }
  }

  /**
   * Send "Quote Expired" notification email
   * CHECKS: quoteExpired preference before sending
   */
  async sendQuoteExpiredNotification(
    userId: string,
    quoteData: { quoteNumber: string; clientName: string; expiryDate: string }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'quoteExpired');
      if (!isEnabled) {
        console.log(`[Quote] Skipping "quote expired" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Quote] Would send "quote expired" email for quote ${quoteData.quoteNumber}`);
      return true;
    } catch (error) {
      console.error(`[Quote] Error checking notification preference for quoteExpired:`, error);
      return true;
    }
  }

  /**
   * Find quote by shareToken (for public sharing)
   * Does not require authentication
   */
  async findByShareToken(shareToken: string): Promise<Quote> {
    if (!shareToken) {
      throw new NotFoundException('Share token is required');
    }

    const quote = await this.quoteModel
      .findOne({
        shareToken,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!quote) {
      throw new NotFoundException('Quote not found or link has expired');
    }

    return quote;
  }
}
