import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  CreditCard,
  FileCheck2,
  FileText,
  HelpCircle,
  LifeBuoy,
  Mail,
  Receipt,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Icon = typeof BookOpen;

type FeatureGuide = {
  id: string;
  title: string;
  icon: Icon;
  summary: string;
  useWhen: string;
  steps: string[];
  bestPractices: string[];
  mistakes: string[];
  related: string[];
  statuses?: { label: string; meaning: string; tone?: string }[];
};

const navItems = [
  { id: "workflow", label: "Recommended Workflow" },
  { id: "tasks", label: "Quick Task Finder" },
  { id: "features", label: "Feature Guide" },
  { id: "paths", label: "Recommended Paths" },
  { id: "templates", label: "Email Templates" },
  { id: "best-practices", label: "Best Practices" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "security", label: "Security" },
  { id: "summary", label: "Summary" },
];

const searchableTopics = [
  "clients",
  "quote",
  "invoice",
  "payment",
  "receipt",
  "recurring billing",
  "subscription",
  "expense",
  "email sender",
  "domain",
  "dashboard",
  "notification",
  "support",
  "PDF",
  "troubleshooting",
  "forgot password",
  "overdue",
  "record payment",
  "convert quote",
  "send invoice",
];

const workflowSteps = [
  {
    title: "Set up your business profile",
    description: "Add company details, logo, contact information, address, and footer before sending documents.",
    target: "Business Profile",
  },
  {
    title: "Configure sender settings",
    description: "Choose the email sender clients should see, then test delivery before sending important documents.",
    target: "Email Sender Setup",
  },
  {
    title: "Add clients",
    description: "Create accurate client records so quotes, invoices, receipts, and subscriptions reuse the right data.",
    target: "Client Management",
  },
  {
    title: "Create and send quotes",
    description: "Use quotes when work needs client approval before billing starts.",
    target: "Quote Management",
  },
  {
    title: "Track quote responses",
    description: "Watch for viewed, accepted, rejected, expired, or modification requested statuses.",
    target: "Notifications",
  },
  {
    title: "Convert accepted quotes into invoices",
    description: "Convert instead of retyping so the sales-to-billing workflow stays clean.",
    target: "Invoice Management",
  },
  {
    title: "Send invoices with payment instructions",
    description: "Confirm due dates, currency, payment method, bank details, and PDF preview before sending.",
    target: "Invoice Management",
  },
  {
    title: "Record payments when received",
    description: "Mark the invoice paid only after confirming amount, method, and payment reference.",
    target: "Receipt Vouchers",
  },
  {
    title: "Issue receipt vouchers",
    description: "Send official proof of payment after funds are confirmed.",
    target: "Receipt Vouchers",
  },
  {
    title: "Use recurring billing for repeat clients",
    description: "Set frequency, amount, dates, terms, and auto email messages for ongoing services.",
    target: "Recurring Billing",
  },
  {
    title: "Track business expenses",
    description: "Record costs with consistent categories so month-end review is easier.",
    target: "Expense Tracking",
  },
  {
    title: "Monitor dashboard, notifications, and support",
    description: "Use the dashboard for quick monitoring and support tickets when help is needed.",
    target: "Dashboard",
  },
];

const quickTasks = [
  { title: "Add a client", where: "Clients", action: "Select Add Client and save details.", keywords: "clients customer billing address" },
  { title: "Create a quote", where: "Quotes", action: "Select New Quote and add items.", keywords: "quote pricing valid until items" },
  { title: "Send a quote", where: "Quotes", action: "Use the quote action menu.", keywords: "send quote email share viewed" },
  { title: "Convert quote to invoice", where: "Quotes", action: "Select Convert to Invoice.", keywords: "accepted quote invoice convert" },
  { title: "Create an invoice", where: "Invoices or Invoice Generator", action: "Add client, items, dates, and payment details.", keywords: "invoice generator due date PDF" },
  { title: "Send invoice", where: "Invoices", action: "Use Send Invoice or Send to Email.", keywords: "send invoice email PDF sender" },
  { title: "Record payment", where: "Invoices", action: "Select Record Payment.", keywords: "payment paid overdue bank transfer cash card" },
  { title: "Issue receipt", where: "Receipts", action: "Create or open receipt and mark issued.", keywords: "receipt voucher issued payment proof" },
  { title: "Set up recurring billing", where: "Subscriptions", action: "Create recurring record and billing frequency.", keywords: "recurring billing subscription monthly yearly" },
  { title: "Track expenses", where: "Expenses", action: "Select Add Expense.", keywords: "expense category vendor accounting" },
  { title: "Configure sender", where: "Profile, Sender Settings, or Domains", action: "Choose email sender or verify domain.", keywords: "email sender gmail domain DNS" },
  { title: "Contact support", where: "Support", action: "Create a ticket.", keywords: "support ticket troubleshooting error billing technical" },
];

