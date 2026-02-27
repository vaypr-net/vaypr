import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Recurring } from '../recurring/entities/recurring.entity';
import { Client } from '../clients/entities/client.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Receipt } from '../reciept/entities/reciept.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Receipt.name) private receiptModel: Model<Receipt>,
  ) {}

  async getStats(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    const endOfMonth = new Date(startOfNextMonth.getTime() - 1);

    const userObjectId = new Types.ObjectId(userId);

    // Run all queries in parallel for better performance
    const [
      invoices,
      quotes,
      recurringBillings,
      clients,
      expenses,
      receipts,
    ] = await Promise.all([
      this.invoiceModel.find({ userId: userObjectId, isDeleted: false }).exec(),
      this.quoteModel.find({ userId: userObjectId, isDeleted: false }).exec(),
      this.recurringModel.find({ userId: userObjectId, isDeleted: false }).exec(),
      this.clientModel.find({ userId: userObjectId, isDeleted: false }).exec(),
      this.expenseModel.find({ 
        userId: userObjectId, 
        isDeleted: false,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }).exec(),
      this.receiptModel.find({ userId: userObjectId, isDeleted: false }).exec(),
    ]);

    // Calculate invoice stats
    const overdueInvoices = invoices.filter(inv => {
      // Only sent/unpaid invoices can be overdue, not drafts or paid
      if (inv.status === 'paid' || inv.status === 'draft' || inv.status === 'cancelled') return false;
      return new Date(inv.dueDate) < now;
    }).length;

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
    const sentInvoices = invoices.filter(inv => inv.status === 'sent').length;

    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const pendingRevenue = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate quote stats
    const draftQuotes = quotes.filter(q => q.status === 'draft').length;
    const sentQuotes = quotes.filter(q => q.status === 'sent').length;
    // Count as viewed if quote is currently "viewed" OR it has a viewed timestamp.
    const viewedQuotes = quotes.filter(q => q.status === 'viewed' || !!q.viewedAt).length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
    const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;
    const expiredQuotes = quotes.filter(q => q.status === 'expired').length;
    const convertedQuotes = quotes.filter(q => q.status === 'converted').length;

    // Calculate recurring billing stats
    const activeRecurring = recurringBillings.filter(r => r.isActive).length;
    const recurringThisMonth = recurringBillings.filter(r => {
      if (!r.isActive) return false;
      if (!r.nextBillingDate) return false;
      const nextBilling = new Date(r.nextBillingDate);
      if (Number.isNaN(nextBilling.getTime())) return false;
      return nextBilling >= startOfMonth && nextBilling < startOfNextMonth;
    }).length;

    // Calculate expense stats
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Recent activity
    const recentInvoices = invoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(inv => ({
        id: inv._id,
        type: 'invoice',
        number: inv.invoiceNumber,
        clientName: inv.billTo?.name || 'Unknown',
        amount: inv.total,
        status: inv.status,
        date: inv.createdAt,
      }));

    const recentQuotes = quotes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(quote => ({
        id: quote._id,
        type: 'quote',
        number: quote.quoteNumber,
        clientName: quote.billTo?.name || 'Unknown',
        amount: quote.total,
        status: quote.status,
        date: quote.createdAt,
      }));

    // Combine and sort recent activity
    const recentActivity = [...recentInvoices, ...recentQuotes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      overview: {
        totalClients: clients.length,
        totalInvoices: invoices.length,
        totalReceipts: receipts.length,
        totalQuotes: quotes.length,
        totalRecurring: recurringBillings.length,
        totalRevenue,
        pendingRevenue,
        totalExpensesThisMonth: totalExpenses,
        netIncomeThisMonth: totalRevenue - totalExpenses,
      },
      invoices: {
        total: invoices.length,
        overdue: overdueInvoices,
        paid: paidInvoices,
        draft: draftInvoices,
        sent: sentInvoices,
        totalRevenue,
        pendingRevenue,
      },
      quotes: {
        total: quotes.length,
        draft: draftQuotes,
        sent: sentQuotes,
        viewed: viewedQuotes,
        accepted: acceptedQuotes,
        rejected: rejectedQuotes,
        expired: expiredQuotes,
        converted: convertedQuotes,
      },
      recurring: {
        total: recurringBillings.length,
        active: activeRecurring,
        thisMonth: recurringThisMonth,
      },
      receipts: {
        total: receipts.length,
      },
      expenses: {
        totalThisMonth: totalExpenses,
        count: expenses.length,
      },
      recentActivity,
      recentInvoices: recentInvoices.slice(0, 5),
      recentQuotes: recentQuotes.slice(0, 5),
    };
  }
}
