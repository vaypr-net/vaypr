import { useLocalStorage } from './useLocalStorage';
import { Client, Invoice, Payment, Expense, RecurringBilling, Reminder, DashboardStats, Quote, ReceiptVoucher, QuoteTimelineEvent } from '@/types/app';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useCallback } from 'react';

export function useClients() {
  const { user } = useAuth();
  const key = user ? `fintrack_clients_${user.id}` : 'fintrack_clients';
  const [clients, setClients] = useLocalStorage<Client[]>(key, []);

  const addClient = useCallback((client: Omit<Client, 'id' | 'createdAt' | 'totalBilled' | 'totalPaid'>) => {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      totalBilled: 0,
      totalPaid: 0,
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, [setClients]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, [setClients]);

  return { clients, addClient, updateClient, deleteClient };
}

export function useInvoices() {
  const { user } = useAuth();
  const key = user ? `fintrack_invoices_${user.id}` : 'fintrack_invoices';
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(key, []);

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  }, [setInvoices]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [setInvoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  }, [setInvoices]);

  const markAsPaid = useCallback((id: string) => {
    setInvoices(prev => prev.map(i => 
      i.id === id ? { ...i, status: 'paid' as const, paidAt: new Date().toISOString() } : i
    ));
  }, [setInvoices]);

  return { invoices, addInvoice, updateInvoice, deleteInvoice, markAsPaid };
}

export function useQuotes() {
  const { user } = useAuth();
  const key = user ? `fintrack_quotes_${user.id}` : 'fintrack_quotes';
  const [quotes, setQuotes] = useLocalStorage<Quote[]>(key, []);

  const addTimelineEvent = useCallback((quoteId: string, type: QuoteTimelineEvent['type'], message?: string) => {
    const event: QuoteTimelineEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      message,
    };
    setQuotes(prev => prev.map(q => 
      q.id === quoteId 
        ? { ...q, timeline: [...(q.timeline || []), event] } 
        : q
    ));
    return event;
  }, [setQuotes]);

  const addQuote = useCallback((quote: Omit<Quote, 'id' | 'createdAt'>) => {
    const createdEvent: QuoteTimelineEvent = {
      id: crypto.randomUUID(),
      type: 'created',
      timestamp: new Date().toISOString(),
    };
    const newQuote: Quote = {
      ...quote,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      timeline: [createdEvent],
    };
    setQuotes(prev => [...prev, newQuote]);
    return newQuote;
  }, [setQuotes]);

  const updateQuote = useCallback((id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, [setQuotes]);

  const deleteQuote = useCallback((id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  }, [setQuotes]);

  const markAsSent = useCallback((id: string) => {
    const sentEvent: QuoteTimelineEvent = {
      id: crypto.randomUUID(),
      type: 'sent',
      timestamp: new Date().toISOString(),
    };
    setQuotes(prev => prev.map(q => 
      q.id === id 
        ? { ...q, status: 'sent' as const, timeline: [...(q.timeline || []), sentEvent] } 
        : q
    ));
  }, [setQuotes]);

  const markAsAccepted = useCallback((id: string) => {
    const acceptEvent: QuoteTimelineEvent = {
      id: crypto.randomUUID(),
      type: 'accepted',
      timestamp: new Date().toISOString(),
    };
    setQuotes(prev => prev.map(q => 
      q.id === id 
        ? { ...q, status: 'accepted' as const, timeline: [...(q.timeline || []), acceptEvent] } 
        : q
    ));
  }, [setQuotes]);

  const markAsRejected = useCallback((id: string) => {
    const rejectEvent: QuoteTimelineEvent = {
      id: crypto.randomUUID(),
      type: 'rejected',
      timestamp: new Date().toISOString(),
    };
    setQuotes(prev => prev.map(q => 
      q.id === id 
        ? { ...q, status: 'rejected' as const, timeline: [...(q.timeline || []), rejectEvent] } 
        : q
    ));
  }, [setQuotes]);

  const markAsConverted = useCallback((id: string, invoiceId: string) => {
    setQuotes(prev => prev.map(q => 
      q.id === id ? { ...q, status: 'converted' as const, convertedToInvoiceId: invoiceId } : q
    ));
  }, [setQuotes]);

  return { quotes, addQuote, updateQuote, deleteQuote, markAsSent, markAsAccepted, markAsRejected, markAsConverted, addTimelineEvent };
}