const statusGroups = [
  {
    label: "Quotes",
    statuses: ["Draft", "Sent", "Viewed", "Accepted", "Rejected", "Modification Requested", "Expired", "Converted"],
  },
  {
    label: "Invoices",
    statuses: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
  },
  {
    label: "Receipts",
    statuses: ["Draft", "Issued", "Cancelled"],
  },
  {
    label: "Support",
    statuses: ["Open", "Pending", "In Progress", "Resolved", "Closed"],
  },
];

const featureGuides: FeatureGuide[] = [
  {
    id: "signing-in",
    title: "Signing In",
    icon: ShieldCheck,
    summary: "Use your business email and password to access the dashboard.",
    useWhen: "Use this whenever you need to access billing, finance, sales, or client management tools.",
    steps: [
      "Open the VAYPR login page.",
      "Enter your business email and password.",
      "Select Sign In.",
      "Use password reset from the login page if you forget your password.",
    ],
    bestPractices: ["Use a strong password.", "Do not share credentials.", "Sign out on shared devices.", "Limit access to responsible team members."],
    mistakes: ["Sharing one login across multiple people.", "Staying signed in on a shared computer.", "Ignoring password reset emails you did not request."],
    related: ["Security", "Business Profile"],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Sparkles,
    summary: "Your control center for recent activity, notifications, and shortcuts.",
    useWhen: "Use the dashboard for monitoring. Complete detailed work inside feature pages such as Quotes, Invoices, Clients, or Receipts.",
    steps: [
      "Review recent invoice and quote activity.",
      "Check high-level business status.",
      "Open common actions quickly.",
      "Review notifications and move into the relevant feature page.",
    ],
    bestPractices: ["Use dashboard signals to decide what needs attention.", "Follow up on overdue invoices and quote responses.", "Open detail pages before making financial changes."],
    mistakes: ["Treating dashboard totals as a substitute for document review.", "Missing notification activity.", "Ignoring support tickets that need a reply."],
    related: ["Notifications", "Invoices", "Quotes", "Support"],
  },
  {
    id: "business-profile",
    title: "Business Profile",
    icon: Building2,
    summary: "Company details that appear on quotes, invoices, receipts, PDFs, and emails.",
    useWhen: "Complete this before sending any client-facing document.",
    steps: [
      "Open Profile.",
      "Add business name, contact name, email, phone, and address.",
      "Upload a clear logo or profile image.",
      "Add footer information such as address, website, or office number.",
      "Review plan, usage, billing status, and upgrade options if shown.",
    ],
    bestPractices: ["Keep business name consistent.", "Confirm phone, email, and address.", "Preview documents before sending.", "Review subscription limits before busy billing periods."],
    mistakes: ["Sending documents with missing company details.", "Using a blurry logo.", "Forgetting to update footer or contact information."],
    related: ["Email Sender Setup", "Invoices", "Receipts"],
  },
  {
    id: "email-sender",
    title: "Email Sender Setup",
    icon: Mail,
    summary: "Choose how document emails are sent to clients.",
    useWhen: "Configure this before sending quotes, invoices, recurring invoices, or receipts.",
    steps: [
      "Choose default login email for quick setup.",
      "Choose Gmail sender when sending through a connected Google account.",
      "Choose verified domain sender for branded business email delivery.",
      "Send a test message before critical documents.",
    ],
    bestPractices: ["Use a professional business email.", "Monitor the reply-to inbox.", "Confirm the sender before sending.", "Use verified domain sending for the most branded experience."],
    mistakes: ["Sending from an unmonitored inbox.", "Using a personal email for business billing.", "Changing sender settings right before a critical send without testing."],
    related: ["Domain Management", "Send Invoice", "Send Quote"],
  },
  {
    id: "domains",
    title: "Domain Management",
    icon: Send,
    summary: "Verify a business domain so emails can be sent from branded addresses.",
    useWhen: "Use domains when you want a professional sender using your company domain.",
    steps: [
      "Open Domains.",
      "Start the setup wizard and enter your domain name.",
      "Select your DNS provider: Cloudflare, GoDaddy, Namecheap, Hostinger, AWS Route 53, DigitalOcean, or Other.",
      "Copy the DNS records shown by VAYPR.",
      "Add the records inside your DNS provider account.",
      "Return to VAYPR and verify the domain.",
    ],
    bestPractices: ["Copy DNS records exactly.", "Allow time for DNS propagation.", "Ask your domain admin if you do not manage DNS.", "Retry verification after propagation."],
    mistakes: ["Editing the wrong DNS zone.", "Adding records with extra spaces or missing values.", "Expecting verification to work instantly every time."],
    related: ["Email Sender Setup", "Troubleshooting"],
  },
  {
    id: "clients",
    title: "Client Management",
    icon: Users,
    summary: "Store customer details used across quotes, invoices, receipts, and recurring billing.",
    useWhen: "Add or update clients before creating documents for them.",
    steps: [
      "Open Clients and select Add Client.",
      "Choose Individual or Company.",
      "Enter name or company name.",
      "Add email, phone, address, and useful notes.",
      "Save the client.",
      "Use Edit from the action menu when details change.",
      "Export clients to CSV or Excel when needed.",
    ],
    bestPractices: ["Check spelling and billing address.", "Keep the email current.", "Avoid duplicate records.", "Review document history before billing an existing client."],
    mistakes: ["Creating duplicates instead of editing.", "Sending to an old email.", "Leaving company names incomplete."],
    related: ["Quotes", "Invoices", "Receipts", "Recurring Billing"],
  },
  {
    id: "quotes",
    title: "Quote Management",
    icon: FileText,
    summary: "Quotes help clients review pricing and scope before approving work.",
    useWhen: "Use quotes before a sale, project, or service needs client approval.",
    steps: [
      "Open Quotes and select New Quote.",
      "Choose a client or enter client details.",
      "Add quote date and valid-until date.",
      "Add items or services with quantity and unit price.",
      "Add discount, delivery fee, currency, notes, terms, payment details, or bank information if needed.",
      "Preview, save, and send the quote.",
      "If accepted, select Convert to Invoice from the action menu.",
    ],
    bestPractices: ["Use clear item names.", "Add valid-until dates.", "Confirm currency.", "Preview before sharing.", "Convert accepted quotes instead of recreating invoices manually."],
    mistakes: ["Leaving quotes without expiry dates.", "Ignoring modification requests.", "Changing a quote but forgetting to resend it."],
    related: ["Clients", "Invoices", "Notifications"],
    statuses: [
      { label: "Draft", meaning: "Created but not sent." },
      { label: "Sent", meaning: "Sent to the client." },
      { label: "Viewed", meaning: "Client opened it." },
      { label: "Accepted", meaning: "Client approved it.", tone: "success" },
      { label: "Rejected", meaning: "Client declined it.", tone: "danger" },
      { label: "Modification Requested", meaning: "Client asked for changes." },
      { label: "Expired", meaning: "Valid-until date passed.", tone: "warning" },
      { label: "Converted", meaning: "Turned into an invoice." },
    ],
  },
  {
    id: "invoices",
    title: "Invoice Management",
    icon: FileCheck2,
    summary: "Invoices request payment from clients and can be emailed with PDF attachments.",
    useWhen: "Use invoices when a client needs to pay for goods, services, retainers, or approved quote work.",
    steps: [
      "Open Invoices or Invoice Generator.",
      "Choose the client and enter issue date and due date.",
      "Add line items, quantities, unit prices, discount, delivery fee, and tax if applicable.",
      "Select currency and add payment method, bank details, and terms.",
      "Preview and save.",
      "Use Send Invoice or Send to Email from the action menu.",
      "Record payment after funds are received.",
    ],
    bestPractices: ["Check invoice number and dates.", "Confirm payment instructions.", "Preview the PDF.", "Record payments immediately after confirmation."],
    mistakes: ["Sending with missing payment instructions.", "Marking paid before funds arrive.", "Using the wrong client or currency."],
    related: ["Receipts", "Recurring Billing", "Email Sender Setup"],
    statuses: [
      { label: "Draft", meaning: "Prepared but not sent." },
      { label: "Sent", meaning: "Sent to client." },
      { label: "Paid", meaning: "Payment recorded.", tone: "success" },
      { label: "Overdue", meaning: "Due date passed.", tone: "warning" },
      { label: "Cancelled", meaning: "No longer valid.", tone: "danger" },
    ],
  },
  {
    id: "receipts",
    title: "Receipt Vouchers",
    icon: Receipt,
    summary: "Receipts confirm that your business received payment.",
    useWhen: "Issue receipts after payment is confirmed.",
    steps: [
      "Open Receipts and select New Receipt.",
      "Optionally select the related invoice.",
      "Choose client or received-from name.",
      "Enter amount, currency, payment method, and reason for payment.",
      "Save, mark as issued, and send by email if needed.",
    ],
    bestPractices: ["Issue only after payment confirmation.", "Link receipts to invoices when possible.", "Use clear payment reasons.", "Confirm amount, currency, and method."],
    mistakes: ["Issuing before payment confirmation.", "Using the wrong amount.", "Forgetting to connect the receipt to the invoice."],
    related: ["Invoices", "Record Payment"],
    statuses: [
      { label: "Draft", meaning: "Created but not finalized." },
      { label: "Issued", meaning: "Official receipt issued.", tone: "success" },
      { label: "Cancelled", meaning: "No longer valid.", tone: "danger" },
    ],
  },
  {
    id: "recurring",
    title: "Recurring Billing and Subscriptions",
    icon: RefreshCcw,
    summary: "Automate repeat billing for subscriptions, retainers, maintenance, or ongoing work.",
    useWhen: "Use recurring billing for clients billed weekly, monthly, quarterly, or yearly.",
    steps: [
      "Open Subscriptions and create a recurring record.",
      "Choose client, frequency, amount, currency, description, and billing dates.",
      "Add payment terms, bank details, client email, and optional auto email reminders.",
      "Generate a recurring invoice from the action menu.",
      "Review, save, or send the invoice.",
    ],
    bestPractices: ["Confirm frequency.", "Keep client email current.", "Review generated invoices.", "Update scope or pricing when contracts change.", "Pause or stop if a client cancels."],
    mistakes: ["Forgetting to update price changes.", "Sending to an old email.", "Leaving cancelled clients active."],
    related: ["Invoices", "Clients", "Email Templates"],
  },
  {
    id: "expenses",
    title: "Expense Tracking",
    icon: WalletCards,
    summary: "Record business costs for accounting review and monthly performance checks.",
    useWhen: "Use expenses whenever the business pays for operational costs, vendors, tools, travel, or services.",
    steps: [
      "Open Expenses and select Add Expense.",
      "Enter description, amount, currency, category, vendor, and notes.",
      "Add a custom category from the category dropdown if needed.",
      "Save and export records for accounting when required.",
    ],
    bestPractices: ["Record regularly.", "Use consistent categories.", "Add vendor names.", "Include useful notes.", "Review totals monthly."],
    mistakes: ["Using inconsistent category names.", "Waiting until month-end to enter everything.", "Leaving vendor names blank when they matter for accounting."],
    related: ["Month-End Review", "Dashboard"],
  },
  {
    id: "generator",
    title: "Invoice Generator",
    icon: ClipboardCheck,
    summary: "A quick workspace for creating invoices, quotes, and receipts with live preview.",
    useWhen: "Use it when you want to prepare a document quickly and preview formatting while editing.",
    steps: ["Open Invoice Generator.", "Choose invoice, quote, or receipt.", "Fill in details.", "Preview the document.", "Save, download, print, or continue editing."],
    bestPractices: ["Use preview before sending.", "Check totals and currency.", "Download PDFs when you need external records."],
    mistakes: ["Skipping preview.", "Saving a draft without completing client details.", "Assuming hidden columns are visible to clients."],
    related: ["Invoices", "Quotes", "Receipts"],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    summary: "Notifications help you respond to client activity and system reminders.",
    useWhen: "Use notifications to track quote views, acceptances, declines, modification requests, and reminders.",
    steps: ["Open the notification dropdown or page.", "Review unread items.", "Open the related quote, invoice, or ticket.", "Mark items as read after handling them."],
    bestPractices: ["Review notifications daily.", "Follow up quickly on quote activity.", "Do not let modification requests sit unanswered."],
    mistakes: ["Missing client responses.", "Marking as read before taking action.", "Using notifications as the only record of a document."],
    related: ["Dashboard", "Quotes", "Support"],
  },
  {
    id: "support",
    title: "Support Tickets",
    icon: LifeBuoy,
    summary: "Contact VAYPR support with clear details when you need help.",
    useWhen: "Use support for billing, technical, account, feature request, or general issues.",
    steps: [
      "Open Support and select Create Ticket.",
      "Enter customer information and a clear subject.",
      "Choose category and priority: Low, Medium, High, or Urgent.",
      "Describe expected behavior, actual behavior, and affected document numbers.",
      "Attach screenshots or error messages if available.",
      "Submit and monitor replies.",
    ],
    bestPractices: ["Use clear subjects.", "Include document numbers.", "Set priority based on business impact.", "Add screenshots when helpful."],
    mistakes: ["Writing vague tickets.", "Omitting invoice or quote numbers.", "Selecting urgent when the issue is not blocking business."],
    related: ["Troubleshooting", "Dashboard"],
    statuses: [
      { label: "Open", meaning: "Ticket created." },
      { label: "Pending", meaning: "Waiting for information or next action." },
      { label: "In Progress", meaning: "Support is working on it." },
      { label: "Resolved", meaning: "Solution provided.", tone: "success" },
      { label: "Closed", meaning: "Ticket complete." },
    ],
  },
];

