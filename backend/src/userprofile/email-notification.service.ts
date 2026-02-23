import { Injectable, Inject } from '@nestjs/common';
import { EmailRouterService } from '../email/email-router.service';
import { NotificationPreferencesHelper, NotificationType } from './notification-preferences.helper';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile } from './entities/userprofile.entity';
import { User } from '../user/entities/user.entity';

interface NotificationEmailData {
  type: NotificationType;
  userId: string;
  recipientEmail: string;
  data: Record<string, any>;
}

@Injectable()
export class EmailNotificationService {
  constructor(
    private readonly emailRouterService: EmailRouterService,
    private readonly notificationHelper: NotificationPreferencesHelper,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Send a notification email if user has enabled that notification type
   */
  async sendNotification(notificationData: NotificationEmailData): Promise<boolean> {
    try {
      // Check if notification is enabled for this user
      const isEnabled = await this.notificationHelper.isNotificationEnabled(
        notificationData.userId,
        notificationData.type,
      );

      if (!isEnabled) {
        console.log(
          `[Notification] Skipping "${notificationData.type}" notification for user ${notificationData.userId} - preference disabled`,
        );
        return false;
      }

      // Get email template and send
      const { subject, htmlBody } = this.getEmailTemplate(
        notificationData.type,
        notificationData.data,
      );

      await this.emailRouterService.sendEmail(
        notificationData.userId,
        notificationData.recipientEmail,
        subject,
        htmlBody,
      );

      console.log(
        `[Notification] Successfully sent "${notificationData.type}" notification to ${notificationData.recipientEmail}`,
      );
      return true;
    } catch (error) {
      console.error(
        `[Notification] Error sending "${notificationData.type}" notification:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(
    type: NotificationType,
    data: Record<string, any>,
  ): { subject: string; htmlBody: string } {
    switch (type) {
      case 'invoiceDueSoon':
        return this.getInvoiceDueSoonTemplate(data);
      case 'invoiceOverdue':
        return this.getInvoiceOverdueTemplate(data);
      case 'quoteViewed':
        return this.getQuoteViewedTemplate(data);
      case 'quoteAccepted':
        return this.getQuoteAcceptedTemplate(data);
      case 'quoteRejected':
        return this.getQuoteRejectedTemplate(data);
      case 'quoteExpired':
        return this.getQuoteExpiredTemplate(data);
      case 'upcomingRenewal':
        return this.getUpcomingRenewalTemplate(data);
      case 'renewalSuccessful':
        return this.getRenewalSuccessfulTemplate(data);
      case 'renewalPaymentFailed':
        return this.getRenewalPaymentFailedTemplate(data);
      case 'subscriptionChanged':
        return this.getSubscriptionChangedTemplate(data);
      case 'supportAgentReplied':
        return this.getSupportAgentRepliedTemplate(data);
      case 'ticketResolved':
        return this.getTicketResolvedTemplate(data);
      default:
        return {
          subject: 'Notification',
          htmlBody: '<p>You have a new notification.</p>',
        };
    }
  }

  // ==================== INVOICE TEMPLATES ====================

  private getInvoiceDueSoonTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { invoiceNumber, clientName, amount, dueDate, currencySymbol } = data;
    return {
      subject: `Invoice ${invoiceNumber} due on ${dueDate}`,
      htmlBody: `
        <h2>Invoice Due Reminder</h2>
        <p>Your invoice <strong>#${invoiceNumber}</strong> is due soon.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Amount:</strong> ${currencySymbol}${amount}</li>
          <li><strong>Due Date:</strong> ${dueDate}</li>
        </ul>
        <p>Please ensure payment is received by the due date.</p>
      `,
    };
  }

  private getInvoiceOverdueTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { invoiceNumber, clientName, amount, dueDate, currencySymbol, daysOverdue } = data;
    return {
      subject: `⚠️ Invoice ${invoiceNumber} is OVERDUE`,
      htmlBody: `
        <h2 style="color: #d32f2f;">Invoice Overdue</h2>
        <p>Your invoice <strong>#${invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Amount:</strong> ${currencySymbol}${amount}</li>
          <li><strong>Due Date:</strong> ${dueDate}</li>
        </ul>
        <p>Please follow up with your client to collect payment.</p>
      `,
    };
  }

  // ==================== QUOTE TEMPLATES ====================

  private getQuoteViewedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { quoteNumber, clientName, viewedAt } = data;
    return {
      subject: `Quote ${quoteNumber} has been viewed by ${clientName}`,
      htmlBody: `
        <h2>Quote Viewed</h2>
        <p>Your quote <strong>#${quoteNumber}</strong> has been opened by your client.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Viewed At:</strong> ${viewedAt}</li>
        </ul>
        <p>Follow up to answer any questions your client may have.</p>
      `,
    };
  }

  private getQuoteAcceptedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { quoteNumber, clientName, amount, currencySymbol } = data;
    return {
      subject: `✅ Quote ${quoteNumber} ACCEPTED by ${clientName}`,
      htmlBody: `
        <h2 style="color: #4caf50;">Quote Accepted!</h2>
        <p>Great news! Your quote <strong>#${quoteNumber}</strong> has been accepted.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Amount:</strong> ${currencySymbol}${amount}</li>
        </ul>
        <p>You can now convert this quote to an invoice to proceed with the project.</p>
      `,
    };
  }

  private getQuoteRejectedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { quoteNumber, clientName, reason } = data;
    return {
      subject: `❌ Quote ${quoteNumber} REJECTED by ${clientName}`,
      htmlBody: `
        <h2 style="color: #d32f2f;">Quote Rejected</h2>
        <p>Your quote <strong>#${quoteNumber}</strong> has been declined by your client.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
        </ul>
        <p>Consider reaching out to discuss alternatives or modifications.</p>
      `,
    };
  }

  private getQuoteExpiredTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { quoteNumber, clientName, expiryDate } = data;
    return {
      subject: `Quote ${quoteNumber} has expired`,
      htmlBody: `
        <h2>Quote Expired</h2>
        <p>Your quote <strong>#${quoteNumber}</strong> expired on <strong>${expiryDate}</strong>.</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>If your client is still interested, you may want to send them a new quote.</p>
      `,
    };
  }

  // ==================== RECURRING/SUBSCRIPTION TEMPLATES ====================

  private getUpcomingRenewalTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { subscriptionName, renewalDate, amount, currencySymbol } = data;
    return {
      subject: `Upcoming renewal for ${subscriptionName}`,
      htmlBody: `
        <h2>Subscription Renewal Reminder</h2>
        <p>Your subscription <strong>${subscriptionName}</strong> will renew soon.</p>
        <ul>
          <li><strong>Amount:</strong> ${currencySymbol}${amount}</li>
          <li><strong>Renewal Date:</strong> ${renewalDate}</li>
        </ul>
        <p>Make sure your payment method is up to date to avoid any service interruptions.</p>
      `,
    };
  }

  private getRenewalSuccessfulTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { subscriptionName, amount, currencySymbol, nextRenewalDate } = data;
    return {
      subject: `✅ ${subscriptionName} has been renewed successfully`,
      htmlBody: `
        <h2 style="color: #4caf50;">Subscription Renewed</h2>
        <p>Your subscription <strong>${subscriptionName}</strong> has been renewed successfully.</p>
        <ul>
          <li><strong>Amount Charged:</strong> ${currencySymbol}${amount}</li>
          <li><strong>Next Renewal:</strong> ${nextRenewalDate}</li>
        </ul>
        <p>Thank you for your continued subscription.</p>
      `,
    };
  }

  private getRenewalPaymentFailedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { subscriptionName, amount, currencySymbol, reason } = data;
    return {
      subject: `⚠️ Payment failed for ${subscriptionName}`,
      htmlBody: `
        <h2 style="color: #d32f2f;">Payment Failed</h2>
        <p>We couldn't process the renewal payment for <strong>${subscriptionName}</strong>.</p>
        <ul>
          <li><strong>Amount:</strong> ${currencySymbol}${amount}</li>
          ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
        </ul>
        <p>Please update your payment method to ensure your subscription remains active.</p>
      `,
    };
  }

  private getSubscriptionChangedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { planName, previousPlan, action } = data;
    return {
      subject: `Your subscription has been ${action}`,
      htmlBody: `
        <h2>Subscription Updated</h2>
        <p>Your subscription plan has been ${action}.</p>
        <ul>
          <li><strong>Previous Plan:</strong> ${previousPlan}</li>
          <li><strong>New Plan:</strong> ${planName}</li>
        </ul>
        <p>Your new features and limits are now active.</p>
      `,
    };
  }

  // ==================== SUPPORT TEMPLATES ====================

  private getSupportAgentRepliedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { ticketNumber, agentName, message } = data;
    return {
      subject: `Support agent replied to ticket #${ticketNumber}`,
      htmlBody: `
        <h2>Support Response</h2>
        <p>A support agent has replied to your ticket <strong>#${ticketNumber}</strong>.</p>
        <p><strong>From:</strong> ${agentName}</p>
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">
          ${message}
        </div>
        <p>Check your support dashboard for the full conversation.</p>
      `,
    };
  }

  private getTicketResolvedTemplate(data: Record<string, any>): {
    subject: string;
    htmlBody: string;
  } {
    const { ticketNumber, subject } = data;
    return {
      subject: `Support ticket #${ticketNumber} has been resolved`,
      htmlBody: `
        <h2 style="color: #4caf50;">Ticket Resolved</h2>
        <p>Your support ticket <strong>#${ticketNumber}</strong> has been marked as resolved.</p>
        <ul>
          <li><strong>Subject:</strong> ${subject}</li>
        </ul>
        <p>If you need further assistance, you can reopen this ticket or create a new one.</p>
      `,
    };
  }
}
