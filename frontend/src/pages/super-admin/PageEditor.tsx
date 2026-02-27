// src/pages/super-admin/PageEditor.tsx
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ElementType, ReactNode, ChangeEvent } from "react";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  HelpCircle,
  Mail,
  Shield,
  RefreshCcw,
  BookOpen,
  Building2,
  Briefcase,
  Sparkles,
  Zap,
  ListOrdered,
  CreditCard,
  FileText,
  Save,
  Eye,
  RotateCcw,
  GripVertical,
  Edit3,
  Trash2,
  Plus,
  Image as ImageIcon,
  Upload,
  Download,
  FileImage,
  File,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useLandingPage, useUpdateLandingSection, useResetLandingPage } from "@/hooks/useLandingPage";
import { useGetSocialLinks } from "@/hooks/api/useSocialLinks";
import { useSupportPages } from "@/hooks/useSupportPages";
import {
  useCorporatePages,
  useCreateCorporatePage,
  useUpdateCorporatePage,
  useToggleCorporatePageEnabled,
  useInitializeCorporatePages,
  useGuides,
  useCreateGuide,
  useUpdateGuide,
  useToggleGuidePublished,
  useDeleteGuide,
} from "@/hooks/useCorporatePages";
import { useGetPlans } from "@/hooks/api/useBillingPlans";
import { CorporatePageType, corporatePagesService } from "@/api/services/corporate-pages.service";

import { SocialMediaEditor } from "@/components/super-admin/SocialMediaEditor";
import { FAQsEditor } from "@/components/super-admin/FAQsEditor";
import { SupportPagesManagement } from "@/components/super-admin/SupportPagesManagement";
// You can keep this if you want to use your existing component inside Corporate tab.
// If you prefer the built-in editor below, you can remove this import.
// import { CorporatePagesManagement } from "@/components/super-admin/CorporatePagesManagement";

// -------------------- Types --------------------
interface SocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
  icon: ElementType;
}

interface SupportPage {
  id: string;
  title: string;
  slug: string;
  enabled: boolean;
  icon: ElementType;
  content?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
}

interface LandingSection {
  id: string;
  title: string;
  enabled: boolean;
  icon: ElementType;
  order: number;
}

// -------------------- Initial Data --------------------
const initialSocialLinks: SocialLink[] = [
  {
    id: "facebook",
    platform: "Facebook",
    url: "https://facebook.com/vaypr",
    enabled: true,
    icon: Facebook,
  },
  {
    id: "instagram",
    platform: "Instagram",
    url: "https://instagram.com/vaypr",
    enabled: true,
    icon: Instagram,
  },
  {
    id: "tiktok",
    platform: "TikTok",
    url: "https://tiktok.com/@vaypr",
    enabled: true,
    icon: Globe,
  },
  {
    id: "twitter",
    platform: "X (Twitter)",
    url: "https://x.com/vaypr",
    enabled: true,
    icon: Twitter,
  },
  {
    id: "linkedin",
    platform: "LinkedIn",
    url: "https://linkedin.com/company/vaypr",
    enabled: false,
    icon: Linkedin,
  },
];

const initialSupportPages: SupportPage[] = [
  { id: "contact", title: "Contact Us", slug: "/contact", enabled: true, icon: Mail },
  { id: "privacy", title: "Privacy Policy", slug: "/privacy", enabled: true, icon: Shield },
  { id: "refund", title: "Refund Policy", slug: "/refund", enabled: true, icon: RefreshCcw },
  { id: "terms", title: "Terms of Service", slug: "/terms", enabled: true, icon: FileText },
];

const initialFAQs: FAQItem[] = [
  {
    id: "1",
    question: "How do I create my first invoice?",
    answer:
      "Navigate to the Invoices section and click 'Create New Invoice'. Fill in the client details, add line items, and click 'Send' to deliver it to your client.",
    category: "Getting Started",
    published: true,
    order: 1,
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), KNET for local Kuwait payments, and bank transfers for enterprise accounts.",
    category: "Billing",
    published: true,
    order: 2,
  },
  {
    id: "3",
    question: "How can I upgrade my subscription plan?",
    answer:
      "Go to Settings > Subscription and click 'Upgrade Plan'. Choose your new plan and complete the payment. The upgrade takes effect immediately.",
    category: "Billing",
    published: true,
    order: 3,
  },
  {
    id: "4",
    question: "Can I customize my invoice templates?",
    answer:
      "Yes! Professional and Enterprise plans include custom branding. Go to Settings > Branding to upload your logo, choose colors, and customize your invoice layout.",
    category: "Features",
    published: true,
    order: 4,
  },
  {
    id: "5",
    question: "How do I add team members?",
    answer:
      "Navigate to Settings > Team Members and click 'Invite Member'. Enter their email address and assign a role. They'll receive an invitation to join your workspace.",
    category: "Getting Started",
    published: false,
    order: 5,
  },
];

const initialLandingSections: LandingSection[] = [
  { id: "hero", title: "Hero Section", enabled: true, icon: Sparkles, order: 1 },
  { id: "features", title: "Features", enabled: true, icon: Zap, order: 2 },
  { id: "how-it-works", title: "How It Works", enabled: true, icon: ListOrdered, order: 3 },
  { id: "plans", title: "Subscription Plans", enabled: true, icon: CreditCard, order: 4 },
  { id: "footer", title: "Footer", enabled: true, icon: FileText, order: 5 },
];

const defaultHeroFeatures = [
  { icon: "FileText", label: "Invoices", order: 1 },
  { icon: "FileCheck", label: "Quotes", order: 2 },
  { icon: "Receipt", label: "Receipts", order: 3 },
  { icon: "Users", label: "Clients", order: 4 },
  { icon: "CalendarCheck", label: "Subscriptions", order: 5 },
  { icon: "TrendingUp", label: "Expense\nTracking", order: 6 },
  { icon: "Palette", label: "Custom\nTemplates", order: 7 },
];

const defaultGuideCategories = [
  {
    category: "Getting Started",
    items: [
      { title: "Quick Start Guide", description: "Get up and running with VAYPR in under 10 minutes. Learn the basics of creating your first invoice.", duration: "10 min", difficulty: "Beginner", slug: "#" },
      { title: "Setting Up Your Business Profile", description: "Configure your company details, logo, and default settings for professional documents.", duration: "5 min", difficulty: "Beginner", slug: "#" },
      { title: "Understanding the Dashboard", description: "Navigate the dashboard efficiently and discover key features to manage your business.", duration: "8 min", difficulty: "Beginner", slug: "#" },
    ],
  },
  {
    category: "Invoicing",
    items: [
      { title: "Creating Professional Invoices", description: "Master the art of creating clear, professional invoices that get you paid faster.", duration: "15 min", difficulty: "Beginner", slug: "#" },
      { title: "Customizing Invoice Templates", description: "Design stunning invoice templates that match your brand identity.", duration: "20 min", difficulty: "Intermediate", slug: "#" },
      { title: "Setting Up Recurring Invoices", description: "Automate your billing with recurring invoices for retainer clients and subscriptions.", duration: "12 min", difficulty: "Intermediate", slug: "#" },
      { title: "Multi-Currency Invoicing", description: "Learn how to invoice international clients in their local currency.", duration: "10 min", difficulty: "Intermediate", slug: "#" },
    ],
  },
  {
    category: "Client Management",
    items: [
      { title: "Managing Your Client Database", description: "Organize and maintain your client information for efficient invoicing and communication.", duration: "12 min", difficulty: "Beginner", slug: "#" },
      { title: "Client Portal Overview", description: "Give your clients access to view and pay invoices through their personalized portal.", duration: "15 min", difficulty: "Intermediate", slug: "#" },
      { title: "Tracking Client Payment History", description: "Monitor payment patterns and identify your best (and worst) paying clients.", duration: "10 min", difficulty: "Beginner", slug: "#" },
    ],
  },
  {
    category: "Payments & Billing",
    items: [
      { title: "Payment Methods Setup", description: "Configure payment options including credit cards, bank transfers, and PayPal.", duration: "15 min", difficulty: "Intermediate", slug: "#" },
      { title: "Handling Partial Payments", description: "Accept and track partial payments and payment plans for large invoices.", duration: "8 min", difficulty: "Intermediate", slug: "#" },
      { title: "Late Payment Reminders", description: "Set up automated reminders to chase overdue invoices professionally.", duration: "10 min", difficulty: "Beginner", slug: "#" },
    ],
  },
  {
    category: "Reports & Analytics",
    items: [
      { title: "Understanding Your Reports", description: "Make sense of your financial data with our comprehensive reporting tools.", duration: "20 min", difficulty: "Intermediate", slug: "#" },
      { title: "Tax Preparation Guide", description: "Export the right data and reports for seamless tax filing.", duration: "15 min", difficulty: "Intermediate", slug: "#" },
      { title: "Cash Flow Analysis", description: "Monitor your business cash flow and predict future income.", duration: "18 min", difficulty: "Advanced", slug: "#" },
    ],
  },
  {
    category: "Advanced Settings",
    items: [
      { title: "API Integration Guide", description: "Connect VAYPR with your existing tools using our REST API.", duration: "30 min", difficulty: "Advanced", slug: "#" },
      { title: "Team & Permissions", description: "Set up team members with appropriate access levels and permissions.", duration: "12 min", difficulty: "Intermediate", slug: "#" },
      { title: "Webhooks & Automation", description: "Automate workflows by connecting VAYPR to Zapier, Make, and more.", duration: "25 min", difficulty: "Advanced", slug: "#" },
    ],
  },
];