const recommendedPaths = [
  {
    title: "New Client Process",
    steps: ["Add client in Clients.", "Confirm email and billing address.", "Create quote.", "Send quote for approval.", "Convert accepted quote to invoice.", "Send invoice.", "Record payment.", "Issue receipt."],
  },
  {
    title: "Existing Client Process",
    steps: ["Search for client.", "Review past documents if needed.", "Create quote or invoice.", "Send document.", "Track status and payment."],
  },
  {
    title: "Recurring Client Process",
    steps: ["Create or confirm client record.", "Set up recurring billing.", "Configure auto email message.", "Generate or send recurring invoices.", "Record payments.", "Issue receipts."],
  },
  {
    title: "Expense Review Process",
    steps: ["Record expenses regularly.", "Use consistent categories.", "Review totals monthly.", "Export or share with accounting."],
  },
  {
    title: "Month-End Review Process",
    steps: ["Review sent and accepted quotes.", "Check outstanding and paid invoices.", "Review issued receipts and overdue payments.", "Confirm recurring billing records.", "Review expenses by category.", "Close unresolved support tickets."],
  },
];

const emailTemplates = [
  {
    title: "Quote Email",
    text: "Hello {{clientName}},\n\nPlease find your quote attached or available through the link provided.\n\nKindly review the items, pricing, and terms. You may accept the quote, decline it, or request changes if anything needs adjustment.\n\nThank you.",
  },
  {
    title: "Invoice Email",
    text: "Hello {{clientName}},\n\nPlease find your invoice attached.\n\nInvoice Number: {{invoiceNumber}}\nAmount Due: {{amount}} {{currency}}\nDue Date: {{dueDate}}\n\nPlease follow the payment instructions included on the invoice.\n\nThank you.",
  },
  {
    title: "Payment Follow-Up",
    text: "Hello {{clientName}},\n\nI hope you are well.\n\nThis is a friendly follow-up regarding Invoice {{invoiceNumber}}, which is currently pending payment.\n\nPlease let us know if you need the invoice resent or if payment has already been made.\n\nThank you.",
  },
  {
    title: "Receipt Email",
    text: "Hello {{clientName}},\n\nThank you for your payment.\n\nPlease find your receipt voucher attached for your records.\n\nThank you.",
  },
  {
    title: "Quote Modification Response",
    text: "Hello {{clientName}},\n\nThank you for your feedback on the quote.\n\nWe have reviewed your requested changes and updated the quote accordingly. Please review the revised version and let us know if anything else is needed.\n\nThank you.",
  },
];

