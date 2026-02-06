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
import { useLandingPage, useUpdateLandingSection } from "@/hooks/useLandingPage";

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

interface CorporatePage {
  id: string;
  title: string;
  slug: string;
  enabled: boolean;
  icon: ElementType;
  description?: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  fileType: "image" | "pdf";
  fileName: string;
  fileUrl: string;
  published: boolean;
  createdAt: string;
  downloads: number;
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

const initialCorporatePages: CorporatePage[] = [
  {
    id: "guides",
    title: "Guides",
    slug: "/guides",
    enabled: true,
    icon: BookOpen,
    description: "Step-by-step tutorials and documentation",
  },
  {
    id: "about",
    title: "About Us",
    slug: "/about",
    enabled: true,
    icon: Building2,
    description: "Learn about our mission and team",
  },
  {
    id: "b2b",
    title: "B2B Services",
    slug: "/b2b",
    enabled: true,
    icon: Briefcase,
    description: "Enterprise solutions for businesses",
  },
];

const initialGuides: Guide[] = [
  {
    id: "1",
    title: "Getting Started Guide",
    description: "A comprehensive introduction to VAYPR platform and its core features.",
    fileType: "pdf",
    fileName: "getting-started.pdf",
    fileUrl: "#",
    published: true,
    createdAt: "2025-01-10",
    downloads: 245,
  },
  {
    id: "2",
    title: "Invoice Creation Tutorial",
    description: "Learn how to create professional invoices step by step.",
    fileType: "image",
    fileName: "invoice-tutorial.png",
    fileUrl: "#",
    published: true,
    createdAt: "2025-01-08",
    downloads: 182,
  },
  {
    id: "3",
    title: "B2B Integration Guide",
    description: "Technical documentation for enterprise API integrations.",
    fileType: "pdf",
    fileName: "b2b-integration.pdf",
    fileUrl: "#",
    published: false,
    createdAt: "2025-01-05",
    downloads: 67,
  },
];

const initialLandingSections: LandingSection[] = [
  { id: "hero", title: "Hero Section", enabled: true, icon: Sparkles, order: 1 },
  { id: "features", title: "Features", enabled: true, icon: Zap, order: 2 },
  { id: "how-it-works", title: "How It Works", enabled: true, icon: ListOrdered, order: 3 },
  { id: "plans", title: "Subscription Plans", enabled: true, icon: CreditCard, order: 4 },
  { id: "footer", title: "Footer", enabled: true, icon: FileText, order: 5 },
];

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
  const [pages, setPages] = useState<CorporatePage[]>(initialCorporatePages);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [showAddGuide, setShowAddGuide] = useState(false);

  const [newGuide, setNewGuide] = useState<Pick<Guide, "title" | "description" | "fileType" | "fileName" | "fileUrl">>({
    title: "",
    description: "",
    fileType: "pdf",
    fileName: "",
    fileUrl: "",
  });