const defaultB2BEditorContent = {
  heroEyebrow: "Enterprise Finance Platform",
  heroTitleLine1: "Built for Enterprise",
  heroTitleLine2: "Finance Operations",
  heroDescription:
    "Centralize invoicing, subscriptions, expenses, and reporting with approvals, integrations, and dedicated support, designed for scale.",
  heroTrustText: "Trusted by teams in",
  heroTrustIndustries: ["SaaS", "Agencies", "Retail", "Professional Services"],
  valuePillars: [
    { icon: "Shield", title: "Control & Permissions", description: "Role-based access, approval flows, and audit-friendly operations." },
    { icon: "Zap", title: "Automate at Scale", description: "Recurring billing, reminders, and workflow automation for large teams." },
    { icon: "Layers", title: "Integrate with Your Stack", description: "Connect VAYPR with ERP, CRM, and accounting tools." },
  ],
  capabilitiesTitle: "Enterprise Capabilities",
  capabilitiesDescription:
    "A comprehensive suite of tools designed for organizations that demand reliability, scalability, and complete control over their financial operations.",
  enterpriseCapabilities: {
    "Billing & Documents": [
      { icon: "FileText", title: "Unlimited Invoices", description: "Create and manage invoices at scale with consistent formatting and controls." },
      { icon: "FileText", title: "Unlimited Quotes", description: "Generate professional quotes and convert them into invoices seamlessly." },
      { icon: "Receipt", title: "Unlimited Receipts", description: "Store and organize receipts for clean reconciliation and reporting." },
    ],
    "Automation & Subscriptions": [
      { icon: "RefreshCw", title: "Recurring Subscriptions", description: "Automate recurring billing schedules, renewals, and reminders." },
      { icon: "PieChart", title: "Expense Tracking", description: "Capture, categorize, and monitor expenses across teams and projects." },
      { icon: "Settings2", title: "Advanced Expense Tracking", description: "Add granular rules, approvals, and audit-friendly workflows." },
    ],
    "Branding & Customization": [
      { icon: "Palette", title: "Custom Templates", description: "Build standardized templates aligned with your corporate identity." },
      { icon: "Brush", title: "Graphic Designer for Templates", description: "Get expert help crafting polished, on-brand templates quickly." },
      { icon: "Globe", title: "White-label Options", description: "Present a fully branded experience for subsidiaries or client-facing portals." },
    ],
    "Integrations & Platform": [
      { icon: "Brain", title: "AI Integration System", description: "Automate data extraction, categorization, and workflow suggestions using AI-ready tools." },
      { icon: "Code", title: "API Access", description: "Connect VAYPR to internal systems and external apps with secure endpoints." },
      { icon: "Database", title: "Secure Data Connectors", description: "Sync VAYPR with ERPs, banking feeds, and cloud tools using pre-built connectors, scheduled imports, and validation checks." },
    ],
    "Support & Success": [
      { icon: "Mail", title: "Priority Email Support", description: "Faster responses and escalations when your team needs help." },
      { icon: "UserCheck", title: "Dedicated Account Manager", description: "A single point of contact for onboarding, rollout, and ongoing success." },
      { icon: "GraduationCap", title: "Onboarding & Enablement", description: "Guided setup, tailored best practices, and team training to accelerate rollout and drive adoption across your org." },
    ],
    "Insights & Analytics": [
      { icon: "TrendingUp", title: "Smart Financial Analytics", description: "High-level visibility into trends, performance, and operational efficiency." },
      { icon: "LayoutDashboard", title: "Real-Time Performance Dashboards", description: "Track key KPIs in one place with customizable dashboards, filters, and shareable views for every stakeholder." },
      { icon: "AlertTriangle", title: "Forecasting & Anomaly Alerts", description: "Run what-if scenarios, project trends, and get notified when spend, cash flow, or performance metrics deviate from plan." },
    ],
  },
  integrationsTitle: "Integrations & Automation",
  integrationsDescription: "Connect your existing stack with secure REST APIs, webhooks, and AI-powered automation.",
  integrations: [
    { icon: "💬", name: "Slack" },
    { icon: "⚡", name: "Zapier" },
    { icon: "📊", name: "QuickBooks" },
    { icon: "📈", name: "Xero" },
    { icon: "☁️", name: "Salesforce" },
    { icon: "🔶", name: "HubSpot" },
  ],
  customIntegrationsText: "Plus custom integrations for enterprise needs",
  industriesTitle: "Trusted Across Industries",
  industriesDescription: "See how organizations like yours use VAYPR to streamline their financial operations.",
  trustedLogos: ["TechCorp", "FinanceHub", "CloudScale", "DataFlow", "InnovateCo", "GlobalTech"],
  industries: [
    { icon: "Layers", title: "SaaS & Tech", description: "Automate recurring billing and subscription operations." },
    { icon: "Briefcase", title: "Agencies & Consulting", description: "Manage retainers, milestones, and branded client billing." },
    { icon: "ShoppingCart", title: "Retail & E-commerce", description: "Handle high-volume invoicing with clear reporting." },
    { icon: "Scale", title: "Professional Services", description: "Time tracking integration, expense management, and detailed reporting for law firms and accountants." },
  ],
  ctaTitle: "Ready to Scale Finance Operations?",
  ctaDescription: "Let's map VAYPR to your workflows, integrations, and approval structure.",
  ctaItems: ["Enterprise onboarding", "Dedicated support", "Custom rollout"],
  ctaEnabled: true,
  ctaButtonText: "Contact Sales",
  ctaButtonLink: "/contact",
};

// -------------------- Reusable Collapsible Section --------------------
function EditorSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  description: string;
  icon: ElementType;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="card-admin overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Separator />
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// -------------------- Support Pages Editor (Tabs) --------------------
function SupportPagesEditor() {
  return (
    <Tabs defaultValue="pages" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pages">Support Pages</TabsTrigger>
        <TabsTrigger value="faqs">FAQs Management</TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="space-y-4">
        <SupportPagesManagement />
      </TabsContent>

      <TabsContent value="faqs" className="space-y-4">
        <FAQsEditor />
      </TabsContent>
    </Tabs>
  );
}

