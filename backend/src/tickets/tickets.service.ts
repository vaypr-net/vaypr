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
import { User } from '../user/entities/user.entity';
import { SuperAdminSettings } from '../superadmin-settings/entities/superadmin-settings.entity';
import { EmailRouterService } from '../email/email-router.service';
import { ActivityService } from '../activity/activity.service';

type InternalNoteScope = 'admin' | 'user';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SuperAdminSettings.name)
    private superAdminSettingsModel: Model<SuperAdminSettings>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    @Inject(EmailNotificationService) private emailNotificationService: EmailNotificationService,
    private readonly notificationsService: NotificationsService,
    private readonly emailRouterService: EmailRouterService,
    private readonly activityService: ActivityService,
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

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    await this.sendTicketStatusChangedEmail(ticket, previousStatus);
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = new this.ticketModel(createTicketDto);
    return await ticket.save();
  }

  async createForCustomer(
    customerId: string,
    fallbackCustomerEmail: string,
    createTicketDto: CreateMyTicketDto,
  ): Promise<Ticket> {
    const effectiveCustomerEmail =
      createTicketDto.customerEmail?.trim().toLowerCase() ||
      fallbackCustomerEmail?.trim().toLowerCase();

    const ticket = new this.ticketModel({
      ...createTicketDto,
      customerId,
      customerEmail: effectiveCustomerEmail,
      customerName:
        createTicketDto.customerName?.trim() ||
        effectiveCustomerEmail?.split('@')[0] ||
        effectiveCustomerEmail,
    });
    const saved = await ticket.save();
    await this.createSuperAdminTicketActivity(saved);
    await this.notifySuperAdminAndSupportOnTicketCreated(saved);
    return this.filterTicketForViewer(saved, 'user');
  }

  private async createSuperAdminTicketActivity(ticket: Ticket): Promise<void> {
    try {
      const ticketId = (ticket as any).id || (ticket as any)._id?.toString?.() || '';
      await this.activityService.create({
        type: 'ticket',
        title: 'Ticket Created',
        description: `${ticket.customerName || ticket.customerEmail} created ticket "${ticket.subject}" (${ticketId})`,
      });
    } catch (error) {
      console.error('[Support] Failed to create activity for ticket creation:', error);
    }
  }

  private async notifySuperAdminAndSupportOnTicketCreated(ticket: Ticket): Promise<void> {
    try {
      const superAdmins = await this.userModel
        .find({ isSuperAdmin: true })
        .select('_id email fullName')
        .lean()
        .exec();

      if (!superAdmins.length) {
        return;
      }

      const ticketId = (ticket as any).id || (ticket as any)._id?.toString?.() || '';
      const customerDisplay = ticket.customerName || ticket.customerEmail || 'A user';
      const message = `${customerDisplay} created a new support ticket: "${ticket.subject}".`;

      await Promise.all(
        superAdmins.map((admin: any) =>
          this.notificationsService.create({
            userId: admin._id.toString(),
            title: 'New Support Ticket Created',
            message,
            relatedId: ticketId,
          }),
        ),
      );

      const primaryAdmin: any = superAdmins[0];
      const settings = await this.superAdminSettingsModel
        .findOne({ userId: primaryAdmin._id })
        .lean()
        .exec();

      const supportEmail = settings?.supportEmail || primaryAdmin.email;
      const senderUserId = primaryAdmin._id.toString();
      if (!supportEmail) {
        return;
      }

      const emailSubject = `[NEW TICKET] ${ticket.subject}`;
      const emailBody = `
        <h2>New Support Ticket Created</h2>
        <p>A user has created a new support ticket.</p>
        <ul>
          <li><strong>Ticket ID:</strong> ${ticketId}</li>
          <li><strong>User:</strong> ${ticket.customerName}</li>
          <li><strong>User Email:</strong> ${ticket.customerEmail}</li>
          <li><strong>Category:</strong> ${ticket.category}</li>
          <li><strong>Priority:</strong> ${ticket.priority}</li>
          <li><strong>Subject:</strong> ${ticket.subject}</li>
          <li><strong>Status:</strong> ${this.formatStatusLabel(ticket.status)}</li>
        </ul>
        <p><strong>Description:</strong></p>
        <p>${ticket.description.replace(/\n/g, '<br>')}</p>
      `;

      await this.emailRouterService.sendEmail(
        senderUserId,
        supportEmail,
        emailSubject,
        emailBody,
        undefined,
        undefined,
        ticket.customerEmail,
        undefined,
        false,
        supportEmail,
      );

      if (ticket.customerEmail) {
        const customerSubject = `We received your support ticket #${ticketId}`;
        const customerBody = `
          <h2>Support Ticket Received</h2>
          <p>Hi ${ticket.customerName || 'there'},</p>
          <p>We received your support request and our team will reply soon.</p>
          <ul>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Subject:</strong> ${ticket.subject}</li>
            <li><strong>Category:</strong> ${ticket.category}</li>
            <li><strong>Priority:</strong> ${ticket.priority}</li>
            <li><strong>Status:</strong> ${this.formatStatusLabel(ticket.status)}</li>
          </ul>
          <p>Thank you for contacting support.</p>
        `;

        await this.emailRouterService.sendEmail(
          senderUserId,
          ticket.customerEmail,
          customerSubject,
          customerBody,
          undefined,
          undefined,
          supportEmail,
          undefined,
          false,
          supportEmail,
        );
      }
    } catch (error) {
      console.error('[Support] Failed to send super-admin/support notification for new ticket:', error);
    }
  }

  private async resolveSupportContext(): Promise<{ supportEmail?: string; senderUserId?: string }> {
    const settings = await this.superAdminSettingsModel
      .findOne()
      .select('supportEmail userId')
      .lean()
      .exec();

    if (settings?.supportEmail || settings?.userId) {
      return {
        supportEmail: settings?.supportEmail,
        senderUserId: (settings as any)?.userId?.toString?.(),
      };
    }

    const superAdmin: any = await this.userModel
      .findOne({ isSuperAdmin: true })
      .select('_id email')
      .lean()
      .exec();

    return {
      supportEmail: superAdmin?.email,
      senderUserId: superAdmin?._id?.toString?.(),
    };
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
      const safeSearch = this.escapeRegex(search.trim());
      query.$or = [
        { subject: { $regex: safeSearch, $options: 'i' } },
        { customerName: { $regex: safeSearch, $options: 'i' } },
        { customerEmail: { $regex: safeSearch, $options: 'i' } },
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
      const safeSearch = this.escapeRegex(search.trim());
      query.$or = [
        { subject: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
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
      // Email sending is handled in createTicketStatusNotification() for all status changes.
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
        agentName: author,
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
    ticketData: { ticketId: string; subject: string; messagePreview: string; agentName?: string }
  ): Promise<boolean> {
    try {
      const ticket = await this.ticketModel.findById(ticketData.ticketId).exec();
      if (!ticket?.customerEmail) return false;
      const supportContext = await this.resolveSupportContext();
      const supportInboxEmail = supportContext.supportEmail;

      return await this.emailNotificationService.sendNotification({
        type: 'supportAgentReplied',
        userId,
        recipientEmail: ticket.customerEmail,
        replyTo: supportInboxEmail,
        senderUserId: supportContext.senderUserId,
        fromEmail: supportInboxEmail,
        useLoginEmailAsSender: true,
        data: {
          ticketNumber: ticketData.ticketId,
          subject: ticketData.subject,
          message: ticketData.messagePreview,
          agentName: ticketData.agentName || 'Support Team',
        },
      });
    } catch (error) {
      console.error(`[Support] Error sending supportAgentReplied email:`, error);
      return false;
    }
  }

  /**
   * Send ticket status changed email for any status transition
   * Uses ticketResolved preference group for support lifecycle notifications.
   */
  async sendTicketStatusChangedEmail(
    ticket: Ticket,
    previousStatus: string,
  ): Promise<boolean> {
    try {
      if (!ticket?.customerEmail) return false;

      const ticketId = (ticket as any).id || (ticket as any)._id?.toString() || '';

      return await this.emailNotificationService.sendNotification({
        type: 'ticketResolved',
        userId: ticket.customerId,
        recipientEmail: ticket.customerEmail,
        data: {
          ticketNumber: ticketId,
          subject: ticket.subject,
          resolution: ticket.status,
          previousStatus,
        },
      });
    } catch (error) {
      console.error(`[Support] Error sending ticket status changed email:`, error);
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