  const updatePage = (id: string, key: keyof CorporatePage, value: any) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  };

  const addCorporatePage = () => {
    const id = `page_${Date.now()}`;
    setPages((prev) => [
      ...prev,
      {
        id,
        title: "New Page",
        slug: "/new-page",
        enabled: true,
        icon: FileText,
        description: "Short description...",
      },
    ]);
    toast({ title: "Page Added", description: "A new corporate page has been created." });
  };

  const updateGuide = (id: string, key: keyof Guide, value: any) => {
    setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, [key]: value } : g)));
  };

  const deleteGuide = (id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
    toast({ title: "Guide Deleted", description: "The guide has been removed." });
  };

  const inferFileType = (file: File): "pdf" | "image" => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
    return "image";
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, isNew: boolean, guideId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = inferFileType(file);
    const fileUrl = URL.createObjectURL(file);

    if (isNew) {
      setNewGuide((prev) => ({
        ...prev,
        fileType: type,
        fileName: file.name,
        fileUrl,
      }));
    } else if (guideId) {
      updateGuide(guideId, "fileType", type === "pdf" ? "pdf" : "image");
      updateGuide(guideId, "fileName", file.name);
      updateGuide(guideId, "fileUrl", fileUrl);
      toast({ title: "File Replaced", description: "Guide file has been updated (local preview URL)." });
    }

    // allow re-upload same file
    e.target.value = "";
  };

  const addGuide = () => {
    if (!newGuide.title.trim() || !newGuide.description.trim() || !newGuide.fileName) {
      toast({
        title: "Missing fields",
        description: "Please add title, description, and upload a file.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const createdAt = `${yyyy}-${mm}-${dd}`;

    const guide: Guide = {
      id: `g_${Date.now()}`,
      title: newGuide.title.trim(),
      description: newGuide.description.trim(),
      fileType: newGuide.fileType === "pdf" ? "pdf" : "image",
      fileName: newGuide.fileName,
      fileUrl: newGuide.fileUrl || "#",
      published: false,
      createdAt,
      downloads: 0,
    };

    setGuides((prev) => [guide, ...prev]);
    setShowAddGuide(false);
    setNewGuide({ title: "", description: "", fileType: "pdf", fileName: "", fileUrl: "" });

    toast({ title: "Guide Added", description: "New guide added as Draft." });
  };

  const pagesCount = useMemo(() => pages.length, [pages]);
  const guidesCount = useMemo(() => guides.length, [guides]);

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
          <Button variant="outline" size="sm" onClick={addCorporatePage} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Page
          </Button>
        </div>

        {pages.map((page) => (
          <div key={page.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <page.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{page.title}</h4>
                  <Badge variant="outline" className="text-xs font-mono">
                    {page.slug}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{page.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={page.enabled} onCheckedChange={(checked) => updatePage(page.id, "enabled", checked)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingId(editingId === page.id ? null : page.id)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    toast({
                      title: "Preview",
                      description: `Open ${page.slug} in a new tab (wire to router later).`,
                    })
                  }
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {editingId === page.id && (
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
                          value={page.title}
                          onChange={(e) => updatePage(page.id, "title", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">URL Slug</Label>
                        <Input
                          value={page.slug}
                          onChange={(e) => updatePage(page.id, "slug", e.target.value)}
                          className="mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        placeholder="Enter page description..."
                        className="mt-1"
                        value={page.description || ""}
                        onChange={(e) => updatePage(page.id, "description", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          toast({ title: "Saved", description: "Corporate page updated (local state)." });
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </TabsContent>

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
                  <Label className="text-xs">Upload File (Image/PDF) *</Label>
                  <div className="mt-1 flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {newGuide.fileName || "Choose file..."}
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
                    setNewGuide({ title: "", description: "", fileType: "pdf", fileName: "", fileUrl: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={addGuide}>
                  Add Guide
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guides List */}
        <div className="space-y-3">
          {guides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No guides yet. Add your first guide above.</p>
            </div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="rounded-lg border bg-card overflow-hidden">
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
                    <Switch checked={guide.published} onCheckedChange={(checked) => updateGuide(guide.id, "published", checked)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingGuideId(editingGuideId === guide.id ? null : guide.id)}
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
                      onClick={() => deleteGuide(guide.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit Guide Form */}
                <AnimatePresence>
                  {editingGuideId === guide.id && (
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
                              value={guide.title}
                              onChange={(e) => updateGuide(guide.id, "title", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Replace File (Image/PDF)</Label>
                            <div className="mt-1 flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, false, guide.id)}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm">
                                  <Upload className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground truncate">{guide.fileName}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 px-2 rounded-md bg-primary/10">
                                {guide.fileType === "pdf" ? (
                                  <File className="w-4 h-4 text-primary" />
                                ) : (
                                  <FileImage className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-xs text-primary uppercase">{guide.fileType}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={guide.description}
                            onChange={(e) => updateGuide(guide.id, "description", e.target.value)}
                            className="mt-1 min-h-[100px]"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingGuideId(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingGuideId(null);
                              toast({ title: "Guide Updated", description: "Changes have been saved (local state)." });
                            }}
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
  const updateSection = useUpdateLandingSection();

  const [heroForm, setHeroForm] = useState({
    badge: "",
    headline: "",
    subheadline: "",
    primaryButtonText: "",
    secondaryButtonText: "",
  });

  const [footerForm, setFooterForm] = useState({
    companyName: "",
    description: "",
    copyright: "",
    showSocialLinks: true,
  });

  // Initialize forms when data loads
  useEffect(() => {
    if (landingPage) {
      setHeroForm({
        badge: landingPage.heroSection.badge,
        headline: landingPage.heroSection.headline,
        subheadline: landingPage.heroSection.subheadline,
        primaryButtonText: landingPage.heroSection.primaryButtonText,
        secondaryButtonText: landingPage.heroSection.secondaryButtonText,
      });
      setFooterForm({
        companyName: landingPage.footerSection.companyName,
        description: landingPage.footerSection.description,
        copyright: landingPage.footerSection.copyright,
        showSocialLinks: landingPage.footerSection.showSocialLinks,
      });
    }
  }, [landingPage]);

  const handleUpdateHero = () => {
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
              <Input defaultValue={landingPage.featuresSection.badge} className="mt-1" />
            </div>

            <div>
              <Label>Headline</Label>
              <Input defaultValue={landingPage.featuresSection.headline} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea defaultValue={landingPage.featuresSection.description} className="mt-1" />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Feature Items ({landingPage.featuresSection.features.length})</Label>
              <p className="text-xs text-muted-foreground">
                Feature management coming soon. Currently displaying {landingPage.featuresSection.features.length} features.
              </p>
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
            <div className="space-y-3">
              <Label>Statistics ({landingPage.statsSection.stats.length})</Label>
              <p className="text-xs text-muted-foreground">
                Stats management coming soon. Currently displaying {landingPage.statsSection.stats.length} stats.
              </p>
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
              <Input defaultValue={landingPage.howItWorksSection.badge} className="mt-1" />
            </div>

            <div>
              <Label>Headline</Label>
              <Input defaultValue={landingPage.howItWorksSection.headline} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea defaultValue={landingPage.howItWorksSection.description} className="mt-1" />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Steps ({landingPage.howItWorksSection.steps.length})</Label>
              <p className="text-xs text-muted-foreground">
                Step management coming soon. Currently displaying {landingPage.howItWorksSection.steps.length} steps.
              </p>
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
              <Input defaultValue={landingPage.testimonialsSection.badge} className="mt-1" />
            </div>

            <div>
              <Label>Headline</Label>
              <Input defaultValue={landingPage.testimonialsSection.headline} className="mt-1" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable Testimonials Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide testimonials on landing page</p>
              </div>
              <Switch checked={landingPage.testimonialsSection.enabled} />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Testimonials ({landingPage.testimonialsSection.testimonials.length})</Label>
              <p className="text-xs text-muted-foreground">
                Testimonial management coming soon. Currently displaying {landingPage.testimonialsSection.testimonials.length} testimonials.
              </p>
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
              <Input defaultValue={landingPage.pricingSection.headline} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Input defaultValue={landingPage.pricingSection.description} className="mt-1" />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable Pricing Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide pricing on landing page</p>
              </div>
              <Switch checked={landingPage.pricingSection.enabled} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Show Monthly/Yearly Toggle</h4>
                <p className="text-sm text-muted-foreground">Allow users to switch between billing periods</p>
              </div>
              <Switch checked={landingPage.pricingSection.showYearlyToggle} />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Plans ({landingPage.pricingSection.plans.length})</Label>
              <p className="text-xs text-muted-foreground">
                Plan management coming soon. Currently displaying {landingPage.pricingSection.plans.length} plans.
              </p>
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
              <Input defaultValue={landingPage.ctaSection.headline} className="mt-1" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea defaultValue={landingPage.ctaSection.description} className="mt-1" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Button Text</Label>
                <Input defaultValue={landingPage.ctaSection.primaryButtonText} className="mt-1" />
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <Input defaultValue={landingPage.ctaSection.secondaryButtonText} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Disclaimer</Label>
              <Input defaultValue={landingPage.ctaSection.disclaimer} className="mt-1" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Enable CTA Section</h4>
                <p className="text-sm text-muted-foreground">Show/hide CTA on landing page</p>
              </div>
              <Switch checked={landingPage.ctaSection.enabled} />
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
                Social: {landingPage.footerSection.socialMediaLinks.length} links | 
                Support: {landingPage.footerSection.supportLinks.length} links | 
                Corporate: {landingPage.footerSection.corporateLinks.length} links
              </p>
              <p className="text-xs text-muted-foreground">
                Footer link management coming soon.
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
  const handleSave = () => {
    toast({
      title: "Changes saved",
      description: "Your page configuration has been updated successfully.",
    });
  };

  const handlePreview = () => {
    toast({
      title: "Opening preview",
      description: "Preview mode will open in a new tab.",
    });
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
            onClick={() =>
              toast({
                title: "Reset",
                description: "Wire this to reset state from server or initial config.",
              })
            }
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
          badge={`${initialSupportPages.length + 1} pages`}
        >
          <SupportPagesEditor />
        </EditorSection>

        <EditorSection
          title="Corporate Pages"
          description="Manage corporate and business information pages"
          icon={Building2}
          badge={`${initialCorporatePages.length} pages`}
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
    </div>
  );
}