export function useReceipts() {
  const { user } = useAuth();
  const key = user ? `fintrack_receipts_${user.id}` : 'fintrack_receipts';
  const [receipts, setReceipts] = useLocalStorage<ReceiptVoucher[]>(key, []);

  const addReceipt = useCallback((receipt: Omit<ReceiptVoucher, 'id' | 'createdAt'>) => {
    const newReceipt: ReceiptVoucher = {
      ...receipt,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setReceipts(prev => [...prev, newReceipt]);
    return newReceipt;
  }, [setReceipts]);

  const updateReceipt = useCallback((id: string, updates: Partial<ReceiptVoucher>) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [setReceipts]);

  const deleteReceipt = useCallback((id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  }, [setReceipts]);

  const markAsIssued = useCallback((id: string) => {
    setReceipts(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'issued' as const } : r
    ));
  }, [setReceipts]);

  const markAsCancelled = useCallback((id: string) => {
    setReceipts(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'cancelled' as const } : r
    ));
  }, [setReceipts]);

  return { receipts, addReceipt, updateReceipt, deleteReceipt, markAsIssued, markAsCancelled };
}

export function usePayments() {
  const { user } = useAuth();
  const key = user ? `fintrack_payments_${user.id}` : 'fintrack_payments';
  const [payments, setPayments] = useLocalStorage<Payment[]>(key, []);

  const addPayment = useCallback((payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
    };
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  }, [setPayments]);

  const updatePayment = useCallback((id: string, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPayments]);

  return { payments, addPayment, updatePayment };
}

export function useExpenses() {
  const { user } = useAuth();
  const key = user ? `fintrack_expenses_${user.id}` : 'fintrack_expenses';
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(key, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
    return newExpense;
  }, [setExpenses]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [setExpenses]);

  return { expenses, addExpense, updateExpense, deleteExpense };
}

export function useRecurringBilling() {
  const { user } = useAuth();
  const key = user ? `fintrack_recurring_${user.id}` : 'fintrack_recurring';
  const [recurringBillings, setRecurringBillings] = useLocalStorage<RecurringBilling[]>(key, []);

  const addRecurring = useCallback((recurring: Omit<RecurringBilling, 'id' | 'createdAt'>) => {
    const newRecurring: RecurringBilling = {
      ...recurring,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setRecurringBillings(prev => [...prev, newRecurring]);
    return newRecurring;
  }, [setRecurringBillings]);

  const updateRecurring = useCallback((id: string, updates: Partial<RecurringBilling>) => {
    setRecurringBillings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [setRecurringBillings]);

  const deleteRecurring = useCallback((id: string) => {
    setRecurringBillings(prev => prev.filter(r => r.id !== id));
  }, [setRecurringBillings]);

  const toggleActive = useCallback((id: string) => {
    setRecurringBillings(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  }, [setRecurringBillings]);

  return { recurringBillings, addRecurring, updateRecurring, deleteRecurring, toggleActive };
}

export function useReminders() {
  const { user } = useAuth();
  const key = user ? `fintrack_reminders_${user.id}` : 'fintrack_reminders';
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(key, []);

  const addReminder = useCallback((reminder: Omit<Reminder, 'id' | 'createdAt' | 'isRead'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setReminders(prev => [...prev, newReminder]);
    return newReminder;
  }, [setReminders]);

  const markAsRead = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r));
  }, [setReminders]);

  const markAllAsRead = useCallback(() => {
    setReminders(prev => prev.map(r => ({ ...r, isRead: true })));
  }, [setReminders]);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, [setReminders]);

  const unreadCount = useMemo(() => reminders.filter(r => !r.isRead).length, [reminders]);

  const hydrateReminders = useCallback((serverReminders: any[]) => {
    if (!Array.isArray(serverReminders)) return;
    const mapped: Reminder[] = serverReminders.map((r) => ({
      id: r._id || r.id,
      type: 'custom',
      title: r.title || 'Notification',
      message: r.message || '',
      relatedId: r.relatedId,
      dueDate: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      isRead: !!r.isRead,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
    setReminders(mapped);
  }, [setReminders]);

  return { reminders, addReminder, markAsRead, markAllAsRead, deleteReminder, unreadCount, hydrateReminders };
}

export function useDashboardStats() {
  const { invoices } = useInvoices();
  const { quotes } = useQuotes();
  const { receipts } = useReceipts();
  const { payments } = usePayments();
  const { expenses } = useExpenses();
  const { clients } = useClients();

  const stats: DashboardStats = useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const pendingQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length;
    const totalReceipts = receipts.filter(r => r.status === 'issued').length;

    const recentPayments = payments
      .filter(p => p.status === 'completed')
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .slice(0, 5);

    return {
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      overdueInvoices,
      pendingQuotes,
      totalReceipts,
      totalClients: clients.length,
      recentPayments,
    };
  }, [invoices, quotes, receipts, payments, expenses, clients]);

  return stats;
}
