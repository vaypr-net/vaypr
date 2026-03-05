import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recurring } from '../entities/recurring.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { UserProfile } from '../../userprofile/entities/userprofile.entity';
import { EmailRouterService } from '../../email/email-router.service';
import { PdfGeneratorService } from '../../common/services/pdf-generator.service';
import { RecurringFrequency } from '../enums/recurring-frequency.enum';

@Injectable()
export class RecurringAutomailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecurringAutomailService.name);
  private cronJob: NodeJS.Timeout;

  constructor(
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    private readonly emailRouterService: EmailRouterService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  onModuleInit() {
    // Start cron job when module initializes
    this.startAutomailCron();
  }

  onModuleDestroy() {
    // Stop cron job when module is destroyed
    if (this.cronJob) {
      clearInterval(this.cronJob);
    }
  }

  private startAutomailCron() {
    // Run every 30 minutes to check timezones
    // This allows us to catch the 2 AM window for any timezone
    this.cronJob = setInterval(() => {
      this.runRecurringAutomailJob();
    }, 30 * 60 * 1000); // Every 30 minutes

    this.logger.log('[Recurring Automail] Cron job started - runs every 30 minutes to check all timezones');
    
    // Also run immediately on startup
    this.runRecurringAutomailJob();
  }

  private async runRecurringAutomailJob() {
    try {
      // Find all recurring billings that have autoSendReminder enabled
      const recurringBillings = await this.recurringModel
        .find({
          isActive: true,
          autoSendReminder: true,
          isDeleted: false,
        })
        .populate('userId')
        .populate('clientId')
        .exec();

      this.logger.log(`[Recurring Automail] Checking ${recurringBillings.length} recurring billings for timezone-aware sending...`);

      for (const recurring of recurringBillings) {
        try {
          // Check if this recurring should be processed in the user's timezone
          const shouldProcess = await this.shouldProcessInUserTimezone(recurring);
          
          if (shouldProcess) {
            this.logger.log(`[Recurring Automail] Processing recurring ${recurring._id} - matches timezone schedule`);
            await this.processRecurringAutomail(recurring);
          }
        } catch (error) {
          this.logger.error(
            `[Recurring Automail] Error checking recurring ${recurring._id}:`,
            error,
          );
        }
      }

      this.logger.log('[Recurring Automail] Timezone check completed');
    } catch (error) {
      this.logger.error('[Recurring Automail] Error in cron job:', error);
    }
  }

  private async shouldProcessInUserTimezone(recurring: any): Promise<boolean> {
    const user = recurring.userId as any;
    
    if (!user || !user._id) {
      this.logger.warn(`[Recurring Automail] User not found for recurring ${recurring._id}`);
      return false;
    }

    try {
      // Fetch user profile to get timezone
      const userProfile = await this.userProfileModel.findOne({ userId: user._id }).exec();
      
      // Get user's timezone, default to UTC if not set
      const userTimezone = userProfile?.timeZone || 'UTC';
      
      // Get current date/time in user's timezone using Intl API
      const now = new Date();
      const userTimeString = now.toLocaleString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Parse the returned string to extract date and time components
      const [datePart, timePart] = userTimeString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');

      // Create a date object representing "today" in the user's timezone
      const userDateUTC = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        0, 0, 0, 0
      );

      // Compare with nextBillingDate (compare just the dates, ignoring time)
      const nextBillingDate = new Date(recurring.nextBillingDate);
      const nextBillingDateUTC = new Date(
        nextBillingDate.getFullYear(),
        nextBillingDate.getMonth(),
        nextBillingDate.getDate(),
        0, 0, 0, 0
      );

      // Check if today's date (in user timezone) matches nextBillingDate
      const dateMatches = userDateUTC.getTime() === nextBillingDateUTC.getTime();

      if (!dateMatches) {
        return false;
      }

      // Check if current time is between 2:00 AM and 2:30 AM in user's timezone
      const currentHour = parseInt(hours);
      const currentMinute = parseInt(minutes);
      
      const isInSendWindow = currentHour === 2 && currentMinute < 30;

      if (isInSendWindow) {
        this.logger.debug(
          `[Recurring Automail] Recurring ${recurring._id}: Date matches (${userDateUTC.toDateString()}), time window matched (${hours}:${minutes} in ${userTimezone})`
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `[Recurring Automail] Error checking timezone for recurring ${recurring._id}:`,
        error,
      );
      return false;
    }
  }

  private async processRecurringAutomail(recurring: any) {
    try {
      const user = recurring.userId as any;
      const client = recurring.clientId as any;

      if (!client?.email) {
        this.logger.warn(
          `[Recurring Automail] Skipping recurring ${recurring._id} - no client email`,
        );
        return;
      }

      // Map recurring items to invoice items format (add unitPrice)
      const invoiceItems = recurring.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.rate || item.unitPrice || 0,
        amount: item.amount || (item.rate * (item.quantity || 1)) || 0,
      }));

      // Generate invoice for this recurring billing
      const invoiceData = {
        userId: recurring.userId,
        clientId: recurring.clientId,
        issueDate: new Date(),
        dueDate: recurring.nextBillingDate,
        invoiceNumber: `AUTO-${Date.now()}`,
        items: invoiceItems,
        subtotal: recurring.subtotal,
        tax: recurring.tax,
        total: recurring.total,
        currency: recurring.currency,
        status: 'draft',
        billTo: {
          name: client.name || 'Client',
          phone: client.phone,
          area: client.area,
          block: client.block,
          street: client.street,
          house: client.house,
          other: client.other,
        },
        companyFooter: recurring.companyFooter,
        paymentMethodType: recurring.paymentType,
        bankAccount: recurring.bankDetails,
        showBankAccount: recurring.showBankDetails,
        showPaymentMethod: !!recurring.paymentType,
        showPaymentTerms: recurring.showPaymentTerms,
        paymentTerms: recurring.paymentTerms,
        logo: recurring.logo,
        logoScale: recurring.logoScale,
        tableHeaderColor: recurring.itemHeaderColor,
      };

      const invoice = new this.invoiceModel(invoiceData);
      await invoice.save();

      this.logger.log(`[Recurring Automail] Generated invoice ${invoice._id} for recurring ${recurring._id}`);

      // Prepare email content for automail using saved/default recurring message.
      const companyName = recurring.companyFooter?.companyName || 'VAYPR';
      const frequencyLabel = this.getFrequencyLabel(recurring.frequency);
      const clientGreeting = client.name || 'Client';
      
      const defaultMessage = `Hi ${clientGreeting},

This is your ${frequencyLabel.toLowerCase()} subscription invoice.
Please find your invoice attached with this email.

If you have any questions, just reply to this message.

Best regards,
${companyName}`;

      const customAutoMessage = this.applyAutoMessageVariables(
        recurring.autoEmailMessage,
        {
          clientName: clientGreeting,
          companyName,
          frequencyLabel,
        },
      );

      // Keep automail body plain/generic by request (no branded email template wrapper).
      const messageToSend = customAutoMessage || defaultMessage;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>${this.escapeHtml(messageToSend).replace(/\n/g, '<br/>')}</p>
          <p style="color:#6b7280; font-size:12px; margin-top:16px;">PDF is attached with this email.</p>
        </div>
      `;

      // Generate PDF for the invoice
      let pdfBase64: string | undefined;
      let pdfFilename: string | undefined;
      try {
        pdfBase64 = await this.pdfGeneratorService.generateInvoicePdf(invoice.toObject ? invoice.toObject() : invoice);
        pdfFilename = `Invoice_${invoice.invoiceNumber || 'subscription'}.pdf`;
        this.logger.log(`[Recurring Automail] Generated PDF for invoice ${invoice._id}`);
      } catch (pdfError) {
        this.logger.warn(`[Recurring Automail] Failed to generate PDF, sending without attachment: ${pdfError}`);
        // Continue sending email without PDF if generation fails
      }

      // Send email via EmailRouter (uses user's configured senders or legacy fallback)
      await this.emailRouterService.sendEmail(
        user._id.toString(),
        client.email,
        `${frequencyLabel} Subscription Invoice from ${companyName}`,
        emailBody,
        pdfBase64,
        pdfFilename,
      );

      this.logger.log(`[Recurring Automail] Email sent to ${client.email} for recurring ${recurring._id}`);

      // Update recurring billing with next billing date
      const nextBillingDate = this.getNextBillingDate(
        recurring.nextBillingDate,
        recurring.frequency,
      );

      await this.recurringModel.findByIdAndUpdate(
        recurring._id,
        {
          nextBillingDate,
          lastGeneratedAt: new Date(),
        },
        { new: true },
      );

      this.logger.log(
        `[Recurring Automail] Updated recurring ${recurring._id}. Next billing date: ${nextBillingDate.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `[Recurring Automail] Failed to process recurring automail:`,
        error,
      );
      throw error;
    }
  }

  private applyAutoMessageVariables(
    template: string | undefined,
    context: { clientName: string; companyName: string; frequencyLabel: string },
  ): string {
    if (!template || !template.trim()) {
      return '';
    }

    return template
      .replace(/\{\{clientName\}\}/g, context.clientName)
      .replace(/\{\{companyName\}\}/g, context.companyName)
      .replace(/\{\{frequency\}\}/g, context.frequencyLabel.toLowerCase());
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Public test method to manually trigger automail check (for development/testing)
  async testTriggerRecurringAutomail() {
    this.logger.warn('[Recurring Automail] TEST TRIGGER - Running automail check now (ignoring timezone)');
    
    try {
      // Find all recurring billings with autoSendReminder enabled
      const recurringBillings = await this.recurringModel
        .find({
          isActive: true,
          autoSendReminder: true,
          isDeleted: false,
        })
        .populate('userId')
        .populate('clientId')
        .exec();

      this.logger.log(`[Recurring Automail] TEST - Checking ${recurringBillings.length} recurring billings...`);

      let processed = 0;
      let skipped = 0;
      const errors: any[] = [];

      for (const recurring of recurringBillings) {
        try {
          const user = recurring.userId as any;
          const client = recurring.clientId as any;

          // Validate client email exists
          if (!client?.email) {
            errors.push({
              recurringId: recurring._id.toString(),
              error: 'Missing client email',
            });
            skipped++;
            continue;
          }

          // TEST mode: process all active recurring entries regardless of nextBillingDate/time.
          this.logger.log(
            `[Recurring Automail] TEST - Processing recurring ${recurring._id} (nextBillingDate: ${new Date(recurring.nextBillingDate).toDateString()})`,
          );
          await this.processRecurringAutomail(recurring);
          processed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `[Recurring Automail] TEST - Error processing recurring ${recurring._id}: ${errorMsg}`,
            error,
          );
          errors.push({
            recurringId: recurring._id.toString(),
            error: errorMsg,
          });
        }
      }

      return {
        message: 'TEST: Recurring automail check completed',
        total: recurringBillings.length,
        processed,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        note: 'This test mode processes all active recurring billings with autoSendReminder enabled, regardless of date/time.',
      };
    } catch (error) {
      this.logger.error('[Recurring Automail] TEST - Error:', error);
      throw error;
    }
  }

  private getNextBillingDate(currentDate: Date, frequency: RecurringFrequency): Date {
    const date = new Date(currentDate);
    switch (frequency) {
      case RecurringFrequency.WEEKLY:
        date.setDate(date.getDate() + 7);
        return date;
      case RecurringFrequency.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        return date;
      case RecurringFrequency.QUARTERLY:
        date.setMonth(date.getMonth() + 3);
        return date;
      case RecurringFrequency.YEARLY:
        date.setFullYear(date.getFullYear() + 1);
        return date;
      default:
        date.setMonth(date.getMonth() + 1);
        return date;
    }
  }

  private getFrequencyLabel(frequency: RecurringFrequency): string {
    const labels: Record<string, string> = {
      [RecurringFrequency.WEEKLY]: 'Weekly',
      [RecurringFrequency.MONTHLY]: 'Monthly',
      [RecurringFrequency.QUARTERLY]: 'Quarterly',
      [RecurringFrequency.YEARLY]: 'Yearly',
    };
    return labels[frequency] || 'Recurring';
  }
}
