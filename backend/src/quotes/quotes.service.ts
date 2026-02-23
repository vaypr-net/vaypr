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
import { QuoteStatus } from './enums/quote-status.enum';
import { PublicQuoteResponseAction } from './dto/public-quote-response.dto';
import { Client } from '../clients/entities/client.entity';
import { User } from '../user/entities/user.entity';
import { EmailNotificationService } from '../userprofile/email-notification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlanLimitService } from '../common/services/plan-limit.service';

@Injectable()
export class QuotesService implements OnModuleInit {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(EmailNotificationService) private emailNotificationService: EmailNotificationService,
    private planLimitService: PlanLimitService,
    private notificationsService: NotificationsService,
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
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'quoteViewed',
        userId,
        recipientEmail: user.email,
        data: {
          quoteNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          viewedAt: new Date().toLocaleString(),
        },
      });
    } catch (error) {
      console.error(`[Quote] Error sending quoteViewed notification:`, error);
      return false;
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
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'quoteAccepted',
        userId,
        recipientEmail: user.email,
        data: {
          quoteNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          amount: quoteData.amount,
          currencySymbol: '$', // You might want to pass this from the quote data
        },
      });
    } catch (error) {
      console.error(`[Quote] Error sending quoteAccepted notification:`, error);
      return false;
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
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'quoteRejected',
        userId,
        recipientEmail: user.email,
        data: {
          quoteNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          reason: '', // Optional reason field
        },
      });
    } catch (error) {
      console.error(`[Quote] Error sending quoteRejected notification:`, error);
      return false;
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
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'quoteExpired',
        userId,
        recipientEmail: user.email,
        data: {
          quoteNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          expiryDate: quoteData.expiryDate,
        },
      });
    } catch (error) {
      console.error(`[Quote] Error sending quoteExpired notification:`, error);
      return false;
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

  async markViewedByShareToken(shareToken: string): Promise<Quote> {
    const quote = await this.findByShareToken(shareToken);
    const now = new Date();

    const shouldSetViewedAt = !quote.viewedAt;
    const shouldSetViewedStatus = quote.status === QuoteStatus.SENT;
    const hasViewedTimeline = (quote.timeline || []).some((event) => event.type === 'viewed');

    if (!shouldSetViewedAt && !shouldSetViewedStatus && hasViewedTimeline) {
      return quote;
    }

    const setPayload: Record<string, unknown> = {};
    if (shouldSetViewedAt) setPayload.viewedAt = now;
    if (shouldSetViewedStatus) setPayload.status = QuoteStatus.VIEWED;

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(setPayload).length > 0) {
      updateQuery.$set = setPayload;
    }
    if (!hasViewedTimeline) {
      updateQuery.$push = {
        timeline: {
          type: 'viewed',
          timestamp: now,
        },
      };
    }

    const updated = await this.quoteModel
      .findOneAndUpdate(
        {
          shareToken,
          isDeleted: false,
        },
        updateQuery,
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!updated) {
      throw new NotFoundException('Quote not found or link has expired');
    }

    await this.sendQuoteViewedNotification(updated.userId.toString(), {
      quoteNumber: updated.quoteNumber,
      clientName: updated.billTo?.name || 'Client',
      amount: updated.total || 0,
    });

    // Create an in-app notification for the quote owner so it appears after refresh
    try {
      await this.notificationsService.create({
        userId: updated.userId.toString(),
        title: `Quote viewed: ${updated.quoteNumber}`,
        message: `${updated.billTo?.name || 'Client'} viewed your quote ${updated.quoteNumber}.`,
        relatedId: updated._id?.toString(),
      });
    } catch (err) {
      console.error('Failed to create notification record:', err);
    }

    return updated;
  }

  async respondByShareToken(
    shareToken: string,
    action: PublicQuoteResponseAction,
    message?: string,
  ): Promise<Quote> {
    const quote = await this.findByShareToken(shareToken);

    const statusMap: Record<PublicQuoteResponseAction, QuoteStatus> = {
      [PublicQuoteResponseAction.ACCEPTED]: QuoteStatus.ACCEPTED,
      [PublicQuoteResponseAction.REJECTED]: QuoteStatus.REJECTED,
      [PublicQuoteResponseAction.MODIFICATION_REQUESTED]:
        QuoteStatus.MODIFICATION_REQUESTED,
    };
    const nextStatus = statusMap[action];
    const normalizedMessage = typeof message === 'string' ? message.trim() : undefined;
    const existingMessage = quote.clientResponse?.message?.trim() || undefined;

    // Idempotency guard: if the incoming response is identical to current state, skip write.
    if (
      quote.clientResponse?.action === action &&
      quote.status === nextStatus &&
      existingMessage === normalizedMessage
    ) {
      return quote;
    }

    const now = new Date();

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      clientResponse: {
        respondedAt: now,
        action,
        ...(normalizedMessage ? { message: normalizedMessage } : {}),
      },
      viewedAt: quote.viewedAt || now,
    };

    const timelineEvent: Record<string, unknown> = {
      type: action,
      timestamp: now,
    };
    if (normalizedMessage) {
      timelineEvent.message = normalizedMessage;
    }

    const updated = await this.quoteModel
      .findOneAndUpdate(
        {
          shareToken,
          isDeleted: false,
        },
        {
          $set: updatePayload,
          $push: { timeline: timelineEvent },
        },
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!updated) {
      throw new NotFoundException('Quote not found or link has expired');
    }

    const quoteMeta = {
      quoteNumber: updated.quoteNumber,
      clientName: updated.billTo?.name || 'Client',
      amount: updated.total || 0,
    };

    if (action === PublicQuoteResponseAction.ACCEPTED) {
      await this.sendQuoteAcceptedNotification(updated.userId.toString(), quoteMeta);
    } else if (action === PublicQuoteResponseAction.REJECTED) {
      await this.sendQuoteRejectedNotification(updated.userId.toString(), quoteMeta);
    }

    return updated;
  }
}