const bestPractices = [
  "Add clients before creating documents.",
  "Preview every document before sending.",
  "Use valid-until dates on quotes.",
  "Keep client emails accurate.",
  "Confirm currency before sending quotes or invoices.",
  "Record payments immediately after funds are received.",
  "Issue receipts only after payment confirmation.",
  "Use recurring billing for repeat clients.",
  "Keep expense categories consistent.",
  "Use branded sender emails for professional appearance.",
  "Download important PDFs for external records.",
  "Monitor notifications so client responses are not missed.",
];

const commonMistakes = [
  "Sending documents with incomplete company details.",
  "Using the wrong client email.",
  "Creating duplicate client records.",
  "Forgetting to record payment.",
  "Issuing receipts before payment confirmation.",
  "Leaving quotes without valid-until dates.",
  "Not updating quotes after modification requests.",
  "Sending invoices with missing payment instructions.",
  "Using inconsistent expense categories.",
  "Deleting records before confirming they are no longer needed.",
];

const troubleshooting = [
  {
    problem: "Client did not receive email",
    check: ["Client email address.", "Sender email configuration.", "Client spam or junk folder.", "Domain verification if using branded sending."],
    action: "Correct issues and resend the document.",
  },
  {
    problem: "Quote was viewed but not accepted",
    check: ["Client may still be reviewing.", "Client may need changes.", "Quote may be missing detail or terms."],
    action: "Follow up or send a revised quote.",
  },
  {
    problem: "Client requested changes",
    check: ["Client message.", "Items, quantity, price, delivery fee, discount, terms, and valid-until date."],
    action: "Open the quote, edit it, save the updated quote, and resend.",
  },
  {
    problem: "Invoice is paid but still shows unpaid",
    check: ["Payment amount.", "Payment method.", "Payment reference.", "Whether Record Payment was saved."],
    action: "Open the invoice and record payment manually.",
  },
  {
    problem: "PDF does not look right",
    check: ["Logo size.", "Company footer.", "Hidden quantity or unit price settings.", "Currency.", "Notes and payment terms."],
    action: "Correct the document and regenerate the PDF.",
  },
  {
    problem: "Domain verification fails",
    check: ["DNS records match exactly.", "Correct DNS provider account.", "Propagation time has passed."],
    action: "Wait, verify again, or ask the domain administrator for help.",
  },
  {
    problem: "Forgot password",
    check: ["Correct business email.", "Password reset email inbox.", "Spam or junk folder."],
    action: "Use password reset from the login page and follow the email instructions.",
  },
  {
    problem: "Overdue invoice needs follow-up",
    check: ["Due date.", "Client email.", "Payment instructions.", "Whether payment was already received offline."],
    action: "Send a payment follow-up and record payment once confirmed.",
  },
];

