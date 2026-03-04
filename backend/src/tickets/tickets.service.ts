import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMyTicketDto } from './dto/create-my-ticket.dto';
import { UpdateMyTicketDto } from './dto/update-my-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { EmailNotificationService } from '../userprofile/email-notification.service';
import { NotificationsService } from '../notifications/notifications.service';

type InternalNoteScope = 'admin' | 'user';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    @Inject(EmailNotificationService) private emailNotificationService: EmailNotificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private filterTicketForViewer(
    ticket: Ticket,
    viewer: InternalNoteScope,
  ): Ticket {
    const normalized =
      typeof (ticket as any).toObject === 'function'
        ? (ticket as any).toObject()
        : (ticket as any);

    const notes = Array.isArray(normalized.internalNotes)
      ? normalized.internalNotes
      : [];

    normalized.internalNotes = notes.filter((note: any) =>
      viewer === 'admin' ? note.scope !== 'user' : note.scope === 'user',
    );

    return normalized as Ticket;
  }

  private filterTicketsForViewer(
    tickets: Ticket[],
    viewer: InternalNoteScope,
  ): Ticket[] {
    return tickets.map((ticket) => this.filterTicketForViewer(ticket, viewer));
  }

  private formatStatusLabel(status: string): string {
    return status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private async createTicketStatusNotification(ticket: Ticket, previousStatus: string): Promise<void> {
    if (!ticket?.customerId || !ticket?.status || previousStatus === ticket.status) return;
    const relatedId =
      (ticket as any).id ||
      ((ticket as any)._id ? (ticket as any)._id.toString() : undefined);

    const previousLabel = this.formatStatusLabel(previousStatus);
    const nextLabel = this.formatStatusLabel(ticket.status);

    await this.notificationsService.create({
      userId: ticket.customerId,
      title: 'Ticket Status Updated',
      message: `Your ticket "${ticket.subject}" status changed from ${previousLabel} to ${nextLabel}.`,
      relatedId,
    });
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = new this.ticketModel(createTicketDto);
    return await ticket.save();
  }

  async createForCustomer(
    customerId: string,
    customerEmail: string,
    createTicketDto: CreateMyTicketDto,
  ): Promise<Ticket> {
    const ticket = new this.ticketModel({
      ...createTicketDto,
      customerId,
      customerEmail,
      customerName:
        createTicketDto.customerName?.trim() ||
        customerEmail.split('@')[0] ||
        customerEmail,
    });
    const saved = await ticket.save();
    return this.filterTicketForViewer(saved, 'user');
  }

  async findAll(
    search?: string,
    status?: string,
    priority?: string,
    category?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: Ticket[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const query: any = {};

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    const total = await this.ticketModel.countDocuments(query);
    const items = await this.ticketModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      items: this.filterTicketsForViewer(items as unknown as Ticket[], 'admin'),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.filterTicketForViewer(ticket, 'admin');
  }

  async findAllForCustomer(
    customerId: string,
    search?: string,
    status?: string,
    priority?: string,
    category?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: Ticket[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const query: any = {
      customerId,
    };

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    const total = await this.ticketModel.countDocuments(query);
    const items = await this.ticketModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      items: this.filterTicketsForViewer(items as unknown as Ticket[], 'user'),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findOneForCustomer(id: string, customerId: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findOne({ _id: id, customerId });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.filterTicketForViewer(ticket, 'user');
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const existingTicket = await this.ticketModel.findById(id);
    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    const ticket = await this.ticketModel.findByIdAndUpdate(id, updateTicketDto, {
      new: true,
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (
      updateTicketDto.status !== undefined &&
      existingTicket.status !== ticket.status
    ) {
      await this.createTicketStatusNotification(ticket, existingTicket.status);
    }

    return this.filterTicketForViewer(ticket, 'admin');
  }

  async updateForCustomer(
    id: string,
    customerId: string,
    updateMyTicketDto: UpdateMyTicketDto,
  ): Promise<Ticket> {
    await this.findOneForCustomer(id, customerId);
    const updateData: any = {};

    if (updateMyTicketDto.status !== undefined) {
      updateData.status = updateMyTicketDto.status;
      if (updateMyTicketDto.status === 'resolved') {
        updateData.resolvedAt = new Date();
      } else if (updateMyTicketDto.status === 'closed') {
        updateData.closedAt = new Date();
      }
    }

    if (updateMyTicketDto.priority !== undefined) {
      updateData.priority = updateMyTicketDto.priority;
    }

    if (updateMyTicketDto.assignedTo !== undefined) {
      updateData.assignedTo = updateMyTicketDto.assignedTo;
    }

    const ticket = await this.ticketModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.filterTicketForViewer(ticket, 'user');
  }

  async updateStatus(
    id: string,
    status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed',
  ): Promise<Ticket> {
    const existingTicket = await this.ticketModel.findById(id);
    if (!existingTicket) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = { status };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (status === 'closed') {
      updateData.closedAt = new Date();
    }

    const ticket = await this.ticketModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (
      existingTicket.status !== ticket.status &&
      (ticket.status === 'resolved' || ticket.status === 'closed')
    ) {
      await this.sendTicketResolvedNotification(ticket.customerId, {
        ticketId: ticket.id,
        subject: ticket.subject,
        resolution: ticket.status,
      });
    }

    if (existingTicket.status !== ticket.status) {
      await this.createTicketStatusNotification(ticket, existingTicket.status);
    }

    return this.filterTicketForViewer(ticket, 'admin');
  }

  async addMessage(
    id: string,
    message: string,
    author: string,
    viewer: InternalNoteScope = 'admin',
  ): Promise<Ticket> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      {
        $push: {
          messages: {
            message,
            author,
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isSupportReply =
      author.toLowerCase() !== (ticket.customerName || '').toLowerCase() &&
      author.toLowerCase() !== (ticket.customerEmail || '').toLowerCase();
    if (isSupportReply) {
      await this.notificationsService.create({
        userId: ticket.customerId,
        title: 'Support Replied to Your Ticket',
        message: `Support replied on "${ticket.subject}": ${message.slice(0, 140)}`,
        relatedId: ticket.id,
      });

      await this.sendSupportAgentRepliedNotification(ticket.customerId, {
        ticketId: ticket.id,
        subject: ticket.subject,
        messagePreview: message.slice(0, 140),
      });
    }

    return this.filterTicketForViewer(ticket, viewer);
  }

  async addMessageForCustomer(
    id: string,
    customerId: string,
    message: string,
  ): Promise<Ticket> {
    const ticket = await this.findOneForCustomer(id, customerId);
    const author = ticket.customerName || ticket.customerEmail;
    return this.addMessage(id, message, author, 'user');
  }

  async addInternalNote(
    id: string,
    note: string,
    author: string,
    scope: InternalNoteScope = 'admin',
    viewer: InternalNoteScope = 'admin',
  ): Promise<Ticket> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      {
        $push: {
          internalNotes: {
            note,
            author,
            timestamp: new Date(),
            scope,
          },
        },
      },
      { new: true },
    );

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.filterTicketForViewer(ticket, viewer);
  }

  async addInternalNoteForCustomer(
    id: string,
    customerId: string,
    note: string,
  ): Promise<Ticket> {
    const ticket = await this.findOneForCustomer(id, customerId);
    const author = ticket.customerName || ticket.customerEmail;
    return this.addInternalNote(id, note, author, 'user', 'user');
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const ticket = await this.ticketModel.findByIdAndDelete(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return { success: true, message: 'Ticket deleted successfully' };
  }

  async getStats(): Promise<{
    open: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
    total: number;
  }> {
    const [open, pending, inProgress, resolved, closed, total] =
      await Promise.all([
        this.ticketModel.countDocuments({ status: 'open' }),
        this.ticketModel.countDocuments({ status: 'pending' }),
        this.ticketModel.countDocuments({ status: 'in_progress' }),
        this.ticketModel.countDocuments({ status: 'resolved' }),
        this.ticketModel.countDocuments({ status: 'closed' }),
        this.ticketModel.countDocuments(),
      ]);

    return { open, pending, inProgress, resolved, closed, total };
  }

  async getCustomerStats(customerId: string): Promise<{
    open: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
    total: number;
  }> {
    const [open, pending, inProgress, resolved, closed, total] =
      await Promise.all([
        this.ticketModel.countDocuments({ customerId, status: 'open' }),
        this.ticketModel.countDocuments({ customerId, status: 'pending' }),
        this.ticketModel.countDocuments({ customerId, status: 'in_progress' }),
        this.ticketModel.countDocuments({ customerId, status: 'resolved' }),
        this.ticketModel.countDocuments({ customerId, status: 'closed' }),
        this.ticketModel.countDocuments({ customerId }),
      ]);

    return { open, pending, inProgress, resolved, closed, total };
  }

  /**
   * Send "Support Agent Replied" notification email
   * CHECKS: supportAgentReplied preference before sending
   */
  async sendSupportAgentRepliedNotification(
    userId: string,
    ticketData: { ticketId: string; subject: string; messagePreview: string }
  ): Promise<boolean> {
    try {
      const ticket = await this.ticketModel.findById(ticketData.ticketId).exec();
      if (!ticket?.customerEmail) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'supportAgentReplied',
        userId,
        recipientEmail: ticket.customerEmail,
        data: {
          ticketId: ticketData.ticketId,
          subject: ticketData.subject,
          messagePreview: ticketData.messagePreview,
        },
      });
    } catch (error) {
      console.error(`[Support] Error sending supportAgentReplied email:`, error);
      return false;
    }
  }

  /**
   * Send "Ticket Resolved/Closed" notification email
   * CHECKS: ticketResolved preference before sending
   */
  async sendTicketResolvedNotification(
    userId: string,
    ticketData: { ticketId: string; subject: string; resolution: string }
  ): Promise<boolean> {
    try {
      const ticket = await this.ticketModel.findById(ticketData.ticketId).exec();
      if (!ticket?.customerEmail) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'ticketResolved',
        userId,
        recipientEmail: ticket.customerEmail,
        data: {
          ticketId: ticketData.ticketId,
          subject: ticketData.subject,
          resolution: ticketData.resolution,
        },
      });
    } catch (error) {
      console.error(`[Support] Error sending ticketResolved email:`, error);
      return false;
    }
  }
}
