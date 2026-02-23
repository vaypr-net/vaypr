import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { EmailNotificationService } from '../userprofile/email-notification.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    @Inject(EmailNotificationService) private emailNotificationService: EmailNotificationService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = new this.ticketModel(createTicketDto);
    return await ticket.save();
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
      items,
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
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      updateTicketDto,
      { new: true },
    );
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
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

    return ticket;
  }

  async addMessage(
    id: string,
    message: string,
    author: string,
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
      await this.sendSupportAgentRepliedNotification(ticket.customerId, {
        ticketId: ticket.id,
        subject: ticket.subject,
        messagePreview: message.slice(0, 140),
      });
    }

    return ticket;
  }

  async addInternalNote(
    id: string,
    note: string,
    author: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      {
        $push: {
          internalNotes: {
            note,
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
    return ticket;
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
