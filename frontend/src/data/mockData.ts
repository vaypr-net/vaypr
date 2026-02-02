// Mock data for the VAYPR Super Admin Console

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscriptionType: "monthly" | "yearly";
  subscriptionDate: string;
  status: "active" | "inactive" | "free" | "canceled";
  lifetimeSpend: number;
  lastPaymentDate: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  amount: number;
  currency: string;
  type: "subscription" | "refund" | "chargeback";
  provider: string;
  status: "succeeded" | "failed" | "refunded" | "pending";
  date: string;
  plan: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  status: "active" | "hidden" | "archived";
  features: string[];
  limits: {
    invoices: number;
    quotes: number;
    clients: number;
    teamMembers: number;
    storage: string;
    receipts: number;
    recurringInvoices: number;
    expenseTracking: boolean;
    invoiceTemplates: string;
  };
  isPopular?: boolean;
  subscriberCount: number;
}

export interface Ticket {
  id: string;
  subject: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "in_progress" | "resolved" | "closed";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  category: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
  order: number;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  tier: string;
  referrals: number;
  earnings: number;
  pending: number;
  status: "active" | "inactive";
}

export interface Referral {
  id: string;
  affiliateId: string;
  affiliateName: string;
  subscriberId: string;
  subscriberName: string;
  plan: string;
  conversionDate: string;
  amount: number;
  commission: number;
  status: "pending" | "approved" | "paid" | "rejected";
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  objectType: string;
  objectId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface ActivityItem {
  id: string;
  type: "new_subscriber" | "upgrade" | "downgrade" | "payment" | "payment_failed" | "canceled" | "reactivated" | "ticket" | "ticket_resolved" | "affiliate" | "referral";
  title: string;
  description: string;
  timestamp: string;
}

// Mock Subscribers
export const mockSubscribers: Subscriber[] = [
  { id: "1", name: "John Smith", email: "john@acmecorp.com", company: "Acme Corp", plan: "Business", subscriptionType: "yearly", subscriptionDate: "2024-01-15", status: "active", lifetimeSpend: 2388, lastPaymentDate: "2024-12-15", avatar: "" },
  { id: "2", name: "Sarah Johnson", email: "sarah@startup.io", company: "StartUp Inc", plan: "Business", subscriptionType: "monthly", subscriptionDate: "2024-06-20", status: "active", lifetimeSpend: 174, lastPaymentDate: "2025-01-10", avatar: "" },
  { id: "3", name: "Michael Chen", email: "m.chen@bigco.com", company: "BigCo Ltd", plan: "Enterprise", subscriptionType: "yearly", subscriptionDate: "2023-08-05", status: "active", lifetimeSpend: 7164, lastPaymentDate: "2024-08-05", avatar: "" },
  { id: "4", name: "Emily Davis", email: "emily@freelance.com", company: "Davis Design", plan: "Starter", subscriptionType: "monthly", subscriptionDate: "2024-11-01", status: "free", lifetimeSpend: 0, lastPaymentDate: "-", avatar: "" },
  { id: "5", name: "Robert Wilson", email: "r.wilson@tech.co", company: "TechFlow", plan: "Starter", subscriptionType: "monthly", subscriptionDate: "2024-09-10", status: "free", lifetimeSpend: 0, lastPaymentDate: "-", avatar: "" },
  { id: "6", name: "Lisa Anderson", email: "lisa@agency.com", company: "Creative Agency", plan: "Enterprise", subscriptionType: "yearly", subscriptionDate: "2024-02-01", status: "active", lifetimeSpend: 4788, lastPaymentDate: "2025-02-01", avatar: "" },
  { id: "7", name: "James Brown", email: "james@solo.biz", company: "Solo Ventures", plan: "Starter", subscriptionType: "monthly", subscriptionDate: "2024-10-15", status: "free", lifetimeSpend: 0, lastPaymentDate: "-", avatar: "" },
  { id: "8", name: "Anna Martinez", email: "anna@design.co", company: "Design Co", plan: "Business", subscriptionType: "yearly", subscriptionDate: "2024-03-20", status: "canceled", lifetimeSpend: 796, lastPaymentDate: "2024-06-20", avatar: "" },
  { id: "9", name: "Chris Taylor", email: "chris@newbiz.com", company: "NewBiz LLC", plan: "Business", subscriptionType: "monthly", subscriptionDate: "2024-12-01", status: "inactive", lifetimeSpend: 30, lastPaymentDate: "2024-12-01", avatar: "" },
  { id: "10", name: "Rachel Green", email: "rachel@consulting.co", company: "Green Consulting", plan: "Enterprise", subscriptionType: "yearly", subscriptionDate: "2024-05-15", status: "active", lifetimeSpend: 5988, lastPaymentDate: "2024-11-15", avatar: "" },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  { id: "TXN-001", subscriberId: "1", subscriberName: "John Smith", subscriberEmail: "john@acmecorp.com", amount: 199, currency: "KWD", type: "subscription", provider: "Stripe", status: "succeeded", date: "2025-01-15", plan: "Professional" },
  { id: "TXN-002", subscriberId: "2", subscriberName: "Sarah Johnson", subscriberEmail: "sarah@startup.io", amount: 29, currency: "KWD", type: "subscription", provider: "Stripe", status: "succeeded", date: "2025-01-10", plan: "Starter" },
  { id: "TXN-003", subscriberId: "3", subscriberName: "Michael Chen", subscriberEmail: "m.chen@bigco.com", amount: 499, currency: "KWD", type: "subscription", provider: "Stripe", status: "succeeded", date: "2025-01-08", plan: "Enterprise" },
  { id: "TXN-004", subscriberId: "5", subscriberName: "Robert Wilson", subscriberEmail: "r.wilson@tech.co", amount: 99, currency: "KWD", type: "subscription", provider: "Stripe", status: "failed", date: "2025-01-10", plan: "Professional" },
  { id: "TXN-005", subscriberId: "8", subscriberName: "Anna Martinez", subscriberEmail: "anna@design.co", amount: 99, currency: "KWD", type: "refund", provider: "Stripe", status: "refunded", date: "2025-01-05", plan: "Professional" },
  { id: "TXN-006", subscriberId: "6", subscriberName: "Lisa Anderson", subscriberEmail: "lisa@agency.com", amount: 499, currency: "KWD", type: "subscription", provider: "Stripe", status: "succeeded", date: "2025-01-02", plan: "Enterprise" },
];

// Mock Plans
export const mockPlans: Plan[] = [
  { 
    id: "1", 
    name: "Starter", 
    price: 0, 
    currency: "KWD", 
    interval: "monthly", 
    status: "active", 
    features: [
      "Up to 3 Invoices per month", 
      "Up to 2 Quotes per month", 
      "Up to 3 Receipts per month", 
      "10 Clients", 
      "1 Recurring Subscription", 
      "Up to 5 Expense Tracking",
      "1 Custom Template"
    ], 
    limits: { 
      invoices: 3, 
      quotes: 2, 
      clients: 10, 
      teamMembers: 1, 
      storage: "100MB",
      receipts: 3,
      recurringInvoices: 1,
      expenseTracking: true,
      invoiceTemplates: "1 Custom"
    }, 
    subscriberCount: 245 
  },
  { 
    id: "2", 
    name: "Business", 
    price: 15, 
    currency: "KWD", 
    interval: "monthly", 
    status: "active", 
    features: [
      "Unlimited Invoices", 
      "Unlimited Quotes", 
      "Unlimited Receipts", 
      "Unlimited Clients", 
      "Recurring Subscriptions", 
      "Expense Tracking", 
      "Custom Templates", 
      "Priority Email Support"
    ], 
    limits: { 
      invoices: -1, 
      quotes: -1, 
      clients: -1, 
      teamMembers: 5, 
      storage: "10GB",
      receipts: -1,
      recurringInvoices: -1,
      expenseTracking: true,
      invoiceTemplates: "All"
    }, 
    isPopular: true, 
    subscriberCount: 1892 
  },
  { 
    id: "3", 
    name: "Enterprise", 
    price: -1, 
    currency: "KWD", 
    interval: "monthly", 
    status: "active", 
    features: [
      "Everything in Business", 
      "Graphic Designer For Templates", 
      "Ai Integration System", 
      "API Access", 
      "Dedicated Account Manager", 
      "Smart Financial Analytics", 
      "Advanced Expense Tracking", 
      "White-label Options"
    ], 
    limits: { 
      invoices: -1, 
      quotes: -1, 
      clients: -1, 
      teamMembers: -1, 
      storage: "Unlimited",
      receipts: -1,
      recurringInvoices: -1,
      expenseTracking: true,
      invoiceTemplates: "Custom"
    }, 
    subscriberCount: 156 
  },
];

// Mock Tickets
export const mockTickets: Ticket[] = [
  { id: "TKT-001", subject: "Cannot export invoices to PDF", customerId: "1", customerName: "John Smith", customerEmail: "john@acmecorp.com", priority: "high", status: "open", assignedTo: "Support Team", createdAt: "2025-01-14T10:30:00Z", updatedAt: "2025-01-14T10:30:00Z", category: "Bug" },
  { id: "TKT-002", subject: "How to upgrade my plan?", customerId: "2", customerName: "Sarah Johnson", customerEmail: "sarah@startup.io", priority: "medium", status: "resolved", assignedTo: "Admin", createdAt: "2025-01-13T14:20:00Z", updatedAt: "2025-01-13T16:45:00Z", category: "Billing" },
  { id: "TKT-003", subject: "Request for custom invoice template", customerId: "3", customerName: "Michael Chen", customerEmail: "m.chen@bigco.com", priority: "low", status: "in_progress", assignedTo: "Design Team", createdAt: "2025-01-12T09:00:00Z", updatedAt: "2025-01-14T08:30:00Z", category: "Feature" },
  { id: "TKT-004", subject: "Payment failed - urgent", customerId: "5", customerName: "Robert Wilson", customerEmail: "r.wilson@tech.co", priority: "urgent", status: "open", assignedTo: "Billing Team", createdAt: "2025-01-14T11:00:00Z", updatedAt: "2025-01-14T11:00:00Z", category: "Billing" },
  { id: "TKT-005", subject: "API integration help needed", customerId: "6", customerName: "Lisa Anderson", customerEmail: "lisa@agency.com", priority: "medium", status: "pending", assignedTo: "Tech Support", createdAt: "2025-01-11T16:00:00Z", updatedAt: "2025-01-13T10:00:00Z", category: "Technical" },
];

// Mock FAQs
export const mockFAQs: FAQ[] = [
  { id: "1", question: "How do I create my first invoice?", answer: "Navigate to the Invoices section and click 'Create Invoice'. Fill in the client details, add line items, and click 'Send' or 'Save as Draft'.", category: "Getting Started", isPublished: true, order: 1 },
  { id: "2", question: "How can I upgrade or downgrade my plan?", answer: "Go to Settings > Subscription and click 'Change Plan'. Select your new plan and confirm. Changes take effect immediately.", category: "Billing", isPublished: true, order: 2 },
  { id: "3", question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via bank transfer.", category: "Billing", isPublished: true, order: 3 },
  { id: "4", question: "How do I add team members?", answer: "Go to Settings > Team and click 'Invite Member'. Enter their email and select their role. They'll receive an invitation to join your workspace.", category: "Account", isPublished: true, order: 4 },
  { id: "5", question: "Can I customize my invoice templates?", answer: "Yes! Pro and Enterprise plans include custom branding. Go to Settings > Branding to upload your logo and customize colors.", category: "Features", isPublished: true, order: 5 },
];

// Mock Affiliates
export const mockAffiliates: Affiliate[] = [
  { id: "1", name: "Alex Turner", email: "alex@influencer.com", code: "ALEX20", tier: "Gold", referrals: 45, earnings: 4500, pending: 850, status: "active" },
  { id: "2", name: "Maria Garcia", email: "maria@blogger.com", code: "MARIA15", tier: "Silver", referrals: 28, earnings: 2100, pending: 320, status: "active" },
  { id: "3", name: "David Kim", email: "david@youtube.com", code: "DAVID25", tier: "Gold", referrals: 67, earnings: 8040, pending: 1200, status: "active" },
  { id: "4", name: "Sophie Brown", email: "sophie@review.co", code: "SOPHIE10", tier: "Bronze", referrals: 12, earnings: 720, pending: 150, status: "active" },
  { id: "5", name: "Tom Harris", email: "tom@partner.biz", code: "TOM20", tier: "Silver", referrals: 8, earnings: 480, pending: 0, status: "inactive" },
];

// Mock Referrals
export const mockReferrals: Referral[] = [
  { id: "REF-001", affiliateId: "1", affiliateName: "Alex Turner", subscriberId: "2", subscriberName: "Sarah Johnson", plan: "Starter", conversionDate: "2025-01-10", amount: 29, commission: 5.80, status: "approved" },
  { id: "REF-002", affiliateId: "3", affiliateName: "David Kim", subscriberId: "3", subscriberName: "Michael Chen", plan: "Enterprise", conversionDate: "2025-01-08", amount: 499, commission: 99.80, status: "pending" },
  { id: "REF-003", affiliateId: "2", affiliateName: "Maria Garcia", subscriberId: "6", subscriberName: "Lisa Anderson", plan: "Professional", conversionDate: "2025-01-05", amount: 99, commission: 14.85, status: "paid" },
  { id: "REF-004", affiliateId: "1", affiliateName: "Alex Turner", subscriberId: "1", subscriberName: "John Smith", plan: "Professional", conversionDate: "2025-01-02", amount: 199, commission: 39.80, status: "approved" },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  { id: "1", userId: "admin1", userName: "Super Admin", action: "update", objectType: "subscriber", objectId: "1", details: "Updated subscription plan from Starter to Professional", timestamp: "2025-01-14T14:30:00Z", ipAddress: "192.168.1.100" },
  { id: "2", userId: "admin1", userName: "Super Admin", action: "create", objectType: "plan", objectId: "5", details: "Created new plan: Business Plus", timestamp: "2025-01-14T12:15:00Z", ipAddress: "192.168.1.100" },
  { id: "3", userId: "admin2", userName: "Support Admin", action: "update", objectType: "ticket", objectId: "TKT-002", details: "Resolved ticket and added resolution note", timestamp: "2025-01-13T16:45:00Z", ipAddress: "192.168.1.105" },
  { id: "4", userId: "admin1", userName: "Super Admin", action: "delete", objectType: "coupon", objectId: "CPN-010", details: "Deleted expired coupon: NEWYEAR2024", timestamp: "2025-01-13T10:00:00Z", ipAddress: "192.168.1.100" },
  { id: "5", userId: "admin1", userName: "Super Admin", action: "update", objectType: "api_config", objectId: "openai", details: "Updated API key for OpenAI provider", timestamp: "2025-01-12T09:30:00Z", ipAddress: "192.168.1.100" },
];

// Mock Activity Feed
export const mockActivityFeed: ActivityItem[] = [
  { id: "1", type: "new_subscriber", title: "New subscriber", description: "Emily Davis signed up for a free trial", timestamp: "2025-01-14T15:30:00Z" },
  { id: "2", type: "payment", title: "Payment succeeded", description: "John Smith - 199 KD (Professional Yearly)", timestamp: "2025-01-14T14:00:00Z" },
  { id: "3", type: "ticket", title: "New ticket created", description: "TKT-004: Payment failed - urgent", timestamp: "2025-01-14T11:00:00Z" },
  { id: "4", type: "upgrade", title: "Plan upgraded", description: "Sarah Johnson upgraded to Professional", timestamp: "2025-01-14T10:00:00Z" },
  { id: "5", type: "payment_failed", title: "Payment failed", description: "Robert Wilson - 99 KD (Professional Monthly)", timestamp: "2025-01-14T08:30:00Z" },
  { id: "6", type: "referral", title: "New referral conversion", description: "David Kim referred Michael Chen (Enterprise)", timestamp: "2025-01-13T16:00:00Z" },
  { id: "7", type: "ticket_resolved", title: "Ticket resolved", description: "TKT-002: How to upgrade my plan?", timestamp: "2025-01-13T14:30:00Z" },
  { id: "8", type: "canceled", title: "Subscription canceled", description: "Anna Martinez canceled their subscription", timestamp: "2025-01-12T12:00:00Z" },
];

// Dashboard KPIs
export const dashboardKPIs = {
  totalRegistered: 2538,
  totalPaid: 2293,
  activeSubscribers: 2156,
  inactiveSubscribers: 382,
  monthlySubscribers: 1423,
  yearlySubscribers: 733,
  mrr: 156780,
  arr: 1881360,
  totalRevenue: 4256890,
  churnRate: 2.4,
  failedPayments: 23,
};

// Chart data
export const mrrChartData = [
  { month: "Feb", mrr: 128000 },
  { month: "Mar", mrr: 132500 },
  { month: "Apr", mrr: 138200 },
  { month: "May", mrr: 141800 },
  { month: "Jun", mrr: 145600 },
  { month: "Jul", mrr: 148900 },
  { month: "Aug", mrr: 151200 },
  { month: "Sep", mrr: 153800 },
  { month: "Oct", mrr: 155100 },
  { month: "Nov", mrr: 154600 },
  { month: "Dec", mrr: 155900 },
  { month: "Jan", mrr: 156780 },
];

export const subscriberGrowthData = [
  { month: "Feb", subscribers: 1820 },
  { month: "Mar", subscribers: 1895 },
  { month: "Apr", subscribers: 1965 },
  { month: "May", subscribers: 2020 },
  { month: "Jun", subscribers: 2085 },
  { month: "Jul", subscribers: 2130 },
  { month: "Aug", subscribers: 2178 },
  { month: "Sep", subscribers: 2225 },
  { month: "Oct", subscribers: 2268 },
  { month: "Nov", subscribers: 2305 },
  { month: "Dec", subscribers: 2360 },
  { month: "Jan", subscribers: 2538 },
];

export const planDistributionData = [
  { name: "Free", value: 245, color: "#94A3B8" },
  { name: "Starter", value: 892, color: "#60A5FA" },
  { name: "Professional", value: 1245, color: "#7C3AED" },
  { name: "Enterprise", value: 156, color: "#10B981" },
];