const securityRecommendations = [
  "Use a strong password.",
  "Do not share credentials.",
  "Sign out on shared devices.",
  "Keep sender emails controlled.",
  "Verify payment details before sending invoices.",
  "Protect client data.",
  "Limit access to responsible staff.",
  "Be careful downloading or sharing PDFs.",
  "Confirm client identity before changing billing or payment instructions.",
];

const finalSummary = [
  "Create client records.",
  "Send quotes.",
  "Track client decisions.",
  "Convert approved quotes to invoices.",
  "Send invoices.",
  "Record payments.",
  "Issue receipts.",
  "Manage recurring billing.",
  "Track expenses.",
  "Stay organized with dashboard, notifications, and support.",
];

function includesQuery(query: string, values: string[]) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return values.join(" ").toLowerCase().includes(normalized);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionHeader({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">{eyebrow}</p>
      <h2 className="text-3xl font-display font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-3xl">{description}</p>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone?: string }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export default function UserManual() {
  const [search, setSearch] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const query = search.trim().toLowerCase();

  const filteredTasks = useMemo(
    () => quickTasks.filter((task) => includesQuery(query, [task.title, task.where, task.action, task.keywords])),
    [query],
  );

  const filteredFeatures = useMemo(
    () =>
      featureGuides.filter((feature) =>
        includesQuery(query, [
          feature.title,
          feature.summary,
          feature.useWhen,
          ...feature.steps,
          ...feature.bestPractices,
          ...feature.mistakes,
          ...feature.related,
          ...(feature.statuses?.flatMap((status) => [status.label, status.meaning]) ?? []),
        ]),
      ),
    [query],
  );

  const filteredTroubleshooting = useMemo(
    () =>
      troubleshooting.filter((item) =>
        includesQuery(query, [item.problem, ...item.check, item.action, "troubleshooting issue problem"]),
      ),
    [query],
  );

  const filteredTemplates = useMemo(
    () => emailTemplates.filter((template) => includesQuery(query, [template.title, template.text, "email template copy"])),
    [query],
  );

  const hasFilteredContent =
    filteredTasks.length > 0 ||
    filteredFeatures.length > 0 ||
    filteredTroubleshooting.length > 0 ||
    filteredTemplates.length > 0 ||
    includesQuery(query, [...workflowSteps.flatMap((step) => [step.title, step.description, step.target]), "workflow"]) ||
    includesQuery(query, bestPractices) ||
    includesQuery(query, commonMistakes) ||
    includesQuery(query, securityRecommendations);

  const copyTemplate = async (title: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTemplate(title);
    window.setTimeout(() => setCopiedTemplate(null), 1800);
  };

  return (
    <div className="bg-background">
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">User Manual</p>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
              VAYPR User Manual
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Learn how to use VAYPR, follow recommended workflows, and quickly solve common issues.
            </p>

            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search the manual..."
                  className="h-14 rounded-xl pl-12 text-base shadow-sm"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Search by task, feature, or issue.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {searchableTopics.slice(0, 10).map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSearch(topic)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              {[
                { title: "Recommended Workflow", icon: ClipboardCheck, target: "workflow" },
                { title: "Create a Quote", icon: FileText, target: "quotes" },
                { title: "Send an Invoice", icon: Send, target: "invoices" },
                { title: "Troubleshooting", icon: HelpCircle, target: "troubleshooting" },
              ].map(({ title, icon: Icon, target }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => scrollToSection(target)}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <Icon className="h-5 w-5 text-primary mb-3" />
                  <span className="block font-semibold text-foreground">{title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">Jump to section</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground mb-3">On this page</p>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 space-y-16">
              <div className="lg:hidden -mx-4 overflow-x-auto border-y border-border bg-muted/30 px-4 py-3">
                <div className="flex w-max gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {!hasFilteredContent && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-xl font-semibold text-foreground">No matching guide topics found</h2>
                    <p className="mt-2 text-muted-foreground">Try searching for invoice, quote, payment, domain, receipt, or support.</p>
                    <Button variant="outline" className="mt-5" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  </CardContent>
                </Card>
              )}

              {includesQuery(query, [...workflowSteps.flatMap((step) => [step.title, step.description, step.target]), "workflow recommended process"]) && (
                <section className="space-y-6">
                  <SectionHeader
                    id="workflow"
                    eyebrow="Recommended Workflow"
                    title="Run billing in the right order"
                    description="Follow this workflow to keep client records, approvals, invoices, payments, and receipts connected."
                  />
                  <div className="grid gap-4">
                    {workflowSteps.map((step, index) => (
                      <Card key={step.title} className="overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                                </div>
                                <Badge variant="outline" className="w-fit shrink-0">
                                  {step.target}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {filteredTasks.length > 0 && (
                <section className="space-y-6">
                  <SectionHeader
                    id="tasks"
                    eyebrow="Quick Task Finder"
                    title="What do you want to do?"
                    description="Use these quick cards when you know the task but need to know where to go."
                  />
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                      <Card key={task.title}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription>Where: {task.where}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{task.action}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {filteredFeatures.length > 0 && (
                <section className="space-y-6">
                  <SectionHeader
                    id="features"
                    eyebrow="Feature Guide"
                    title="How each major feature works"
                    description="Open a feature to see what it is, when to use it, step-by-step instructions, best practices, and mistakes to avoid."
                  />
                  <div className="grid gap-4">
                    <Alert className="border-primary/20 bg-primary/5">
                      <HelpCircle className="h-4 w-4" />
                      <AlertTitle>Tip</AlertTitle>
                      <AlertDescription>
                        Start with Clients, Quotes, and Invoices. Those three features drive most VAYPR workflows.
                      </AlertDescription>
                    </Alert>
                    <Accordion type="multiple" className="space-y-4">
                      {filteredFeatures.map((feature) => (
                        <AccordionItem
                          key={feature.id}
                          id={feature.id}
                          value={feature.id}
                          className="scroll-mt-28 rounded-lg border border-border bg-card px-5 shadow-sm"
                        >
                          <AccordionTrigger className="gap-4 text-left hover:no-underline">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <feature.icon className="h-5 w-5 text-primary" />
                              </span>
                              <span>
                                <span className="block text-lg font-semibold text-foreground">{feature.title}</span>
                                <span className="block text-sm font-normal text-muted-foreground">{feature.summary}</span>
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-6 text-sm text-muted-foreground">
                            <div className="rounded-lg bg-muted/40 p-4">
                              <p className="font-medium text-foreground">When to use it</p>
                              <p className="mt-1">{feature.useWhen}</p>
                            </div>

                            {feature.statuses && (
                              <div>
                                <p className="mb-3 font-medium text-foreground">Statuses</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {feature.statuses.map((status) => (
                                    <div key={status.label} className="rounded-lg border border-border p-3">
                                      <StatusBadge label={status.label} tone={status.tone} />
                                      <p className="mt-2 text-xs">{status.meaning}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid gap-5 lg:grid-cols-3">
                              <div>
                                <p className="mb-3 font-medium text-foreground">Steps</p>
                                <ol className="space-y-2">
                                  {feature.steps.map((step, index) => (
                                    <li key={step} className="flex gap-2">
                                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                        {index + 1}
                                      </span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              <div>
                                <p className="mb-3 font-medium text-foreground">Best practices</p>
                                <ul className="space-y-2">
                                  {feature.bestPractices.map((practice) => (
                                    <li key={practice} className="flex gap-2">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                      <span>{practice}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="mb-3 font-medium text-foreground">Avoid</p>
                                <ul className="space-y-2">
                                  {feature.mistakes.map((mistake) => (
                                    <li key={mistake} className="flex gap-2">
                                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                      <span>{mistake}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {feature.related.map((item) => (
                                <Badge key={item} variant="secondary">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </section>
              )}

              {includesQuery(query, recommendedPaths.flatMap((path) => [path.title, ...path.steps, "recommended paths process"])) && (
                <section className="space-y-6">
                  <SectionHeader
                    id="paths"
                    eyebrow="Recommended Paths"
                    title="Common workflows by task"
                    description="Use these paths when you need a clear process for a client, recurring account, expense review, or month-end review."
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    {recommendedPaths.map((path) => (
                      <Card key={path.title}>
                        <CardHeader>
                          <CardTitle className="text-xl">{path.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-3 text-sm text-muted-foreground">
                            {path.steps.map((step, index) => (
                              <li key={step} className="flex gap-3">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {filteredTemplates.length > 0 && (
                <section className="space-y-6">
                  <SectionHeader
                    id="templates"
                    eyebrow="Email Templates"
                    title="Copy-ready messages"
                    description="Use these templates as a starting point when sending documents or following up."
                  />
                  <div className="grid gap-4">
                    {filteredTemplates.map((template) => (
                      <Card key={template.title}>
                        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                          <div>
                            <CardTitle className="text-xl">{template.title}</CardTitle>
                            <CardDescription>Ready to customize before sending.</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => copyTemplate(template.title, template.text)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {copiedTemplate === template.title ? "Copied" : "Copy"}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground font-sans">
                            {template.text}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {includesQuery(query, bestPractices) && (
                <section className="space-y-6">
                  <SectionHeader
                    id="best-practices"
                    eyebrow="Best Practices"
                    title="Keep billing clean and professional"
                    description="Use this checklist to reduce mistakes before documents reach clients."
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    {bestPractices.map((practice) => (
                      <div key={practice} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <p className="text-sm text-muted-foreground">{practice}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {includesQuery(query, commonMistakes) && (
                <section className="space-y-6">
                  <SectionHeader
                    id="common-mistakes"
                    eyebrow="Common Mistakes"
                    title="Avoid these issues"
                    description="These are the problems most likely to create client confusion or billing cleanup work."
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    {commonMistakes.map((mistake) => (
                      <div key={mistake} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p className="text-sm">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {filteredTroubleshooting.length > 0 && (
                <section className="space-y-6">
                  <SectionHeader
                    id="troubleshooting"
                    eyebrow="Troubleshooting"
                    title="Fast fixes for common issues"
                    description="Each card shows the problem, what to check, and the recommended action."
                  />
                  <div className="grid gap-4">
                    {filteredTroubleshooting.map((item) => (
                      <Card key={item.problem}>
                        <CardHeader>
                          <CardTitle className="text-xl">{item.problem}</CardTitle>
                          <CardDescription>Recommended action: {item.action}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-3 text-sm font-medium text-foreground">What to check</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {item.check.map((check) => (
                              <div key={check} className="flex gap-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>{check}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {includesQuery(query, securityRecommendations) && (
                <section className="space-y-6">
                  <SectionHeader
                    id="security"
                    eyebrow="Security"
                    title="Protect accounts, clients, and payment details"
                    description="Follow these recommendations when managing private client and billing information."
                  />
                  <div className="grid md:grid-cols-3 gap-3">
                    {securityRecommendations.map((item) => (
                      <div key={item} className="rounded-lg border border-border bg-card p-4">
                        <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                        <p className="text-sm text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <SectionHeader
                  id="summary"
                  eyebrow="Final Summary"
                  title="VAYPR manages the full billing lifecycle"
                  description="Use the platform to move from client setup to document delivery, payment tracking, receipts, recurring billing, expenses, and support."
                />
                <Card>
                  <CardContent className="p-6">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {finalSummary.map((item) => (
                        <div key={item} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <p className="text-sm text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-col gap-3 rounded-lg bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Need more help?</h3>
                        <p className="text-sm text-muted-foreground">Open a support ticket from the Support page.</p>
                      </div>
                      <Button asChild>
                        <Link to="/contact">
                          Contact Support
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-4">
                  {statusGroups.map((group) => (
                    <Card key={group.label}>
                      <CardHeader>
                        <CardTitle className="text-base">{group.label} Statuses</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {group.statuses.map((status) => (
                          <StatusBadge key={status} label={status} />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
