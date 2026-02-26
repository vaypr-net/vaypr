import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, RefreshCcw, FileText, Edit3, Eye, Plus, Save, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useSupportPages,
  useUpdateSupportPage,
  useToggleSupportPageEnabled,
  useInitializeSupportPages,
} from "@/hooks/useSupportPages";
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
import { PageType, type SupportPage, type ContentSection } from "@/api/services/support-pages.service";

const PAGE_ICONS = {
  CONTACT: Mail,
  PRIVACY: Shield,
  REFUND: RefreshCcw,
  TERMS: FileText,
  ABOUT: Mail,
  B2B: Mail,
  CUSTOM: Mail,
};

type SupportKind = "contact" | "privacy" | "refund" | "terms" | "custom";

const getPageKind = (page: SupportPage): SupportKind => {
  const slug = (page.slug || "").toLowerCase().replace(/^\/+/, "");
  if (slug === "contact" || page.type === PageType.CONTACT) return "contact";
  if (slug === "privacy" || page.type === PageType.PRIVACY) return "privacy";
  if (slug === "refund" || page.type === PageType.REFUND) return "refund";
  if (slug === "terms" || page.type === PageType.TERMS) return "terms";
  return "custom";
};

const defaultContentByKind: Record<SupportKind, Record<string, any>> = {
  contact: {
    title: "Get in Touch",
    description: "Have questions? We're here to help and will respond as soon as possible.",
    contactInfoTitle: "Contact Information",
    contactInfoDescription: "Reach out through any of these channels and we'll get back to you promptly.",
    emailHeading: "Email",
    emails: ["support@vaypr.net", "sales@vaypr.net"],
    phoneHeading: "Phone",
    phone: "(+965) 2246-4030",
    phoneHours: "Sun-Thr 9am-6pm GMT +3",
    officeHeading: "Office",
    officeLine1: "Salhiya, Mohammad Thunayan",
    officeLine2: "Alghanim Street, Kuwait City",
    responseTimeHeading: "Response Time",
    responseTime: "Usually within 3 hours",
    formTitle: "Send us a Message",
    subjectOptions: [
      { value: "general", label: "General Inquiry" },
      { value: "support", label: "Technical Support" },
      { value: "billing", label: "Billing Question" },
      { value: "enterprise", label: "Enterprise Sales" },
      { value: "partnership", label: "Partnership Opportunity" },
      { value: "feedback", label: "Feedback" },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "Your privacy is important to us. This policy explains how we collect, use, and protect your information.",
    lastUpdated: "January 15, 2026",
    sections: [
      {
        title: "Information We Collect",
        content:
          "We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes account information, billing information, business data, communications, and usage data.",
      },
      {
        title: "How We Use Your Information",
        content:
          "We use this information to provide and improve services, process transactions, send updates, respond to support requests, analyze usage, prevent fraud, and personalize your experience.",
      },
      {
        title: "Information Sharing",
        content:
          "We do not sell your personal information. We may share data with trusted service providers, for legal requirements, protection and security purposes, business transfers, or with your consent.",
      },
      {
        title: "Data Security",
        content:
          "We use industry-standard controls including encryption in transit and at rest, strict access controls, and ongoing monitoring to safeguard your information.",
      },
      {
        title: "Data Retention",
        content:
          "We retain your information while your account is active and as needed for legal, operational, and security purposes. You can request deletion subject to applicable requirements.",
      },
      {
        title: "Your Rights",
        content:
          "Depending on your location, you may request access, correction, deletion, portability, and processing restrictions for your personal information.",
      },
      {
        title: "Cookies and Tracking",
        content:
          "We use cookies and similar technologies for authentication, preferences, analytics, and product improvements. You can manage cookies in your browser settings.",
      },
      {
        title: "Children's Privacy",
        content:
          "Our services are not directed to children under 16. If we become aware of such data collection, we will take steps to delete it.",
      },
      {
        title: "Changes to This Policy",
        content:
          "We may update this policy from time to time. Material changes will be reflected on this page with an updated effective date.",
      },
      {
        title: "Contact Us",
        content:
          "If you have questions about this Privacy Policy, contact us at privacy@vaypr.com.",
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    description: "We want you to be completely satisfied with VAYPR. Here's everything you need to know about our refund process.",
    lastUpdated: "January 15, 2026",
    guaranteeTitle: "30-Day Money-Back Guarantee",
    guaranteeDescription: "Try VAYPR risk-free. If you're not satisfied within the first 30 days, we'll refund your payment in full.",
    eligibleTitle: "Eligible for Refund",
    eligibleItems: [
      {
        title: "First-time subscribers within 30 days",
        description: "New customers who haven't used a refund before and request within 30 days of initial purchase.",
      },
      {
        title: "Service unavailability",
        description: "Extended downtime or service issues that prevented you from using VAYPR for 48+ consecutive hours.",
      },
      {
        title: "Accidental duplicate charges",
        description: "If you were charged twice for the same billing period, we'll refund the duplicate charge immediately.",
      },
      {
        title: "Annual plan downgrades",
        description: "Prorated refund available when downgrading from an annual plan within 30 days.",
      },
    ],
    notEligibleTitle: "Not Eligible for Refund",
    notEligibleItems: [
      {
        title: "Requests after 30 days",
        description: "Refund requests submitted more than 30 days after the initial purchase.",
      },
      {
        title: "Violation of Terms of Service",
        description: "Accounts terminated due to abuse, fraud, or violation of our terms.",
      },
      {
        title: "Previous refund recipients",
        description: "Customers who have already received a refund for a previous subscription.",
      },
      {
        title: "Partial month usage",
        description: "We don't offer prorated refunds for partial months on monthly plans.",
      },
    ],
    requestTitle: "How to Request a Refund",
    requestSteps: [
      {
        title: "Contact Support",
        description: "Email billing@vaypr.net with your account email and reason for refund.",
      },
      {
        title: "Review Process",
        description: "Our team will review your request within 1-2 business days.",
      },
      {
        title: "Receive Refund",
        description: "Approved refunds are processed within 5-10 business days to your original payment method.",
      },
    ],
    contactTitle: "Questions About Refunds?",
    contactDescription: "Our billing team is happy to help with any questions about refunds or your subscription.",
    contactEmail: "billing@vaypr.net",
  },
  terms: {
    title: "Terms of Service",
    description: "By using VAYPR, you agree to these terms. Please read them carefully.",
    lastUpdated: "February 14, 2026",
    acceptanceHeading: "1. Acceptance of Terms",
    acceptanceOfTerms: "",
    useOfServiceHeading: "2. Use of Service",
    useOfServiceIntro: "",
    useOfServiceItems: [],
    accountResponsibilitiesHeading: "3. Account Responsibilities",
    accountResponsibilitiesIntro: "",
    accountResponsibilitiesItems: [],
    subscriptionAndBillingHeading: "4. Subscription and Billing",
    subscriptionAndBilling: "",
    intellectualPropertyHeading: "5. Intellectual Property",
    intellectualProperty: "",
    dataAndPrivacyHeading: "6. Data and Privacy",
    dataAndPrivacy: "",
    serviceAvailabilityHeading: "7. Service Availability",
    serviceAvailability: "",
    terminationHeading: "8. Termination",
    termination: "",
    limitationOfLiabilityHeading: "9. Limitation of Liability",
    limitationOfLiability: "",
    changesToTermsHeading: "10. Changes to Terms",
    changesToTerms: "",
    governingLawHeading: "11. Governing Law",
    governingLaw: "",
    contactHeading: "12. Contact Information",
    contactIntro: "",
    contactEmail: "",
    contactAddress: "",
    contactPhone: "",
    additionalSections: [],
  },
  custom: {},
};

const isLikelyEmail = (value: string): boolean => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const normalizeTitledItems = (
  rawItems: any[],
  fallbackItems: Array<{ title: string; description: string }>,
): Array<{ title: string; description: string }> => {
  const normalizedBase = fallbackItems.map((fallback, index) => {
    const raw = rawItems[index] || {};
    return {
      title: (raw?.title || "").toString().trim() || fallback.title,
      description: (raw?.description || "").toString().trim() || fallback.description,
    };
  });

  if (rawItems.length <= fallbackItems.length) return normalizedBase;

  const extraItems = rawItems.slice(fallbackItems.length).map((item: any) => ({
    title: (item?.title || "").toString().trim(),
    description: (item?.description || "").toString().trim(),
  })).filter((item: { title: string; description: string }) => item.title || item.description);

  return [...normalizedBase, ...extraItems];
};

export function SupportPagesManagement() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInitDialog, setShowInitDialog] = useState(false);

  // React Query hooks
  const { data: pages = [], isLoading } = useSupportPages({ enabledOnly: false });
  const updatePageMutation = useUpdateSupportPage();
  const toggleEnabledMutation = useToggleSupportPageEnabled();
  const initializeMutation = useInitializeSupportPages();

  // Form state for editing
  const [formData, setFormData] = useState<Partial<SupportPage>>({});

  const handleEdit = (page: SupportPage) => {
    const pageKind = getPageKind(page);
    const rawContent = (page.content || {}) as Record<string, any>;
    const rawEmails = Array.isArray(rawContent.emails)
      ? rawContent.emails.filter((item: any) => typeof item === "string" && item.trim().length > 0)
      : [];
    const validEmails = rawEmails.filter((item: string) => isLikelyEmail(item));
    const misplacedContactValues = rawEmails.filter((item: string) => !isLikelyEmail(item));
    const subjectOptions = Array.isArray(rawContent.subjectOptions)
      ? rawContent.subjectOptions
      : [];
    const fallbackSectionsFromPage =
      Array.isArray(page.sections) && page.sections.length
        ? page.sections.map((section) => ({
            title: section.title || "",
            content: section.content || "",
          }))
        : [];
    const privacySectionsFromContent = Array.isArray(rawContent.sections)
      ? rawContent.sections
      : [];
    const privacySections =
      privacySectionsFromContent.length >= 3
        ? privacySectionsFromContent
        : fallbackSectionsFromPage.length >= 3
          ? fallbackSectionsFromPage
          : defaultContentByKind.privacy.sections;
    const refundEligibleItems = Array.isArray(rawContent.eligibleItems)
      ? rawContent.eligibleItems
      : [];
    const refundNotEligibleItems = Array.isArray(rawContent.notEligibleItems)
      ? rawContent.notEligibleItems
      : [];
    const refundRequestSteps = Array.isArray(rawContent.requestSteps)
      ? rawContent.requestSteps
      : [];
    const termsUseOfServiceItems = Array.isArray(rawContent.useOfServiceItems)
      ? rawContent.useOfServiceItems
      : [];
    const termsAccountResponsibilityItems = Array.isArray(rawContent.accountResponsibilitiesItems)
      ? rawContent.accountResponsibilitiesItems
      : [];
    const termsAdditionalSections = Array.isArray(rawContent.additionalSections)
      ? rawContent.additionalSections
      : [];
    const normalizedTermsContent =
      pageKind === "terms"
        ? {
            ...defaultContentByKind.terms,
            ...rawContent,
            useOfServiceItems:
              termsUseOfServiceItems.length > 0
                ? termsUseOfServiceItems
                : defaultContentByKind.terms.useOfServiceItems,
            accountResponsibilitiesItems:
              termsAccountResponsibilityItems.length > 0
                ? termsAccountResponsibilityItems
                : defaultContentByKind.terms.accountResponsibilitiesItems,
            additionalSections: termsAdditionalSections,
          }
        : {};
    const normalizedRefundContent =
      pageKind === "refund"
        ? {
            title: rawContent.title || defaultContentByKind.refund.title,
            description: rawContent.description || defaultContentByKind.refund.description,
            lastUpdated: rawContent.lastUpdated || defaultContentByKind.refund.lastUpdated,
            guaranteeTitle: rawContent.guaranteeTitle || defaultContentByKind.refund.guaranteeTitle,
            guaranteeDescription: rawContent.guaranteeDescription || defaultContentByKind.refund.guaranteeDescription,
            eligibleTitle: rawContent.eligibleTitle || defaultContentByKind.refund.eligibleTitle,
            eligibleItems: normalizeTitledItems(
              refundEligibleItems,
              defaultContentByKind.refund.eligibleItems,
            ),
            notEligibleTitle: rawContent.notEligibleTitle || defaultContentByKind.refund.notEligibleTitle,
            notEligibleItems: normalizeTitledItems(
              refundNotEligibleItems,
              defaultContentByKind.refund.notEligibleItems,
            ),
            requestTitle: rawContent.requestTitle || defaultContentByKind.refund.requestTitle,
            requestSteps: normalizeTitledItems(
              refundRequestSteps,
              defaultContentByKind.refund.requestSteps,
            ),
            contactTitle: rawContent.contactTitle || defaultContentByKind.refund.contactTitle,
            contactDescription: rawContent.contactDescription || defaultContentByKind.refund.contactDescription,
            contactEmail: rawContent.contactEmail || defaultContentByKind.refund.contactEmail,
          }
        : {};
    const normalizedSubjectOptions = subjectOptions.map((item: any) => {
      if (typeof item === "string") {
        return { value: item.toLowerCase().replace(/\s+/g, "-"), label: item };
      }
      return {
        value: item?.value || item?.label || "",
        label: item?.label || item?.value || "",
      };
    });

    setEditingId(page._id);
    setFormData({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription,
      sections: page.sections,
      contactFormSettings: page.contactFormSettings,
      content: {
        ...defaultContentByKind[pageKind],
        ...rawContent,
        ...(pageKind === "contact"
          ? {
              emails: validEmails.length ? validEmails : defaultContentByKind.contact.emails,
              emailHeading:
                rawContent.emailHeading ||
                defaultContentByKind.contact.emailHeading,
              phoneHeading:
                rawContent.phoneHeading ||
                defaultContentByKind.contact.phoneHeading,
              phone:
                rawContent.phone ||
                misplacedContactValues[0] ||
                defaultContentByKind.contact.phone,
              phoneHours:
                rawContent.phoneHours ||
                misplacedContactValues[1] ||
                defaultContentByKind.contact.phoneHours,
              officeHeading:
                rawContent.officeHeading ||
                defaultContentByKind.contact.officeHeading,
              officeLine1:
                rawContent.officeLine1 ||
                misplacedContactValues[2] ||
                defaultContentByKind.contact.officeLine1,
              officeLine2:
                rawContent.officeLine2 ||
                misplacedContactValues[3] ||
                defaultContentByKind.contact.officeLine2,
              responseTimeHeading:
                rawContent.responseTimeHeading ||
                defaultContentByKind.contact.responseTimeHeading,
              responseTime:
                rawContent.responseTime ||
                misplacedContactValues[4] ||
                defaultContentByKind.contact.responseTime,
              formTitle:
                rawContent.formTitle ||
                misplacedContactValues[5] ||
                defaultContentByKind.contact.formTitle,
              subjectOptions: normalizedSubjectOptions.length
                ? normalizedSubjectOptions
                : defaultContentByKind.contact.subjectOptions,
            }
            : pageKind === "privacy"
              ? { sections: privacySections }
            : pageKind === "refund"
              ? normalizedRefundContent
            : pageKind === "terms"
              ? normalizedTermsContent
            : {}),
      },
      enabled: page.enabled,
      showInFooter: page.showInFooter,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!editingId) return;

    await updatePageMutation.mutateAsync({
      id: editingId,
      data: {
        ...formData,
        content: formData.content as Record<string, any>,
      },
    });

    setEditingId(null);
    setFormData({});
  };

  const handleToggleEnabled = async (id: string) => {
    await toggleEnabledMutation.mutateAsync(id);
  };

  const handlePreviewPage = (page: SupportPage) => {
    const rawSlug = (page?.slug || "").toString().trim();
    const normalizedSlug = rawSlug.replace(/^\/+/, "");
    const lowerSlug = normalizedSlug.toLowerCase();

    let previewPath = `/support/${normalizedSlug}`;

    if (page.type === PageType.CONTACT || lowerSlug === "contact") previewPath = "/contact";
    else if (page.type === PageType.PRIVACY || lowerSlug === "privacy") previewPath = "/privacy";
    else if (page.type === PageType.REFUND || lowerSlug === "refund") previewPath = "/refund";
    else if (page.type === PageType.TERMS || lowerSlug === "terms") previewPath = "/terms";
    else if (lowerSlug === "faqs") previewPath = "/faqs";

    window.location.href = `${window.location.origin}${previewPath}`;
  };

  const handleInitializeDefaults = async () => {
    await initializeMutation.mutateAsync();
    setShowInitDialog(false);
  };

  const updateSection = (sectionIndex: number, field: keyof ContentSection, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section
      ),
    }));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...(prev.sections || []),
        { title: '', content: '', order: (prev.sections?.length || 0) + 1 },
      ],
    }));
  };

  const removeSection = (sectionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.filter((_, index) => index !== sectionIndex),
    }));
  };

  const updateContentField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        [field]: value,
      },
    }));
  };

  const updateContentArrayItem = (field: string, index: number, key: string, value: any) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as any[];
    const next = [...current];
    next[index] = { ...(next[index] || {}), [key]: value };
    updateContentField(field, next);
  };

  const addContentArrayItem = (field: string, item: any) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as any[];
    updateContentField(field, [...current, item]);
  };

  const removeContentArrayItem = (field: string, index: number) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as any[];
    updateContentField(
      field,
      current.filter((_, i) => i !== index),
    );
  };

  const updateStringArrayItem = (field: string, index: number, value: string) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as string[];
    const next = [...current];
    next[index] = value;
    updateContentField(field, next);
  };

  const addStringArrayItem = (field: string) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as string[];
    updateContentField(field, [...current, ""]);
  };

  const removeStringArrayItem = (field: string, index: number) => {
    const current = (((formData.content || {}) as Record<string, any>)[field] || []) as string[];
    updateContentField(
      field,
      current.filter((_, i) => i !== index),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading support pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Support Pages</h3>
          <p className="text-sm text-muted-foreground">
            Manage Contact, Privacy Policy, Refund Policy, and Terms pages
          </p>
        </div>
        <Button onClick={() => setShowInitDialog(true)} variant="outline" disabled={initializeMutation.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Initialize Default Pages
        </Button>
      </div>

      {/* Pages List */}
      <div className="space-y-3">
        {pages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No support pages found</p>
            <p className="text-sm mb-4">Initialize default pages to get started</p>
            <Button onClick={() => setShowInitDialog(true)}>
              Initialize Default Pages
            </Button>
          </div>
        ) : (
          pages
            .sort((a, b) => a.order - b.order)
            .map((page) => {
              const IconComponent = PAGE_ICONS[page.type as keyof typeof PAGE_ICONS] || Mail;
              const isEditing = editingId === page._id;
              const pageKind = getPageKind(page);

              return (
                <div key={page._id} className="rounded-lg border bg-card overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{page.title}</h4>
                        <Badge variant="outline" className="text-xs font-mono">
                          /{page.slug}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {page.type}
                        </Badge>
                        {page.showInFooter && (
                          <Badge variant="outline" className="text-xs">
                            In Footer
                          </Badge>
                        )}
                      </div>
                      {page.metaDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {page.metaDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={page.enabled}
                          onCheckedChange={() => handleToggleEnabled(page._id)}
                          disabled={toggleEnabledMutation.isPending}
                        />
                        <span className="text-xs text-muted-foreground w-16">
                          {page.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => (isEditing ? handleCancelEdit() : handleEdit(page))}
                      >
                        {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
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
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                      >
                        <div className="p-4 bg-muted/30 space-y-4">
                          {/* Basic Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Page Title</Label>
                              <Input
                                value={formData.title || ''}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">URL Slug</Label>
                              <Input
                                value={formData.slug || ''}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="mt-1 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Meta Description</Label>
                            <Input
                              value={formData.metaDescription || ''}
                              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                              className="mt-1"
                              placeholder="SEO meta description..."
                            />
                          </div>

                          {pageKind === "custom" && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Content Sections ({formData.sections?.length || 0})</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addSection}
                                  className="h-7 text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Section
                                </Button>
                              </div>

                              {formData.sections?.map((section, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-background space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Section {index + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => removeSection(index)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div>
                                    <Input
                                      value={section.title}
                                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                                      placeholder="Section title..."
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Textarea
                                      value={section.content}
                                      onChange={(e) => updateSection(index, 'content', e.target.value)}
                                      placeholder="Section content..."
                                      className="text-sm min-h-[80px]"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Contact Form Settings (only for Contact page) */}
                          {page.type === PageType.CONTACT && formData.contactFormSettings && (
                            <div className="space-y-3 border-t pt-4">
                              <Label className="text-sm font-semibold">Contact Form Settings</Label>
                              
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={formData.contactFormSettings.enabled}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      contactFormSettings: {
                                        ...formData.contactFormSettings!,
                                        enabled: checked,
                                      },
                                    })
                                  }
                                />
                                <Label className="text-xs">Enable Contact Form</Label>
                              </div>

                              <div>
                                <Label className="text-xs">Recipient Email</Label>
                                <Input
                                  value={formData.contactFormSettings.recipientEmail}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      contactFormSettings: {
                                        ...formData.contactFormSettings!,
                                        recipientEmail: e.target.value,
                                      },
                                    })
                                  }
                                  className="mt-1"
                                  type="email"
                                  placeholder="support@example.com"
                                />
                              </div>

                              <div>
                                <Label className="text-xs">Response Message</Label>
                                <Textarea
                                  value={formData.contactFormSettings.responseMessage}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      contactFormSettings: {
                                        ...formData.contactFormSettings!,
                                        responseMessage: e.target.value,
                                      },
                                    })
                                  }
                                  className="mt-1 min-h-[60px]"
                                  placeholder="Thank you for contacting us..."
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 border-t pt-4">
                            <Label className="text-sm font-semibold">Structured Page Content</Label>
                            {pageKind === "contact" && (
                              <div className="space-y-3">
                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Hero Section</Label>
                                  <Input
                                    placeholder="Hero title"
                                    value={((formData.content || {}) as Record<string, any>).title || ""}
                                    onChange={(e) => updateContentField("title", e.target.value)}
                                  />
                                  <Textarea
                                    placeholder="Hero description"
                                    value={((formData.content || {}) as Record<string, any>).description || ""}
                                    onChange={(e) => updateContentField("description", e.target.value)}
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Contact Information Block</Label>
                                  <Input
                                    placeholder="Contact info heading"
                                    value={((formData.content || {}) as Record<string, any>).contactInfoTitle || ""}
                                    onChange={(e) => updateContentField("contactInfoTitle", e.target.value)}
                                  />
                                  <Textarea
                                    placeholder="Contact info description"
                                    value={((formData.content || {}) as Record<string, any>).contactInfoDescription || ""}
                                    onChange={(e) => updateContentField("contactInfoDescription", e.target.value)}
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Email Section</Label>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addStringArrayItem("emails")}>
                                      <Plus className="w-3 h-3 mr-1" /> Add Email
                                    </Button>
                                  </div>
                                  <Input
                                    placeholder="Email heading"
                                    value={((formData.content || {}) as Record<string, any>).emailHeading || ""}
                                    onChange={(e) => updateContentField("emailHeading", e.target.value)}
                                  />
                                  {((((formData.content || {}) as Record<string, any>).emails || []) as string[]).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <Input
                                        value={item}
                                        onChange={(e) => updateStringArrayItem("emails", idx, e.target.value)}
                                        placeholder="email@company.com"
                                      />
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStringArrayItem("emails", idx)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Phone Section</Label>
                                  <Input
                                    placeholder="Phone heading"
                                    value={((formData.content || {}) as Record<string, any>).phoneHeading || ""}
                                    onChange={(e) => updateContentField("phoneHeading", e.target.value)}
                                  />
                                  <Input
                                    placeholder="Phone number"
                                    value={((formData.content || {}) as Record<string, any>).phone || ""}
                                    onChange={(e) => updateContentField("phone", e.target.value)}
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Office Section</Label>
                                  <Input
                                    placeholder="Office heading"
                                    value={((formData.content || {}) as Record<string, any>).officeHeading || ""}
                                    onChange={(e) => updateContentField("officeHeading", e.target.value)}
                                  />
                                  <Input
                                    placeholder="Office line 1"
                                    value={((formData.content || {}) as Record<string, any>).officeLine1 || ""}
                                    onChange={(e) => updateContentField("officeLine1", e.target.value)}
                                  />
                                  <Input
                                    placeholder="Office line 2"
                                    value={((formData.content || {}) as Record<string, any>).officeLine2 || ""}
                                    onChange={(e) => updateContentField("officeLine2", e.target.value)}
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Response Time Section</Label>
                                  <Input
                                    placeholder="Response time heading"
                                    value={((formData.content || {}) as Record<string, any>).responseTimeHeading || ""}
                                    onChange={(e) => updateContentField("responseTimeHeading", e.target.value)}
                                  />
                                  <Input
                                    placeholder="Response time text"
                                    value={((formData.content || {}) as Record<string, any>).responseTime || ""}
                                    onChange={(e) => updateContentField("responseTime", e.target.value)}
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Form Section</Label>
                                  <Input
                                    placeholder="Form title"
                                    value={((formData.content || {}) as Record<string, any>).formTitle || ""}
                                    onChange={(e) => updateContentField("formTitle", e.target.value)}
                                  />
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Subject Options</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => addContentArrayItem("subjectOptions", { value: "", label: "" })}
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add Option
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).subjectOptions || []) as Array<{ value: string; label: string }>).map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                      <Input
                                        placeholder="value"
                                        value={item?.value || ""}
                                        onChange={(e) => updateContentArrayItem("subjectOptions", idx, "value", e.target.value)}
                                      />
                                      <Input
                                        placeholder="label"
                                        value={item?.label || ""}
                                        onChange={(e) => updateContentArrayItem("subjectOptions", idx, "label", e.target.value)}
                                      />
                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeContentArrayItem("subjectOptions", idx)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {pageKind === "privacy" && (
                              <div className="space-y-3">
                                <Input
                                  placeholder="Hero title"
                                  value={((formData.content || {}) as Record<string, any>).title || ""}
                                  onChange={(e) => updateContentField("title", e.target.value)}
                                />
                                <Textarea
                                  placeholder="Hero description"
                                  value={((formData.content || {}) as Record<string, any>).description || ""}
                                  onChange={(e) => updateContentField("description", e.target.value)}
                                />
                                <Input
                                  placeholder="Last updated text"
                                  value={((formData.content || {}) as Record<string, any>).lastUpdated || ""}
                                  onChange={(e) => updateContentField("lastUpdated", e.target.value)}
                                />
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Policy Sections</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => addContentArrayItem("sections", { title: "", content: "" })}
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add Section
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).sections || []) as Array<{ title: string; content: string }>).map((item, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 bg-background space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Section {idx + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeContentArrayItem("sections", idx)}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Section Title</Label>
                                        <Input
                                          className="mt-1"
                                          placeholder="Section title"
                                          value={item?.title || ""}
                                          onChange={(e) => updateContentArrayItem("sections", idx, "title", e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Section Content</Label>
                                        <Textarea
                                          className="mt-1"
                                          placeholder="Section content"
                                          value={item?.content || ""}
                                          onChange={(e) => updateContentArrayItem("sections", idx, "content", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {pageKind === "refund" && (
                              <div className="space-y-3">
                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Hero Section</Label>
                                  <Input placeholder="Hero title" value={((formData.content || {}) as Record<string, any>).title || ""} onChange={(e) => updateContentField("title", e.target.value)} />
                                  <Textarea placeholder="Hero description" value={((formData.content || {}) as Record<string, any>).description || ""} onChange={(e) => updateContentField("description", e.target.value)} />
                                  <Input placeholder="Last updated text" value={((formData.content || {}) as Record<string, any>).lastUpdated || ""} onChange={(e) => updateContentField("lastUpdated", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Guarantee Section</Label>
                                  <Input placeholder="Guarantee title" value={((formData.content || {}) as Record<string, any>).guaranteeTitle || ""} onChange={(e) => updateContentField("guaranteeTitle", e.target.value)} />
                                  <Textarea placeholder="Guarantee description" value={((formData.content || {}) as Record<string, any>).guaranteeDescription || ""} onChange={(e) => updateContentField("guaranteeDescription", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-2">
                                  <Label className="text-xs font-semibold">Eligible for Refund Section</Label>
                                  <Input placeholder="Eligible section title" value={((formData.content || {}) as Record<string, any>).eligibleTitle || ""} onChange={(e) => updateContentField("eligibleTitle", e.target.value)} />
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Eligible Items</Label>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addContentArrayItem("eligibleItems", { title: "", description: "" })}>
                                      <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).eligibleItems || []) as Array<{ title: string; description: string }>).map((item, idx) => (
                                    <div key={idx} className="rounded border p-3 bg-card/50 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Item {idx + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContentArrayItem("eligibleItems", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Title</Label>
                                        <Input className="mt-1" placeholder="Title" value={item?.title || ""} onChange={(e) => updateContentArrayItem("eligibleItems", idx, "title", e.target.value)} />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Description</Label>
                                        <Textarea className="mt-1" placeholder="Description" value={item?.description || ""} onChange={(e) => updateContentArrayItem("eligibleItems", idx, "description", e.target.value)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-2">
                                  <Label className="text-xs font-semibold">Not Eligible for Refund Section</Label>
                                  <Input placeholder="Not eligible section title" value={((formData.content || {}) as Record<string, any>).notEligibleTitle || ""} onChange={(e) => updateContentField("notEligibleTitle", e.target.value)} />
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Not Eligible Items</Label>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addContentArrayItem("notEligibleItems", { title: "", description: "" })}>
                                      <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).notEligibleItems || []) as Array<{ title: string; description: string }>).map((item, idx) => (
                                    <div key={idx} className="rounded border p-3 bg-card/50 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Item {idx + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContentArrayItem("notEligibleItems", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Title</Label>
                                        <Input className="mt-1" placeholder="Title" value={item?.title || ""} onChange={(e) => updateContentArrayItem("notEligibleItems", idx, "title", e.target.value)} />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Description</Label>
                                        <Textarea className="mt-1" placeholder="Description" value={item?.description || ""} onChange={(e) => updateContentArrayItem("notEligibleItems", idx, "description", e.target.value)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-2">
                                  <Label className="text-xs font-semibold">How to Request a Refund Section</Label>
                                  <Input placeholder="Request section title" value={((formData.content || {}) as Record<string, any>).requestTitle || ""} onChange={(e) => updateContentField("requestTitle", e.target.value)} />
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Request Steps</Label>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addContentArrayItem("requestSteps", { title: "", description: "" })}>
                                      <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).requestSteps || []) as Array<{ title: string; description: string }>).map((item, idx) => (
                                    <div key={idx} className="rounded border p-3 bg-card/50 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Step {idx + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContentArrayItem("requestSteps", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Title</Label>
                                        <Input className="mt-1" placeholder="Title" value={item?.title || ""} onChange={(e) => updateContentArrayItem("requestSteps", idx, "title", e.target.value)} />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Description</Label>
                                        <Textarea className="mt-1" placeholder="Description" value={item?.description || ""} onChange={(e) => updateContentArrayItem("requestSteps", idx, "description", e.target.value)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Contact Section</Label>
                                  <Input placeholder="Contact section title" value={((formData.content || {}) as Record<string, any>).contactTitle || ""} onChange={(e) => updateContentField("contactTitle", e.target.value)} />
                                  <Textarea placeholder="Contact section description" value={((formData.content || {}) as Record<string, any>).contactDescription || ""} onChange={(e) => updateContentField("contactDescription", e.target.value)} />
                                  <Input placeholder="Contact email" value={((formData.content || {}) as Record<string, any>).contactEmail || ""} onChange={(e) => updateContentField("contactEmail", e.target.value)} />
                                </div>
                              </div>
                            )}

                            {pageKind === "terms" && (
                              <div className="space-y-3">
                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Hero Section</Label>
                                  <Input placeholder="Hero title" value={((formData.content || {}) as Record<string, any>).title || ""} onChange={(e) => updateContentField("title", e.target.value)} />
                                  <Textarea placeholder="Hero description" value={((formData.content || {}) as Record<string, any>).description || ""} onChange={(e) => updateContentField("description", e.target.value)} />
                                  <Input placeholder="Last updated text" value={((formData.content || {}) as Record<string, any>).lastUpdated || ""} onChange={(e) => updateContentField("lastUpdated", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 1</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).acceptanceHeading || ""} onChange={(e) => updateContentField("acceptanceHeading", e.target.value)} />
                                  <Textarea placeholder="Acceptance of terms content" value={((formData.content || {}) as Record<string, any>).acceptanceOfTerms || ""} onChange={(e) => updateContentField("acceptanceOfTerms", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 2</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).useOfServiceHeading || ""} onChange={(e) => updateContentField("useOfServiceHeading", e.target.value)} />
                                  <Textarea placeholder="Use of service intro" value={((formData.content || {}) as Record<string, any>).useOfServiceIntro || ""} onChange={(e) => updateContentField("useOfServiceIntro", e.target.value)} />
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs">Use of Service Items</Label>
                                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addStringArrayItem("useOfServiceItems")}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                      </Button>
                                    </div>
                                    {((((formData.content || {}) as Record<string, any>).useOfServiceItems || []) as string[]).map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <Input value={item} onChange={(e) => updateStringArrayItem("useOfServiceItems", idx, e.target.value)} />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStringArrayItem("useOfServiceItems", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 3</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).accountResponsibilitiesHeading || ""} onChange={(e) => updateContentField("accountResponsibilitiesHeading", e.target.value)} />
                                  <Textarea placeholder="Account responsibilities intro" value={((formData.content || {}) as Record<string, any>).accountResponsibilitiesIntro || ""} onChange={(e) => updateContentField("accountResponsibilitiesIntro", e.target.value)} />
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs">Account Responsibilities Items</Label>
                                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addStringArrayItem("accountResponsibilitiesItems")}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                      </Button>
                                    </div>
                                    {((((formData.content || {}) as Record<string, any>).accountResponsibilitiesItems || []) as string[]).map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <Input value={item} onChange={(e) => updateStringArrayItem("accountResponsibilitiesItems", idx, e.target.value)} />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStringArrayItem("accountResponsibilitiesItems", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 4</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).subscriptionAndBillingHeading || ""} onChange={(e) => updateContentField("subscriptionAndBillingHeading", e.target.value)} />
                                  <Textarea placeholder="Subscription and billing" value={((formData.content || {}) as Record<string, any>).subscriptionAndBilling || ""} onChange={(e) => updateContentField("subscriptionAndBilling", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 5</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).intellectualPropertyHeading || ""} onChange={(e) => updateContentField("intellectualPropertyHeading", e.target.value)} />
                                  <Textarea placeholder="Intellectual property" value={((formData.content || {}) as Record<string, any>).intellectualProperty || ""} onChange={(e) => updateContentField("intellectualProperty", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 6</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).dataAndPrivacyHeading || ""} onChange={(e) => updateContentField("dataAndPrivacyHeading", e.target.value)} />
                                  <Textarea placeholder="Data and privacy" value={((formData.content || {}) as Record<string, any>).dataAndPrivacy || ""} onChange={(e) => updateContentField("dataAndPrivacy", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 7</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).serviceAvailabilityHeading || ""} onChange={(e) => updateContentField("serviceAvailabilityHeading", e.target.value)} />
                                  <Textarea placeholder="Service availability" value={((formData.content || {}) as Record<string, any>).serviceAvailability || ""} onChange={(e) => updateContentField("serviceAvailability", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 8</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).terminationHeading || ""} onChange={(e) => updateContentField("terminationHeading", e.target.value)} />
                                  <Textarea placeholder="Termination" value={((formData.content || {}) as Record<string, any>).termination || ""} onChange={(e) => updateContentField("termination", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 9</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).limitationOfLiabilityHeading || ""} onChange={(e) => updateContentField("limitationOfLiabilityHeading", e.target.value)} />
                                  <Textarea placeholder="Limitation of liability" value={((formData.content || {}) as Record<string, any>).limitationOfLiability || ""} onChange={(e) => updateContentField("limitationOfLiability", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 10</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).changesToTermsHeading || ""} onChange={(e) => updateContentField("changesToTermsHeading", e.target.value)} />
                                  <Textarea placeholder="Changes to terms" value={((formData.content || {}) as Record<string, any>).changesToTerms || ""} onChange={(e) => updateContentField("changesToTerms", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 11</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).governingLawHeading || ""} onChange={(e) => updateContentField("governingLawHeading", e.target.value)} />
                                  <Textarea placeholder="Governing law" value={((formData.content || {}) as Record<string, any>).governingLaw || ""} onChange={(e) => updateContentField("governingLaw", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-3">
                                  <Label className="text-xs font-semibold">Section 12</Label>
                                  <Input placeholder="Heading" value={((formData.content || {}) as Record<string, any>).contactHeading || ""} onChange={(e) => updateContentField("contactHeading", e.target.value)} />
                                  <Textarea placeholder="Contact intro" value={((formData.content || {}) as Record<string, any>).contactIntro || ""} onChange={(e) => updateContentField("contactIntro", e.target.value)} />
                                  <Input placeholder="Contact email" value={((formData.content || {}) as Record<string, any>).contactEmail || ""} onChange={(e) => updateContentField("contactEmail", e.target.value)} />
                                  <Input placeholder="Contact address" value={((formData.content || {}) as Record<string, any>).contactAddress || ""} onChange={(e) => updateContentField("contactAddress", e.target.value)} />
                                  <Input placeholder="Contact phone" value={((formData.content || {}) as Record<string, any>).contactPhone || ""} onChange={(e) => updateContentField("contactPhone", e.target.value)} />
                                </div>

                                <div className="rounded-lg border bg-background p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Additional Sections</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => addContentArrayItem("additionalSections", { title: "", content: "" })}
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add Section
                                    </Button>
                                  </div>
                                  {((((formData.content || {}) as Record<string, any>).additionalSections || []) as Array<{ title: string; content: string }>).map((item, idx) => (
                                    <div key={idx} className="rounded border p-3 bg-card/50 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Extra Section {idx + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContentArrayItem("additionalSections", idx)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Heading</Label>
                                        <Input className="mt-1" placeholder="Heading" value={item?.title || ""} onChange={(e) => updateContentArrayItem("additionalSections", idx, "title", e.target.value)} />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Content</Label>
                                        <Textarea className="mt-1" placeholder="Content" value={item?.content || ""} onChange={(e) => updateContentArrayItem("additionalSections", idx, "content", e.target.value)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Edit text/content only. Public page design is preserved.
                            </p>
                          </div>

                          {/* Footer Visibility */}
                          <div className="flex items-center gap-2 border-t pt-4">
                            <Switch
                              checked={formData.showInFooter}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, showInFooter: checked })
                              }
                            />
                            <Label className="text-xs">Show in Footer</Label>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={updatePageMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
        )}
      </div>

      {/* Initialize Defaults Dialog */}
      <AlertDialog open={showInitDialog} onOpenChange={setShowInitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize Default Support Pages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create default Contact, Privacy Policy, and Refund Policy pages with pre-filled content.
              You can customize them after initialization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInitializeDefaults}
              disabled={initializeMutation.isPending}
            >
              Initialize Pages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