// -------------------- Corporate Pages Editor (FIXED) --------------------
function CorporatePagesEditor() {
  const { data: pages = [], isLoading: pagesLoading } = useCorporatePages({ enabledOnly: false });
  const { data: guides = [], isLoading: guidesLoading } = useGuides();
  const createPageMutation = useCreateCorporatePage();
  const updatePageMutation = useUpdateCorporatePage();
  const togglePageMutation = useToggleCorporatePageEnabled();
  const createGuideMutation = useCreateGuide();
  const updateGuideMutation = useUpdateGuide();
  const toggleGuideMutation = useToggleGuidePublished();
  const deleteGuideMutation = useDeleteGuide();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [pageForm, setPageForm] = useState<Record<string, any>>({});
  const [guideForm, setGuideForm] = useState<Record<string, any>>({});
  const [newGuide, setNewGuide] = useState({
    title: "",
    category: "Getting Started",
    description: "",
    difficulty: "Beginner",
    duration: "",
    fileType: "pdf" as "pdf" | "image",
    fileName: "",
    fileUrl: "",
  });
  const [isUploadingGuideFile, setIsUploadingGuideFile] = useState(false);

  const inferFileType = (_file: File): "pdf" | "image" => "pdf";

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, isNew: boolean, guideId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = inferFileType(file);
    setIsUploadingGuideFile(true);
    try {
      const uploaded = await corporatePagesService.uploadGuideFile(file);
      const fileUrl = uploaded?.url || "";
      if (!fileUrl) {
        throw new Error("No upload URL returned");
      }

      if (isNew) {
        setNewGuide((prev) => ({ ...prev, fileType: type, fileName: file.name, fileUrl }));
      } else if (guideId) {
        setGuideForm((prev) => ({
          ...prev,
          [guideId]: {
            ...(prev[guideId] || {}),
            fileType: type,
            fileName: file.name,
            fileUrl,
          },
        }));
      }

      toast({
        title: "Upload complete",
        description: `${file.name} uploaded to cloud storage.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.response?.data?.message || error?.message || "Failed to upload guide file.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingGuideFile(false);
    }

    e.target.value = "";
  };

  const addCorporatePage = async () => {
    const timestamp = Date.now();
    await createPageMutation.mutateAsync({
      slug: `custom-${timestamp}`,
      title: "New Page",
      type: CorporatePageType.CUSTOM,
      metaDescription: "New custom corporate page",
      icon: "FileText",
      sections: [{ title: "Section 1", content: "Add content here", order: 1 }],
      enabled: true,
      showInFooter: true,
      order: pages.length + 1,
    });
  };

  const startPageEdit = (page: any) => {
    const normalizedContent = { ...(page.content || {}) };
    const isGuidesPage = (page?.slug || "").toString().toLowerCase() === "guides";
    const isB2BPage = (page?.slug || "").toString().toLowerCase() === "b2b";
    const categories = Array.isArray(normalizedContent.categories)
      ? normalizedContent.categories
      : [];
    if (isGuidesPage && categories.length < 6) {
      normalizedContent.categories = defaultGuideCategories;
    }
    if (isB2BPage) {
      const capabilityKeys = Object.keys(normalizedContent.enterpriseCapabilities || {});
      const fallbackValuePillars = Array.isArray(page?.sections) && page.sections.length
        ? [...page.sections]
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .slice(0, 4)
            .map((section: any) => ({
              title: section?.title || "",
              description: section?.content || "",
              icon: section?.icon || "",
            }))
        : [];
      const fallbackCapabilities = Array.isArray(page?.features) && page.features.length
        ? {
            "Enterprise Features": [...page.features]
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((item: any) => ({
                title: item?.title || "",
                description: item?.description || "",
                icon: item?.icon || "",
              })),
          }
        : {};
      Object.assign(normalizedContent, {
        ...defaultB2BEditorContent,
        ...normalizedContent,
        heroTitleLine1: normalizedContent.heroTitleLine1 || page.heroTitle || defaultB2BEditorContent.heroTitleLine1,
        heroTitleLine2: normalizedContent.heroTitleLine2 || defaultB2BEditorContent.heroTitleLine2,
        heroDescription: normalizedContent.heroDescription || page.heroSubtitle || defaultB2BEditorContent.heroDescription,
        heroTrustIndustries: Array.isArray(normalizedContent.heroTrustIndustries) && normalizedContent.heroTrustIndustries.length
          ? normalizedContent.heroTrustIndustries
          : defaultB2BEditorContent.heroTrustIndustries,
        valuePillars: Array.isArray(normalizedContent.valuePillars) && normalizedContent.valuePillars.length
          ? normalizedContent.valuePillars
          : fallbackValuePillars.length
            ? fallbackValuePillars
          : defaultB2BEditorContent.valuePillars,
        enterpriseCapabilities: capabilityKeys.length
          ? normalizedContent.enterpriseCapabilities
          : Object.keys(fallbackCapabilities).length
            ? fallbackCapabilities
          : defaultB2BEditorContent.enterpriseCapabilities,
        integrations: Array.isArray(normalizedContent.integrations) && normalizedContent.integrations.length
          ? normalizedContent.integrations
          : defaultB2BEditorContent.integrations,
        trustedLogos: Array.isArray(normalizedContent.trustedLogos) && normalizedContent.trustedLogos.length
          ? normalizedContent.trustedLogos
          : defaultB2BEditorContent.trustedLogos,
        industries: Array.isArray(normalizedContent.industries) && normalizedContent.industries.length
          ? normalizedContent.industries
          : defaultB2BEditorContent.industries,
        ctaItems: Array.isArray(normalizedContent.ctaItems) && normalizedContent.ctaItems.length
          ? normalizedContent.ctaItems
          : defaultB2BEditorContent.ctaItems,
        ctaEnabled: typeof normalizedContent.ctaEnabled === "boolean"
          ? normalizedContent.ctaEnabled
          : page?.ctaSection?.enabled ?? defaultB2BEditorContent.ctaEnabled,
        ctaButtonText: normalizedContent.ctaButtonText || page?.ctaSection?.buttonText || defaultB2BEditorContent.ctaButtonText,
        ctaButtonLink: normalizedContent.ctaButtonLink || page?.ctaSection?.buttonLink || defaultB2BEditorContent.ctaButtonLink,
      });
    }

    setEditingId(page._id);
    setPageForm((prev) => ({
      ...prev,
      [page._id]: {
        title: page.title,
        slug: page.slug,
        metaDescription: page.metaDescription || "",
        sections: page.sections || [],
        content: normalizedContent,
      },
    }));
  };

  const updateContentField = (pageId: string, field: string, value: any) => {
    setPageForm((prev) => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] || {}),
        content: {
          ...((prev[pageId] || {}).content || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateContentArrayItem = (
    pageId: string,
    field: string,
    index: number,
    key: string,
    value: any,
  ) => {
    const arr = [ ...(((pageForm[pageId] || {}).content || {})[field] || []) ];
    arr[index] = { ...(arr[index] || {}), [key]: value };
    updateContentField(pageId, field, arr);
  };

  const addContentArrayItem = (pageId: string, field: string, item: any) => {
    const arr = [ ...(((pageForm[pageId] || {}).content || {})[field] || []) ];
    arr.push(item);
    updateContentField(pageId, field, arr);
  };

  const removeContentArrayItem = (pageId: string, field: string, index: number) => {
    const arr = [ ...(((pageForm[pageId] || {}).content || {})[field] || []) ];
    arr.splice(index, 1);
    updateContentField(pageId, field, arr);
  };

  const savePage = async (id: string) => {
    const form = pageForm[id];
    if (!form) return;
    const slugLower = (form.slug || "").toString().toLowerCase();

    if (slugLower === "b2b") {
      const normalizedContent = {
        ...defaultB2BEditorContent,
        ...(form.content || {}),
      };

      const b2bSections = (normalizedContent.valuePillars || []).map((item: any, index: number) => ({
        title: item?.title || "",
        content: item?.description || "",
        order: index + 1,
      }));

      const b2bFeatures = Object.values(normalizedContent.enterpriseCapabilities || {})
        .flatMap((items: any) => (Array.isArray(items) ? items : []))
        .map((item: any, index: number) => ({
          title: item?.title || "",
          description: item?.description || "",
          icon: item?.icon || "",
          order: index + 1,
        }));

      const payload = {
        ...form,
        content: normalizedContent,
        heroTitle: normalizedContent.heroTitleLine1 || form.title,
        heroSubtitle: normalizedContent.heroDescription || "",
        sections: b2bSections,
        features: b2bFeatures,
        ctaSection: {
          enabled: normalizedContent.ctaEnabled !== false,
          title: normalizedContent.ctaTitle || "",
          description: normalizedContent.ctaDescription || "",
          buttonText: normalizedContent.ctaButtonText || "Contact Sales",
          buttonLink: normalizedContent.ctaButtonLink || "/contact",
        },
      };

      await updatePageMutation.mutateAsync({ id, data: payload });
      setEditingId(null);
      return;
    }

    await updatePageMutation.mutateAsync({ id, data: form });
    setEditingId(null);
  };

  const addGuide = async () => {
    const missingFields: string[] = [];
    if (!newGuide.title.trim()) missingFields.push("Guide Title");
    if (!newGuide.category.trim()) missingFields.push("Category");
    if (!newGuide.description.trim()) missingFields.push("Description");
    if (!newGuide.fileName || !newGuide.fileUrl) missingFields.push("Upload File");

    if (missingFields.length > 0) {
      const fieldList =
        missingFields.length === 1
          ? missingFields[0]
          : `${missingFields.slice(0, -1).join(", ")} and ${missingFields[missingFields.length - 1]}`;
      toast({
        title: "Required fields missing",
        description: `Please fill: ${fieldList}.`,
        variant: "destructive",
      });
      return;
    }

    await createGuideMutation.mutateAsync({
      title: newGuide.title.trim(),
      category: newGuide.category.trim() || "Getting Started",
      description: newGuide.description.trim(),
      difficulty: newGuide.difficulty.trim() || "Beginner",
      duration: newGuide.duration.trim(),
      fileType: newGuide.fileType,
      fileName: newGuide.fileName,
      fileUrl: newGuide.fileUrl,
      published: false,
    });

    setShowAddGuide(false);
    setNewGuide({ title: "", category: "Getting Started", description: "", difficulty: "Beginner", duration: "", fileType: "pdf", fileName: "", fileUrl: "" });
  };

  const startGuideEdit = (guide: any) => {
    setEditingGuideId(guide._id);
    setGuideForm((prev) => ({
      ...prev,
      [guide._id]: {
        title: guide.title,
        category: guide.category || "Getting Started",
        description: guide.description,
        difficulty: guide.difficulty || "Beginner",
        duration: guide.duration || "",
        fileType: guide.fileType,
        fileName: guide.fileName,
        fileUrl: guide.fileUrl,
      },
    }));
  };

  const saveGuide = async (id: string) => {
    const form = guideForm[id];
    if (!form) return;
    await updateGuideMutation.mutateAsync({ id, data: form });
    setEditingGuideId(null);
  };

  const pagesCount = pages.length;
  const guidesCount = guides.length;

  const [showInitDialog, setShowInitDialog] = useState(false);
  const initializeMutation = useInitializeCorporatePages();

  const handleInitializeDefaults = async () => {
    await initializeMutation.mutateAsync();
    setShowInitDialog(false);
  };

  const handlePreviewPage = (page: any) => {
    const rawSlug = (page?.slug || "").toString().trim();
    const normalizedSlug = rawSlug.replace(/^\/+/, "");
    const lowerSlug = normalizedSlug.toLowerCase();
    const staticRoutes = new Set(["about", "b2b", "guides"]);
    const previewPath = staticRoutes.has(lowerSlug)
      ? `/${lowerSlug}`
      : `/corporate/${normalizedSlug}`;

    window.location.href = `${window.location.origin}${previewPath}`;
  };

  return (
    <Tabs defaultValue="pages" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pages">Corporate Pages</TabsTrigger>
        <TabsTrigger value="guides">Guides Management</TabsTrigger>
      </TabsList>

      {/* -------------------- Corporate Pages Tab -------------------- */}
      <TabsContent value="pages" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{pagesCount} pages</span>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowInitDialog(true)} variant="outline" disabled={initializeMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Initialize Default Pages
            </Button>
            {pages.length > 0 && (
              <Button variant="outline" size="sm" onClick={addCorporatePage} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Page
              </Button>
            )}
          </div>
        </div>

        {pagesLoading ? (
          <p className="text-sm text-muted-foreground">Loading corporate pages...</p>
        ) : pages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No corporate pages found</p>
            <p className="text-sm mb-4">Initialize default pages to get started</p>
            <Button onClick={() => setShowInitDialog(true)}>
              Initialize Default Pages
            </Button>
          </div>
        ) : pages.map((page: any) => (
          <div key={page._id} className="rounded-lg border bg-card overflow-hidden">
            {(() => {
              const slugLower = (page.slug || "").toString().toLowerCase();
              const content = (pageForm[page._id]?.content || page.content || {}) as Record<string, any>;

              return (
                <>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{page.title}</h4>
                  <Badge variant="outline" className="text-xs font-mono">
                    /{page.slug}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{page.metaDescription}</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={page.enabled} onCheckedChange={() => togglePageMutation.mutate(page._id)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => (editingId === page._id ? setEditingId(null) : startPageEdit(page))}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePreviewPage(page)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {editingId === page._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t"
                >
                  <div className="p-4 bg-muted/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Page Title</Label>
                        <Input
                          value={pageForm[page._id]?.title || ""}
                          onChange={(e) =>
                            setPageForm((prev) => ({
                              ...prev,
                              [page._id]: { ...(prev[page._id] || {}), title: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">URL Slug</Label>
                        <Input
                          value={pageForm[page._id]?.slug || ""}
                          onChange={(e) =>
                            setPageForm((prev) => ({
                              ...prev,
                              [page._id]: { ...(prev[page._id] || {}), slug: e.target.value },
                            }))
                          }
                          className="mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea
                        placeholder="Enter meta description..."
                        className="mt-1"
                        value={pageForm[page._id]?.metaDescription || ""}
                        onChange={(e) =>
                          setPageForm((prev) => ({
                            ...prev,
                            [page._id]: { ...(prev[page._id] || {}), metaDescription: e.target.value },
                          }))
                        }
                      />
                    </div>

                    {/* Section Content Editor */}
                    {slugLower !== "b2b" && slugLower !== "about" && <div className="border-t pt-4">
                      <Label className="text-xs font-semibold mb-3 block">Page Sections</Label>
                      <div className="space-y-4">
                        {(pageForm[page._id]?.sections || page.sections || [])
                          .map((section: any, sIdx: number) => ({ section, sIdx }))
                          .filter(({ section }) => {
                            if (slugLower !== "about") return true;
                            const sectionTitle = (section?.title || "").toString().toLowerCase().trim();
                            return !sectionTitle.includes("value");
                          })
                          .map(({ section, sIdx }: { section: any; sIdx: number }) => (
                          <div key={sIdx} className="p-3 bg-secondary/30 rounded space-y-3">
                            <div>
                              <Label className="text-xs">Section Title</Label>
                              <Input
                                value={section.title || ""}
                                onChange={(e) =>
                                  setPageForm((prev) => {
                                    const sections = [...(prev[page._id]?.sections || page.sections || [])];
                                    sections[sIdx] = { ...sections[sIdx], title: e.target.value };
                                    return {
                                      ...prev,
                                      [page._id]: { ...(prev[page._id] || {}), sections },
                                    };
                                  })
                                }
                                placeholder="Section title..."
                                className="mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Section Content</Label>
                              <Textarea
                                value={section.content || ""}
                                onChange={(e) =>
                                  setPageForm((prev) => {
                                    const sections = [...(prev[page._id]?.sections || page.sections || [])];
                                    sections[sIdx] = { ...sections[sIdx], content: e.target.value };
                                    return {
                                      ...prev,
                                      [page._id]: { ...(prev[page._id] || {}), sections },
                                    };
                                  })
                                }
                                placeholder="Enter section content here..."
                                className="mt-1 min-h-[120px] text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>}

                    {/* Structured About Page Content */}
                    {slugLower === "about" && (
                      <div className="border-t pt-4 space-y-4">
                        <Label className="text-xs font-semibold block">About Page Content</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Hero Title</Label>
                            <Input
                              className="mt-1"
                              value={content.heroTitle || ""}
                              onChange={(e) => updateContentField(page._id, "heroTitle", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Hero Description</Label>
                            <Textarea
                              className="mt-1 min-h-[80px]"
                              value={content.heroDescription || ""}
                              onChange={(e) => updateContentField(page._id, "heroDescription", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Stats</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "stats", { value: "", label: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Stat
                            </Button>
                          </div>
                          {(content.stats || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Stat {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "stats", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Value (e.g. 50K+)"
                                value={item.value || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "stats", idx, "value", e.target.value)}
                              />
                              <Input
                                placeholder="Label"
                                value={item.label || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "stats", idx, "label", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4">
                          <Label className="text-xs font-semibold mb-3 block">Page Sections</Label>
                          <div className="space-y-4">
                            {(pageForm[page._id]?.sections || page.sections || [])
                              .map((section: any, sIdx: number) => ({ section, sIdx }))
                              .filter(({ section }) => {
                                const sectionTitle = (section?.title || "").toString().toLowerCase().trim();
                                return !sectionTitle.includes("value");
                              })
                              .sort((a, b) => {
                                const getOrder = (title: string) => {
                                  const normalized = (title || "").toLowerCase();
                                  if (normalized.includes("mission")) return 1;
                                  if (normalized.includes("story")) return 2;
                                  if (normalized.includes("why choose")) return 3;
                                  return 100;
                                };
                                return getOrder(a.section?.title || "") - getOrder(b.section?.title || "");
                              })
                              .map(({ section, sIdx }: { section: any; sIdx: number }) => (
                                <div key={sIdx} className="p-3 bg-secondary/30 rounded space-y-3">
                                  <div>
                                    <Label className="text-xs">Section Title</Label>
                                    <Input
                                      value={section.title || ""}
                                      onChange={(e) =>
                                        setPageForm((prev) => {
                                          const sections = [...(prev[page._id]?.sections || page.sections || [])];
                                          sections[sIdx] = { ...sections[sIdx], title: e.target.value };
                                          return {
                                            ...prev,
                                            [page._id]: { ...(prev[page._id] || {}), sections },
                                          };
                                        })
                                      }
                                      placeholder="Section title..."
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Section Content</Label>
                                    <Textarea
                                      value={section.content || ""}
                                      onChange={(e) =>
                                        setPageForm((prev) => {
                                          const sections = [...(prev[page._id]?.sections || page.sections || [])];
                                          sections[sIdx] = { ...sections[sIdx], content: e.target.value };
                                          return {
                                            ...prev,
                                            [page._id]: { ...(prev[page._id] || {}), sections },
                                          };
                                        })
                                      }
                                      placeholder="Enter section content here..."
                                      className="mt-1 min-h-[120px] text-sm"
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Values Section Title"
                            value={content.valuesTitle || ""}
                            onChange={(e) => updateContentField(page._id, "valuesTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Values Section Description"
                            value={content.valuesDescription || ""}
                            onChange={(e) => updateContentField(page._id, "valuesDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Values Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "values", { title: "", description: "", icon: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Card
                            </Button>
                          </div>
                          {(content.values || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Card {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "values", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Title"
                                value={item.title || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "values", idx, "title", e.target.value)}
                              />
                              <Input
                                placeholder="Icon Name (any Lucide icon, e.g. between-horizontal-end or BetweenHorizontalEnd)"
                                value={item.icon || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "values", idx, "icon", e.target.value)}
                              />
                              <Textarea
                                placeholder="Description"
                                value={item.description || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "values", idx, "description", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Team Section Title"
                            value={content.teamTitle || ""}
                            onChange={(e) => updateContentField(page._id, "teamTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Team Section Description"
                            value={content.teamDescription || ""}
                            onChange={(e) => updateContentField(page._id, "teamDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Team Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "team", { name: "", role: "", bio: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Card
                            </Button>
                          </div>
                          {(content.team || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Card {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "team", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Name"
                                value={item.name || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "team", idx, "name", e.target.value)}
                              />
                              <Input
                                placeholder="Role"
                                value={item.role || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "team", idx, "role", e.target.value)}
                              />
                              <Textarea
                                placeholder="Bio"
                                value={item.bio || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "team", idx, "bio", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Recognition Section Title"
                            value={content.recognitionTitle || ""}
                            onChange={(e) => updateContentField(page._id, "recognitionTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Recognition Section Description"
                            value={content.recognitionDescription || ""}
                            onChange={(e) => updateContentField(page._id, "recognitionDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Recognition Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "recognitionItems", { name: "", category: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Card
                            </Button>
                          </div>
                          {(content.recognitionItems || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Card {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "recognitionItems", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Name"
                                value={item.name || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "recognitionItems", idx, "name", e.target.value)}
                              />
                              <Input
                                placeholder="Category"
                                value={item.category || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "recognitionItems", idx, "category", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="CTA Title"
                            value={content.ctaTitle || ""}
                            onChange={(e) => updateContentField(page._id, "ctaTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="CTA Description"
                            value={content.ctaDescription || ""}
                            onChange={(e) => updateContentField(page._id, "ctaDescription", e.target.value)}
                          />
                          <Input
                            placeholder="CTA Button Text"
                            value={content.ctaButtonText || ""}
                            onChange={(e) => updateContentField(page._id, "ctaButtonText", e.target.value)}
                          />
                          <Input
                            placeholder="Secondary CTA Button Text"
                            value={content.ctaButtonLink || ""}
                            onChange={(e) => updateContentField(page._id, "ctaButtonLink", e.target.value)}
                          />
                          <div className="flex items-center justify-between rounded border p-2 md:col-span-2">
                            <Label className="text-xs">Enable CTA Section</Label>
                            <Switch
                              checked={content.ctaEnabled !== false}
                              onCheckedChange={(checked) => updateContentField(page._id, "ctaEnabled", checked)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Structured B2B Page Content */}
                    {slugLower === "b2b" && (
                      <div className="border-t pt-4 space-y-4">
                        <Label className="text-xs font-semibold block">B2B Page Content</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Hero Eyebrow"
                            value={content.heroEyebrow || ""}
                            onChange={(e) => updateContentField(page._id, "heroEyebrow", e.target.value)}
                          />
                          <Input
                            placeholder="Hero Title Line 1"
                            value={content.heroTitleLine1 || ""}
                            onChange={(e) => updateContentField(page._id, "heroTitleLine1", e.target.value)}
                          />
                          <Input
                            placeholder="Hero Title Line 2"
                            value={content.heroTitleLine2 || ""}
                            onChange={(e) => updateContentField(page._id, "heroTitleLine2", e.target.value)}
                          />
                          <Textarea
                            placeholder="Hero Description"
                            value={content.heroDescription || ""}
                            onChange={(e) => updateContentField(page._id, "heroDescription", e.target.value)}
                          />
                          <Input
                            placeholder="Hero Trust Text"
                            value={content.heroTrustText || ""}
                            onChange={(e) => updateContentField(page._id, "heroTrustText", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Hero Trust Industries</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "heroTrustIndustries", "")}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          </div>
                          {(content.heroTrustIndustries || []).map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={item || ""}
                                onChange={(e) => {
                                  const arr = [...(content.heroTrustIndustries || [])];
                                  arr[idx] = e.target.value;
                                  updateContentField(page._id, "heroTrustIndustries", arr);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeContentArrayItem(page._id, "heroTrustIndustries", idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Value Pillar Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "valuePillars", { icon: "", title: "", description: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Card
                            </Button>
                          </div>
                          {(content.valuePillars || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Card {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "valuePillars", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Title"
                                value={item.title || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "valuePillars", idx, "title", e.target.value)}
                              />
                              <Input
                                placeholder="Icon Name (e.g. Shield, bell-electric)"
                                value={item.icon || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "valuePillars", idx, "icon", e.target.value)}
                              />
                              <Textarea
                                placeholder="Description"
                                value={item.description || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "valuePillars", idx, "description", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Capabilities Title"
                            value={content.capabilitiesTitle || ""}
                            onChange={(e) => updateContentField(page._id, "capabilitiesTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Capabilities Description"
                            value={content.capabilitiesDescription || ""}
                            onChange={(e) => updateContentField(page._id, "capabilitiesDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Enterprise Capability Categories</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const caps = { ...(content.enterpriseCapabilities || {}) };
                                let counter = 1;
                                let key = `New Category ${counter}`;
                                while (caps[key]) {
                                  counter += 1;
                                  key = `New Category ${counter}`;
                                }
                                caps[key] = [];
                                updateContentField(page._id, "enterpriseCapabilities", caps);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Category
                            </Button>
                          </div>
                          {Object.entries(content.enterpriseCapabilities || {}).map(([categoryName, features]: [string, any[]]) => (
                            <div key={categoryName} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={categoryName}
                                  onChange={(e) => {
                                    const caps = { ...(content.enterpriseCapabilities || {}) };
                                    const value = caps[categoryName];
                                    delete caps[categoryName];
                                    caps[e.target.value || `Category ${Date.now()}`] = value;
                                    updateContentField(page._id, "enterpriseCapabilities", caps);
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => {
                                    const caps = { ...(content.enterpriseCapabilities || {}) };
                                    delete caps[categoryName];
                                    updateContentField(page._id, "enterpriseCapabilities", caps);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Features</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      const caps = { ...(content.enterpriseCapabilities || {}) };
                                      const arr = [...(caps[categoryName] || [])];
                                      arr.push({ icon: "", title: "", description: "" });
                                      caps[categoryName] = arr;
                                      updateContentField(page._id, "enterpriseCapabilities", caps);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add Feature
                                  </Button>
                                </div>
                                {(features || []).map((feature: any, idx: number) => (
                                  <div key={idx} className="rounded border p-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Feature {idx + 1}</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-destructive"
                                        onClick={() => {
                                          const caps = { ...(content.enterpriseCapabilities || {}) };
                                          const arr = [...(caps[categoryName] || [])];
                                          arr.splice(idx, 1);
                                          caps[categoryName] = arr;
                                          updateContentField(page._id, "enterpriseCapabilities", caps);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Feature Title"
                                      value={feature?.title || ""}
                                      onChange={(e) => {
                                        const caps = { ...(content.enterpriseCapabilities || {}) };
                                        const arr = [...(caps[categoryName] || [])];
                                        arr[idx] = { ...(arr[idx] || {}), title: e.target.value };
                                        caps[categoryName] = arr;
                                        updateContentField(page._id, "enterpriseCapabilities", caps);
                                      }}
                                    />
                                    <Input
                                      placeholder="Icon Name (e.g. FileText, between-horizontal-end)"
                                      value={feature?.icon || ""}
                                      onChange={(e) => {
                                        const caps = { ...(content.enterpriseCapabilities || {}) };
                                        const arr = [...(caps[categoryName] || [])];
                                        arr[idx] = { ...(arr[idx] || {}), icon: e.target.value };
                                        caps[categoryName] = arr;
                                        updateContentField(page._id, "enterpriseCapabilities", caps);
                                      }}
                                    />
                                    <Textarea
                                      placeholder="Feature Description"
                                      value={feature?.description || ""}
                                      onChange={(e) => {
                                        const caps = { ...(content.enterpriseCapabilities || {}) };
                                        const arr = [...(caps[categoryName] || [])];
                                        arr[idx] = { ...(arr[idx] || {}), description: e.target.value };
                                        caps[categoryName] = arr;
                                        updateContentField(page._id, "enterpriseCapabilities", caps);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Integrations Title"
                            value={content.integrationsTitle || ""}
                            onChange={(e) => updateContentField(page._id, "integrationsTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Integrations Description"
                            value={content.integrationsDescription || ""}
                            onChange={(e) => updateContentField(page._id, "integrationsDescription", e.target.value)}
                          />
                          <Input
                            placeholder="Custom Integrations Text"
                            value={content.customIntegrationsText || ""}
                            onChange={(e) => updateContentField(page._id, "customIntegrationsText", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Integration Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "integrations", { icon: "💬", name: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Integration
                            </Button>
                          </div>
                          {(content.integrations || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-2 space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Integration {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "integrations", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Icon (emoji)"
                                  value={item.icon || ""}
                                  onChange={(e) => updateContentArrayItem(page._id, "integrations", idx, "icon", e.target.value)}
                                />
                                <Input
                                  placeholder="Name"
                                  value={item.name || ""}
                                  onChange={(e) => updateContentArrayItem(page._id, "integrations", idx, "name", e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Industries Section Title"
                            value={content.industriesTitle || ""}
                            onChange={(e) => updateContentField(page._id, "industriesTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="Industries Section Description"
                            value={content.industriesDescription || ""}
                            onChange={(e) => updateContentField(page._id, "industriesDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Trusted Logos</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "trustedLogos", "")}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Logo
                            </Button>
                          </div>
                          {(content.trustedLogos || []).map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={item || ""}
                                onChange={(e) => {
                                  const arr = [...(content.trustedLogos || [])];
                                  arr[idx] = e.target.value;
                                  updateContentField(page._id, "trustedLogos", arr);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeContentArrayItem(page._id, "trustedLogos", idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Industries Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "industries", { icon: "", title: "", description: "" })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Card
                            </Button>
                          </div>
                          {(content.industries || []).map((item: any, idx: number) => (
                            <div key={idx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Card {idx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "industries", idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Title"
                                value={item.title || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "industries", idx, "title", e.target.value)}
                              />
                              <Input
                                placeholder="Icon Name (e.g. Briefcase, user-round-check)"
                                value={item.icon || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "industries", idx, "icon", e.target.value)}
                              />
                              <Textarea
                                placeholder="Description"
                                value={item.description || ""}
                                onChange={(e) => updateContentArrayItem(page._id, "industries", idx, "description", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="CTA Title"
                            value={content.ctaTitle || ""}
                            onChange={(e) => updateContentField(page._id, "ctaTitle", e.target.value)}
                          />
                          <Textarea
                            placeholder="CTA Description"
                            value={content.ctaDescription || ""}
                            onChange={(e) => updateContentField(page._id, "ctaDescription", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">CTA Bullet Items</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "ctaItems", "")}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Item
                            </Button>
                          </div>
                          {(content.ctaItems || []).map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={item || ""}
                                onChange={(e) => {
                                  const arr = [...(content.ctaItems || [])];
                                  arr[idx] = e.target.value;
                                  updateContentField(page._id, "ctaItems", arr);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeContentArrayItem(page._id, "ctaItems", idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structured Guides Landing Page Content */}
                    {slugLower === "guides" && (
                      <div className="border-t pt-4 space-y-4">
                        <Label className="text-xs font-semibold block">Guides Landing Content</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Page Title"
                            value={content.title || ""}
                            onChange={(e) => updateContentField(page._id, "title", e.target.value)}
                          />
                          <Textarea
                            placeholder="Page Description"
                            value={content.description || ""}
                            onChange={(e) => updateContentField(page._id, "description", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Guide Category Cards</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addContentArrayItem(page._id, "categories", { category: "", items: [] })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Category
                            </Button>
                          </div>
                          {(content.categories || []).map((category: any, cIdx: number) => (
                            <div key={cIdx} className="rounded border p-3 bg-background space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Category {cIdx + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeContentArrayItem(page._id, "categories", cIdx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Category Name"
                                value={category.category || ""}
                                onChange={(e) => {
                                  const arr = [...(content.categories || [])];
                                  arr[cIdx] = { ...(arr[cIdx] || {}), category: e.target.value };
                                  updateContentField(page._id, "categories", arr);
                                }}
                              />
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Items</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      const arr = [...(content.categories || [])];
                                      const items = [...((arr[cIdx]?.items) || [])];
                                      items.push({ title: "", description: "", duration: "", difficulty: "Beginner", slug: "#" });
                                      arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                      updateContentField(page._id, "categories", arr);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add Item
                                  </Button>
                                </div>
                                {(category.items || []).map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="rounded border p-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs">Item {iIdx + 1}</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-destructive"
                                        onClick={() => {
                                          const arr = [...(content.categories || [])];
                                          const items = [...((arr[cIdx]?.items) || [])];
                                          items.splice(iIdx, 1);
                                          arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                          updateContentField(page._id, "categories", arr);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Title"
                                      value={item.title || ""}
                                      onChange={(e) => {
                                        const arr = [...(content.categories || [])];
                                        const items = [...((arr[cIdx]?.items) || [])];
                                        items[iIdx] = { ...(items[iIdx] || {}), title: e.target.value };
                                        arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                        updateContentField(page._id, "categories", arr);
                                      }}
                                    />
                                    <Textarea
                                      placeholder="Description"
                                      value={item.description || ""}
                                      onChange={(e) => {
                                        const arr = [...(content.categories || [])];
                                        const items = [...((arr[cIdx]?.items) || [])];
                                        items[iIdx] = { ...(items[iIdx] || {}), description: e.target.value };
                                        arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                        updateContentField(page._id, "categories", arr);
                                      }}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <Input
                                        placeholder="Duration (e.g. 10 min)"
                                        value={item.duration || ""}
                                        onChange={(e) => {
                                          const arr = [...(content.categories || [])];
                                          const items = [...((arr[cIdx]?.items) || [])];
                                          items[iIdx] = { ...(items[iIdx] || {}), duration: e.target.value };
                                          arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                          updateContentField(page._id, "categories", arr);
                                        }}
                                      />
                                      <Input
                                        placeholder="Difficulty (Beginner/Intermediate/Advanced)"
                                        value={item.difficulty || ""}
                                        onChange={(e) => {
                                          const arr = [...(content.categories || [])];
                                          const items = [...((arr[cIdx]?.items) || [])];
                                          items[iIdx] = { ...(items[iIdx] || {}), difficulty: e.target.value };
                                          arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                          updateContentField(page._id, "categories", arr);
                                        }}
                                      />
                                      <Input
                                        placeholder="PDF URL / Download Link"
                                        value={item.slug || item.fileUrl || item.downloadUrl || ""}
                                        onChange={(e) => {
                                          const arr = [...(content.categories || [])];
                                          const items = [...((arr[cIdx]?.items) || [])];
                                          items[iIdx] = {
                                            ...(items[iIdx] || {}),
                                            slug: e.target.value,
                                            fileUrl: e.target.value,
                                          };
                                          arr[cIdx] = { ...(arr[cIdx] || {}), items };
                                          updateContentField(page._id, "categories", arr);
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => savePage(page._id)}
                        disabled={updatePageMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
                </>
              );
            })()}
          </div>
        ))}
      </TabsContent>

      {/* Initialize Defaults Dialog for Corporate Pages */}
      <AlertDialog open={showInitDialog} onOpenChange={setShowInitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize Default Corporate Pages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create default About Us and B2B Services pages with pre-filled content including team members and features.
              You can customize them after initialization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInitializeDefaults} disabled={initializeMutation.isPending}>
              Initialize Pages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------- Guides Tab -------------------- */}
      <TabsContent value="guides" className="space-y-4">
        {/* Guides Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{guidesCount} guides available</span>
          </div>
          <Button onClick={() => setShowAddGuide((v) => !v)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Guide
          </Button>
        </div>

        {/* Add Guide Form */}
        <AnimatePresence>
          {showAddGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border bg-card p-4 space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Add New Guide</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Guide Title *</Label>
                  <Input
                    value={newGuide.title}
                    onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })}
                    placeholder="Enter guide title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Category *</Label>
                  <Input
                    value={newGuide.category}
                    onChange={(e) => setNewGuide({ ...newGuide, category: e.target.value })}
                    placeholder="e.g. Getting Started"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Upload PDF *</Label>
                  <div className="mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => handleFileUpload(e, true)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {isUploadingGuideFile ? "Uploading..." : (newGuide.fileName || "Choose file...")}
                        </span>
                      </div>
                    </div>

                    {newGuide.fileName && (
                      <div className="flex items-center gap-1 px-2 rounded-md bg-primary/10">
                        {newGuide.fileType === "pdf" ? (
                          <File className="w-4 h-4 text-primary" />
                        ) : (
                          <FileImage className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-xs text-primary uppercase">{newGuide.fileType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Difficulty</Label>
                  <Input
                    value={newGuide.difficulty}
                    onChange={(e) => setNewGuide({ ...newGuide, difficulty: e.target.value })}
                    placeholder="Beginner / Intermediate / Advanced"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Input
                    value={newGuide.duration}
                    onChange={(e) => setNewGuide({ ...newGuide, duration: e.target.value })}
                    placeholder="e.g. 10 min"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Description *</Label>
                <Textarea
                  value={newGuide.description}
                  onChange={(e) => setNewGuide({ ...newGuide, description: e.target.value })}
                  placeholder="Enter guide description..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddGuide(false);
                    setNewGuide({ title: "", category: "Getting Started", description: "", difficulty: "Beginner", duration: "", fileType: "pdf", fileName: "", fileUrl: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={addGuide} disabled={isUploadingGuideFile}>
                  Add Guide
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guides List */}
        <div className="space-y-3">
          {guidesLoading ? (
            <p className="text-sm text-muted-foreground">Loading guides...</p>
          ) : guides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No guides yet. Add your first guide above.</p>
            </div>
          ) : (
            guides.map((guide: any) => (
              <div key={guide._id} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {guide.fileType === "pdf" ? (
                      <File className="w-6 h-6 text-primary" />
                    ) : (
                      <FileImage className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{guide.title}</h4>
                      <Badge variant={guide.published ? "default" : "secondary"} className="text-xs">
                        {guide.published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {guide.category || "General"}
                      </Badge>
                      <Badge variant="outline" className="text-xs uppercase">
                        {guide.fileType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{guide.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="truncate">{guide.fileName}</span>
                      <span>•</span>
                      <span>{guide.downloads} downloads</span>
                      <span>•</span>
                      <span>{guide.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={guide.published}
                      onCheckedChange={() => toggleGuideMutation.mutate(guide._id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => (editingGuideId === guide._id ? setEditingGuideId(null) : startGuideEdit(guide))}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary"
                      onClick={() => {
                        if (guide.fileUrl && guide.fileUrl !== "#") window.open(guide.fileUrl, "_blank", "noopener,noreferrer");
                        else toast({ title: "No file URL", description: "Wire this to Cloudinary/real storage." });
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteGuideMutation.mutate(guide._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit Guide Form */}
                <AnimatePresence>
                  {editingGuideId === guide._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 bg-muted/30 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Guide Title</Label>
                            <Input
                              value={guideForm[guide._id]?.title || ""}
                              onChange={(e) =>
                                setGuideForm((prev) => ({
                                  ...prev,
                                  [guide._id]: { ...(prev[guide._id] || {}), title: e.target.value },
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Category</Label>
                            <Input
                              value={guideForm[guide._id]?.category || ""}
                              onChange={(e) =>
                                setGuideForm((prev) => ({
                                  ...prev,
                                  [guide._id]: { ...(prev[guide._id] || {}), category: e.target.value },
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Replace PDF</Label>
                            <div className="mt-1 flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  onChange={(e) => handleFileUpload(e, false, guide._id)}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm">
                                  <Upload className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground truncate">
                                    {isUploadingGuideFile ? "Uploading..." : (guideForm[guide._id]?.fileName || guide.fileName)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 px-2 rounded-md bg-primary/10">
                                <File className="w-4 h-4 text-primary" />
                                <span className="text-xs text-primary uppercase">PDF</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Difficulty</Label>
                            <Input
                              value={guideForm[guide._id]?.difficulty || ""}
                              onChange={(e) =>
                                setGuideForm((prev) => ({
                                  ...prev,
                                  [guide._id]: { ...(prev[guide._id] || {}), difficulty: e.target.value },
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duration</Label>
                            <Input
                              value={guideForm[guide._id]?.duration || ""}
                              onChange={(e) =>
                                setGuideForm((prev) => ({
                                  ...prev,
                                  [guide._id]: { ...(prev[guide._id] || {}), duration: e.target.value },
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={guideForm[guide._id]?.description || ""}
                            onChange={(e) =>
                              setGuideForm((prev) => ({
                                ...prev,
                                [guide._id]: { ...(prev[guide._id] || {}), description: e.target.value },
                              }))
                            }
                            className="mt-1 min-h-[100px]"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingGuideId(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveGuide(guide._id)}
                            disabled={updateGuideMutation.isPending || isUploadingGuideFile}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// -------------------- Landing Page Editor --------------------
function LandingPageEditor() {
  const { data: landingPage, isLoading } = useLandingPage();
  const { data: socialLinks = [] } = useGetSocialLinks();
  const { data: supportPages = [] } = useSupportPages({ enabledOnly: true });
  const { data: corporatePages = [] } = useCorporatePages({ enabledOnly: true });
  const { data: billingPlansResponse } = useGetPlans(undefined, 100, 0);
  const updateSection = useUpdateLandingSection();
  const pricingPlansCount = billingPlansResponse?.total ?? billingPlansResponse?.items?.length ?? 0;

  const [heroForm, setHeroForm] = useState({
    badge: "",
    headline: "",
    subheadline: "",
    primaryButtonText: "",
    secondaryButtonText: "",
    heroFeatures: [] as Array<{ icon: string; label: string; order: number }>,
  });

  const [footerForm, setFooterForm] = useState({
    companyName: "",
    description: "",
    copyright: "",
    showSocialLinks: true,
  });

  const [testimonialsForm, setTestimonialsForm] = useState({
    badge: "",
    headline: "",
    enabled: true,
    testimonials: [] as Array<{ name: string; role: string; content: string; rating: number }>,
  });
  const [featuresForm, setFeaturesForm] = useState({
    badge: "",
    headline: "",
    description: "",
    features: [] as Array<{ icon: string; title: string; description: string; order: number }>,
  });
  const [statsForm, setStatsForm] = useState({
    stats: [] as Array<{ icon: string; value: string; label: string }>,
  });
  const [howItWorksForm, setHowItWorksForm] = useState({
    badge: "",
    headline: "",
    description: "",
    steps: [] as Array<{ number: string; title: string; description: string; features: string[]; order: number }>,
  });
  const [pricingForm, setPricingForm] = useState({
    headline: "",
    description: "",
    enabled: true,
    showYearlyToggle: true,
  });

  const [ctaForm, setCtaForm] = useState({
    headline: "",
    description: "",
    primaryButtonText: "",
    secondaryButtonText: "",
    disclaimer: "",
    enabled: true,
  });

  const supportFooterCount = supportPages.filter((page) => page.showInFooter).length;
  const corporateFooterCount = corporatePages.filter((page) => page.showInFooter).length;

  // Initialize forms when data loads
  useEffect(() => {
    if (landingPage) {
      setHeroForm({
        badge: landingPage.heroSection.badge,
        headline: landingPage.heroSection.headline,
        subheadline: landingPage.heroSection.subheadline,
        primaryButtonText: landingPage.heroSection.primaryButtonText,
        secondaryButtonText: landingPage.heroSection.secondaryButtonText,
        heroFeatures:
          landingPage.heroSection.heroFeatures && landingPage.heroSection.heroFeatures.length > 0
            ? landingPage.heroSection.heroFeatures
            : defaultHeroFeatures,
      });
      setFooterForm({
        companyName: landingPage.footerSection.companyName,
        description: landingPage.footerSection.description,
        copyright: landingPage.footerSection.copyright,
        showSocialLinks: landingPage.footerSection.showSocialLinks,
      });
      setTestimonialsForm({
        badge: landingPage.testimonialsSection.badge,
        headline: landingPage.testimonialsSection.headline,
        enabled: landingPage.testimonialsSection.enabled,
        testimonials: landingPage.testimonialsSection.testimonials || [],
      });
      setFeaturesForm({
        badge: landingPage.featuresSection.badge || "",
        headline: landingPage.featuresSection.headline || "",
        description: landingPage.featuresSection.description || "",
        features:
          landingPage.featuresSection.features && landingPage.featuresSection.features.length > 0
            ? landingPage.featuresSection.features
            : defaultFeatureItems,
      });
      setStatsForm({
        stats: (landingPage.statsSection?.stats || []).map((stat) => ({
          icon: stat.icon || "BarChart3",
          value: stat.value || "",
          label: stat.label || "",
        })),
      });
      setHowItWorksForm({
        badge: landingPage.howItWorksSection.badge || "",
        headline: landingPage.howItWorksSection.headline || "",
        description: landingPage.howItWorksSection.description || "",
        steps:
          landingPage.howItWorksSection.steps && landingPage.howItWorksSection.steps.length > 0
            ? landingPage.howItWorksSection.steps
            : defaultHowItWorksSteps,
      });
      setPricingForm({
        headline: landingPage.pricingSection.headline || "",
        description: landingPage.pricingSection.description || "",
        enabled: landingPage.pricingSection.enabled ?? true,
        showYearlyToggle: landingPage.pricingSection.showYearlyToggle ?? true,
      });

      setCtaForm({
        headline: landingPage.ctaSection.headline || "",
        description: landingPage.ctaSection.description || "",
        primaryButtonText: landingPage.ctaSection.primaryButtonText || "",
        secondaryButtonText: landingPage.ctaSection.secondaryButtonText || "",
        disclaimer: landingPage.ctaSection.disclaimer || "",
        enabled: landingPage.ctaSection.enabled ?? true,
      });
    }
  }, [landingPage]);

  const handleUpdateHero = () => {
    const missingFields: string[] = [];
    if (!heroForm.badge.trim()) missingFields.push("Badge");
    if (!heroForm.headline.trim()) missingFields.push("Headline");
    if (!heroForm.subheadline.trim()) missingFields.push("Subheadline");
    if (!heroForm.primaryButtonText.trim()) missingFields.push("Primary Button Text");
    if (!heroForm.secondaryButtonText.trim()) missingFields.push("Secondary Button Text");

    if (missingFields.length > 0) {
      const fieldList =
        missingFields.length === 1
          ? missingFields[0]
          : `${missingFields.slice(0, -1).join(", ")} and ${missingFields[missingFields.length - 1]}`;
      toast({
        title: "Required fields missing",
        description: `Please fill: ${fieldList}.`,
        variant: "destructive",
      });
      return;
    }

    updateSection.mutate({
      section: 'heroSection',
      data: heroForm,
    });
  };

  const handleUpdateFooter = () => {
    updateSection.mutate({
      section: 'footerSection',
      data: footerForm,
    });
  };

  const handleUpdateTestimonials = () => {
    if (!testimonialsForm.badge.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill: Badge.",
        variant: "destructive",
      });
      return;
    }
    if (!testimonialsForm.headline.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill: Headline.",
        variant: "destructive",
      });
      return;
    }

    updateSection.mutate({
      section: 'testimonialsSection',
      data: testimonialsForm,
    });
  };

  const handleUpdateFeatures = () => {
    updateSection.mutate({
      section: 'featuresSection',
      data: featuresForm,
    });
  };

  const handleUpdateCTA = () => {
    updateSection.mutate({
      section: 'ctaSection',
      data: ctaForm,
    });
  };

  const handleUpdateHowItWorks = () => {
    updateSection.mutate({
      section: 'howItWorksSection',
      data: howItWorksForm,
    });
  };

  const handleUpdatePricing = () => {
    updateSection.mutate({
      section: 'pricingSection',
      data: pricingForm,
    });
  };

  const handleUpdateStats = () => {
    updateSection.mutate({
      section: 'statsSection',
      data: statsForm,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading landing page settings...</p>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load landing page settings</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="cta">CTA</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
      </TabsList>

      <TabsContent value="hero" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero Section</CardTitle>
            <CardDescription>Customize the main banner of your landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Input 
                value={heroForm.badge}
                onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Headline</Label>
              <Input 
                value={heroForm.headline}
                onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Subheadline</Label>
              <Textarea
                value={heroForm.subheadline}
                onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Button Text</Label>
                <Input 
                  value={heroForm.primaryButtonText}
                  onChange={(e) => setHeroForm({ ...heroForm, primaryButtonText: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <Input 
                  value={heroForm.secondaryButtonText}
                  onChange={(e) => setHeroForm({ ...heroForm, secondaryButtonText: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Hero Icon Points ({heroForm.heroFeatures.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setHeroForm((prev) => ({
                      ...prev,
                      heroFeatures: [
                        ...prev.heroFeatures,
                        { icon: "FileText", label: "", order: prev.heroFeatures.length + 1 },
                      ],
                    }))
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Point
                </Button>
              </div>

              {heroForm.heroFeatures.map((item, index) => (
                <div key={`${item.order}-${index}`} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Point {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setHeroForm((prev) => ({
                          ...prev,
                          heroFeatures: prev.heroFeatures
                            .filter((_, i) => i !== index)
                            .map((point, i) => ({ ...point, order: i + 1 })),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Icon</Label>
                      <Input
                        value={item.icon}
                        onChange={(e) =>
                          setHeroForm((prev) => {
                            const updated = [...prev.heroFeatures];
                            updated[index] = { ...updated[index], icon: e.target.value };
                            return { ...prev, heroFeatures: updated };
                          })
                        }
                        className="mt-1"
                        placeholder="Icon name (e.g. FileText, Briefcase)"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Enter any Lucide icon name.
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          setHeroForm((prev) => {
                            const updated = [...prev.heroFeatures];
                            updated[index] = { ...updated[index], label: e.target.value };
                            return { ...prev, heroFeatures: updated };
                          })
                        }
                        className="mt-1"
                        placeholder="e.g. Invoices"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdateHero} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Hero Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="features" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features Section</CardTitle>
            <CardDescription>Highlight your key product features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Input value={featuresForm.badge} onChange={(e) => setFeaturesForm({ ...featuresForm, badge: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Headline</Label>
              <Input value={featuresForm.headline} onChange={(e) => setFeaturesForm({ ...featuresForm, headline: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={featuresForm.description} onChange={(e) => setFeaturesForm({ ...featuresForm, description: e.target.value })} className="mt-1" />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Feature Items ({featuresForm.features.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFeaturesForm((prev) => ({
                      ...prev,
                      features: [
                        ...prev.features,
                        {
                          icon: "FileText",
                          title: "",
                          description: "",
                          order: prev.features.length + 1,
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              {featuresForm.features.map((feature, index) => (
                <div key={`${feature.order}-${index}`} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Feature {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFeaturesForm((prev) => ({
                          ...prev,
                          features: prev.features
                            .filter((_, i) => i !== index)
                            .map((item, i) => ({ ...item, order: i + 1 })),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) =>
                        setFeaturesForm((prev) => {
                          const updated = [...prev.features];
                          updated[index] = { ...updated[index], title: e.target.value };
                          return { ...prev, features: updated };
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={feature.description}
                      onChange={(e) =>
                        setFeaturesForm((prev) => {
                          const updated = [...prev.features];
                          updated[index] = { ...updated[index], description: e.target.value };
                          return { ...prev, features: updated };
                        })
                      }
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button onClick={handleUpdateFeatures} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Features Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stats Section</CardTitle>
            <CardDescription>Display key statistics and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Statistics ({statsForm.stats.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatsForm((prev) => ({
                    stats: [...prev.stats, { icon: "BarChart3", value: "", label: "" }],
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stat
              </Button>
            </div>

            {statsForm.stats.length > 0 ? (
              <div className="space-y-3">
                {statsForm.stats.map((stat, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Stat {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatsForm((prev) => ({
                            stats: prev.stats.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => {
                          const updated = [...statsForm.stats];
                          updated[index].value = e.target.value;
                          setStatsForm({ stats: updated });
                        }}
                        className="mt-1"
                        placeholder="e.g., 50K+"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const updated = [...statsForm.stats];
                          updated[index].label = e.target.value;
                          setStatsForm({ stats: updated });
                        }}
                        className="mt-1"
                        placeholder="e.g., Active Users"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg">
                No stats yet. Click "Add Stat" to create one.
              </p>
            )}

            <div className="pt-2">
              <Button onClick={handleUpdateStats} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Stats Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="how-it-works" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works Section</CardTitle>
            <CardDescription>Explain your process step by step</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Input
                value={howItWorksForm.badge}
                onChange={(e) => setHowItWorksForm({ ...howItWorksForm, badge: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Headline</Label>
              <Input
                value={howItWorksForm.headline}
                onChange={(e) => setHowItWorksForm({ ...howItWorksForm, headline: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={howItWorksForm.description}
                onChange={(e) => setHowItWorksForm({ ...howItWorksForm, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps ({howItWorksForm.steps.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setHowItWorksForm((prev) => ({
                      ...prev,
                      steps: [
                        ...prev.steps,
                        {
                          number: String(prev.steps.length + 1).padStart(2, "0"),
                          title: "",
                          description: "",
                          features: ["", "", ""],
                          order: prev.steps.length + 1,
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {howItWorksForm.steps.map((step, index) => (
                <div key={`${step.order}-${index}`} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setHowItWorksForm((prev) => ({
                          ...prev,
                          steps: prev.steps
                            .filter((_, i) => i !== index)
                            .map((item, i) => ({
                              ...item,
                              order: i + 1,
                              number: String(i + 1).padStart(2, "0"),
                            })),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Step Number</Label>
                      <Input
                        value={step.number}
                        onChange={(e) =>
                          setHowItWorksForm((prev) => {
                            const updated = [...prev.steps];
                            updated[index] = { ...updated[index], number: e.target.value };
                            return { ...prev, steps: updated };
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={step.title}
                        onChange={(e) =>
                          setHowItWorksForm((prev) => {
                            const updated = [...prev.steps];
                            updated[index] = { ...updated[index], title: e.target.value };
                            return { ...prev, steps: updated };
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={step.description}
                      onChange={(e) =>
                        setHowItWorksForm((prev) => {
                          const updated = [...prev.steps];
                          updated[index] = { ...updated[index], description: e.target.value };
                          return { ...prev, steps: updated };
                        })
                      }
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Highlights</Label>
                    {[0, 1, 2].map((itemIndex) => (
                      <Input
                        key={itemIndex}
                        value={step.features[itemIndex] || ""}
                        onChange={(e) =>
                          setHowItWorksForm((prev) => {
                            const updated = [...prev.steps];
                            const nextFeatures = [...(updated[index].features || [])];
                            nextFeatures[itemIndex] = e.target.value;
                            updated[index] = { ...updated[index], features: nextFeatures };
                            return { ...prev, steps: updated };
                          })
                        }
                        placeholder={`Highlight ${itemIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdateHowItWorks} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save How It Works Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="testimonials" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Testimonials Section</CardTitle>
            <CardDescription>Showcase customer testimonials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Input 
                value={testimonialsForm.badge}
                onChange={(e) => setTestimonialsForm({ ...testimonialsForm, badge: e.target.value })}
                className="mt-1"
                placeholder="e.g., Testimonials"
              />
            </div>

            <div>
              <Label>Headline</Label>
              <Input 
                value={testimonialsForm.headline}
                onChange={(e) => setTestimonialsForm({ ...testimonialsForm, headline: e.target.value })}
                className="mt-1"
                placeholder="e.g., Loved by businesses everywhere"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable Testimonials Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide testimonials on landing page</p>
              </div>
              <Switch 
                checked={testimonialsForm.enabled}
                onCheckedChange={(checked) => setTestimonialsForm({ ...testimonialsForm, enabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Testimonials ({testimonialsForm.testimonials.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTestimonial = {
                      name: "New Customer",
                      role: "Job Title",
                      content: "Their feedback here...",
                      rating: 5,
                    };
                    setTestimonialsForm({
                      ...testimonialsForm,
                      testimonials: [...testimonialsForm.testimonials, newTestimonial],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>

              {testimonialsForm.testimonials.length > 0 && (
                <div className="space-y-4">
                  {testimonialsForm.testimonials.map((testimonial, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Testimonial {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTestimonialsForm({
                              ...testimonialsForm,
                              testimonials: testimonialsForm.testimonials.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input 
                            value={testimonial.name}
                            onChange={(e) => {
                              const updated = [...testimonialsForm.testimonials];
                              updated[index].name = e.target.value;
                              setTestimonialsForm({ ...testimonialsForm, testimonials: updated });
                            }}
                            className="mt-1 text-sm"
                            placeholder="Customer name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Role</Label>
                          <Input 
                            value={testimonial.role}
                            onChange={(e) => {
                              const updated = [...testimonialsForm.testimonials];
                              updated[index].role = e.target.value;
                              setTestimonialsForm({ ...testimonialsForm, testimonials: updated });
                            }}
                            className="mt-1 text-sm"
                            placeholder="Job title or company"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Testimonial Content</Label>
                        <Textarea 
                          value={testimonial.content}
                          onChange={(e) => {
                            const updated = [...testimonialsForm.testimonials];
                            updated[index].content = e.target.value;
                            setTestimonialsForm({ ...testimonialsForm, testimonials: updated });
                          }}
                          className="mt-1 text-sm min-h-[80px]"
                          placeholder="What they said..."
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Rating (1-5)</Label>
                        <Input 
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) => {
                            const updated = [...testimonialsForm.testimonials];
                            updated[index].rating = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                            setTestimonialsForm({ ...testimonialsForm, testimonials: updated });
                          }}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {testimonialsForm.testimonials.length === 0 && (
                <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg">
                  No testimonials yet. Click "Add Testimonial" to create one.
                </p>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              <Button onClick={handleUpdateTestimonials} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Testimonials Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing Section</CardTitle>
            <CardDescription>Configure how pricing is displayed on the landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={pricingForm.headline}
                onChange={(e) => setPricingForm({ ...pricingForm, headline: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={pricingForm.description}
                onChange={(e) => setPricingForm({ ...pricingForm, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable Pricing Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide pricing on landing page</p>
              </div>
              <Switch
                checked={pricingForm.enabled}
                onCheckedChange={(checked) => setPricingForm({ ...pricingForm, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Show Monthly/Yearly Toggle</h4>
                <p className="text-sm text-muted-foreground">Allow users to switch between billing periods</p>
              </div>
              <Switch
                checked={pricingForm.showYearlyToggle}
                onCheckedChange={(checked) => setPricingForm({ ...pricingForm, showYearlyToggle: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Plans ({pricingPlansCount})</Label>
              <p className="text-xs text-muted-foreground">
                Currently displaying {pricingPlansCount} plans from Billing Plans.
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdatePricing} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Pricing Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cta" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Call-to-Action Section</CardTitle>
            <CardDescription>Configure the final CTA section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input value={ctaForm.headline} onChange={(e) => setCtaForm({ ...ctaForm, headline: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={ctaForm.description} onChange={(e) => setCtaForm({ ...ctaForm, description: e.target.value })} className="mt-1" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Button Text</Label>
                <Input value={ctaForm.primaryButtonText} onChange={(e) => setCtaForm({ ...ctaForm, primaryButtonText: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <Input value={ctaForm.secondaryButtonText} onChange={(e) => setCtaForm({ ...ctaForm, secondaryButtonText: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Disclaimer</Label>
              <Input value={ctaForm.disclaimer} onChange={(e) => setCtaForm({ ...ctaForm, disclaimer: e.target.value })} className="mt-1" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable CTA Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide CTA on landing page</p>
              </div>
              <Switch checked={ctaForm.enabled} onCheckedChange={(checked) => setCtaForm({ ...ctaForm, enabled: checked })} />
            </div>
            <div className="pt-4">
              <Button onClick={handleUpdateCTA} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save CTA Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="footer" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Footer Section</CardTitle>
            <CardDescription>Configure footer content and links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input 
                value={footerForm.companyName}
                onChange={(e) => setFooterForm({ ...footerForm, companyName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Company Description</Label>
              <Textarea
                value={footerForm.description}
                onChange={(e) => setFooterForm({ ...footerForm, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Copyright Text</Label>
              <Input 
                value={footerForm.copyright}
                onChange={(e) => setFooterForm({ ...footerForm, copyright: e.target.value })}
                className="mt-1"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium text-sm">Show Social Links</h4>
              </div>
              <Switch 
                checked={footerForm.showSocialLinks}
                onCheckedChange={(checked) => setFooterForm({ ...footerForm, showSocialLinks: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Footer Links</Label>
              <p className="text-xs text-muted-foreground">
                Social: {socialLinks.length} links | 
                Support: {supportFooterCount} links | 
                Corporate: {corporateFooterCount} links
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdateFooter} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Saving...' : 'Save Footer Section'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// -------------------- Main Page --------------------
export default function PageEditor() {
  const { data: landingPage } = useLandingPage();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const resetLandingMutation = useResetLandingPage();

  const handleSave = () => {
    toast({
      title: "Changes saved",
      description: "Your page configuration has been updated successfully.",
    });
  };

  const handlePreview = () => {
    // If landing page settings are not loaded yet, show an error
    if (!landingPage) {
      toast({
        title: "Preview unavailable",
        description: "Landing page data is not ready yet. Please try again shortly.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store current landing page data into sessionStorage so the preview
      // tab can read it. Then open the site root with ?preview=true which
      // is recognized by `useLandingPage` to render the draft payload.
      sessionStorage.setItem('landing_preview', JSON.stringify(landingPage));
      window.open(`${window.location.origin}/?preview=true`, '_blank');

      toast({
        title: "Opening preview",
        description: "Preview opened in a new tab.",
      });
    } catch (e) {
      toast({
        title: "Preview failed",
        description: "Could not open preview tab.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Page Editor</h1>
          <p className="text-muted-foreground mt-1">
            Customize VAYPR&apos;s website landing page and content sections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <EditorSection
          title="Social Media"
          description="Manage social media links displayed on your website"
          icon={Globe}
          badge={`${initialSocialLinks.length} links`}
          defaultOpen
        >
          <SocialMediaEditor />
        </EditorSection>

        <EditorSection
          title="Support Pages"
          description="Configure support and policy pages"
          icon={HelpCircle}
          badge={`${initialSupportPages.length} pages`}
        >
          <SupportPagesEditor />
        </EditorSection>

        <EditorSection
          title="Corporate Pages"
          description="Manage corporate and business information pages"
          icon={Building2}
          badge="API managed"
        >
          <CorporatePagesEditor />
        </EditorSection>

        <EditorSection
          title="Landing Page"
          description="Customize hero, features, and other landing page sections"
          icon={Sparkles}
          badge={`${initialLandingSections.length} sections`}
        >
          <LandingPageEditor />
        </EditorSection>
      </div>

      {/* Reset Landing Page Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Landing Page to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your current landing page settings with the default configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await resetLandingMutation.mutateAsync();
                } catch (e) {
                  // handled by hook's onError
                } finally {
                  setShowResetDialog(false);
                }
              }}
              disabled={resetLandingMutation.isPending}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
  const defaultFeatureItems = [
    {
      icon: "FileText",
      title: "Professional Invoices",
      description:
        "Create and send beautiful invoices in seconds. Customize templates and track payment status.",
      order: 1,
    },
    {
      icon: "Users",
      title: "Client Management",
      description:
        "Keep all your client information organized. View history, track interactions, and build relationships.",
      order: 2,
    },
    {
      icon: "Receipt",
      title: "Expense Tracking",
      description: "Capture receipts, categorize expenses, and stay on top of your business spending.",
      order: 3,
    },
    {
      icon: "TrendingUp",
      title: "Revenue Insights",
      description: "Visualize your income trends and make data-driven decisions for growth.",
      order: 4,
    },
    {
      icon: "Clock",
      title: "Recurring Billing",
      description: "Set up automatic recurring invoices for retainer clients and subscription services.",
      order: 5,
    },
    {
      icon: "Send",
      title: "Quote Management",
      description: "Create quotes, share with clients, and convert approved quotes to invoices instantly.",
      order: 6,
    },
  ];

  const defaultHowItWorksSteps = [
    {
      number: "01",
      title: "Sign up in seconds",
      description: "Create your free account and set up your business profile. No credit card required.",
      features: ["Free to start", "No setup fees", "Instant access"],
      order: 1,
    },
    {
      number: "02",
      title: "Add your clients",
      description: "Import existing clients or add them manually. Keep all contact info organized in one place.",
      features: ["Bulk import", "Smart organization", "Contact history"],
      order: 2,
    },
    {
      number: "03",
      title: "Create & send invoices",
      description: "Generate professional invoices, share via link or email, and get paid faster than ever.",
      features: ["Custom templates", "One-click sending", "Payment tracking"],
      order: 3,
    },
    {
      number: "04",
      title: "Track & grow",
      description: "Monitor your revenue, manage expenses, and use insights to grow your business.",
      features: ["Real-time analytics", "Expense tracking", "Growth insights"],
      order: 4,
    },
  ];
