import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight,
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
  Image,
  Type,
  Link,
  ToggleLeft,
  ExternalLink,
  Upload,
  Download,
  FileImage,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Section configuration types
interface SocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
  icon: React.ElementType;
}

interface SupportPage {
  id: string;
  title: string;
  slug: string;
  enabled: boolean;
  icon: React.ElementType;
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
  icon: React.ElementType;
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
  icon: React.ElementType;
  order: number;
}

// Initial data
const initialSocialLinks: SocialLink[] = [
  { id: "facebook", platform: "Facebook", url: "https://facebook.com/vaypr", enabled: true, icon: Facebook },
  { id: "instagram", platform: "Instagram", url: "https://instagram.com/vaypr", enabled: true, icon: Instagram },
  { id: "tiktok", platform: "TikTok", url: "https://tiktok.com/@vaypr", enabled: true, icon: Globe },
  { id: "twitter", platform: "X (Twitter)", url: "https://x.com/vaypr", enabled: true, icon: Twitter },
  { id: "linkedin", platform: "LinkedIn", url: "https://linkedin.com/company/vaypr", enabled: false, icon: Linkedin },
];

const initialSupportPages: SupportPage[] = [
  { id: "contact", title: "Contact Us", slug: "/contact", enabled: true, icon: Mail },
  { id: "privacy", title: "Privacy Policy", slug: "/privacy", enabled: true, icon: Shield },
  { id: "refund", title: "Refund Policy", slug: "/refund", enabled: true, icon: RefreshCcw },
];

const initialFAQs: FAQItem[] = [
  { id: "1", question: "How do I create my first invoice?", answer: "Navigate to the Invoices section and click 'Create New Invoice'. Fill in the client details, add line items, and click 'Send' to deliver it to your client.", category: "Getting Started", published: true, order: 1 },
  { id: "2", question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, MasterCard, American Express), KNET for local Kuwait payments, and bank transfers for enterprise accounts.", category: "Billing", published: true, order: 2 },
  { id: "3", question: "How can I upgrade my subscription plan?", answer: "Go to Settings > Subscription and click 'Upgrade Plan'. Choose your new plan and complete the payment. The upgrade takes effect immediately.", category: "Billing", published: true, order: 3 },
  { id: "4", question: "Can I customize my invoice templates?", answer: "Yes! Professional and Enterprise plans include custom branding. Go to Settings > Branding to upload your logo, choose colors, and customize your invoice layout.", category: "Features", published: true, order: 4 },
  { id: "5", question: "How do I add team members?", answer: "Navigate to Settings > Team Members and click 'Invite Member'. Enter their email address and assign a role. They'll receive an invitation to join your workspace.", category: "Getting Started", published: false, order: 5 },
];

const initialCorporatePages: CorporatePage[] = [
  { id: "guides", title: "Guides", slug: "/guides", enabled: true, icon: BookOpen, description: "Step-by-step tutorials and documentation" },
  { id: "about", title: "About Us", slug: "/about", enabled: true, icon: Building2, description: "Learn about our mission and team" },
  { id: "b2b", title: "B2B Services", slug: "/b2b", enabled: true, icon: Briefcase, description: "Enterprise solutions for businesses" },
];

const initialGuides: Guide[] = [
  { id: "1", title: "Getting Started Guide", description: "A comprehensive introduction to VAYPR platform and its core features.", fileType: "pdf", fileName: "getting-started.pdf", fileUrl: "#", published: true, createdAt: "2025-01-10", downloads: 245 },
  { id: "2", title: "Invoice Creation Tutorial", description: "Learn how to create professional invoices step by step.", fileType: "image", fileName: "invoice-tutorial.png", fileUrl: "#", published: true, createdAt: "2025-01-08", downloads: 182 },
  { id: "3", title: "B2B Integration Guide", description: "Technical documentation for enterprise API integrations.", fileType: "pdf", fileName: "b2b-integration.pdf", fileUrl: "#", published: false, createdAt: "2025-01-05", downloads: 67 },
];

const initialLandingSections: LandingSection[] = [
  { id: "hero", title: "Hero Section", enabled: true, icon: Sparkles, order: 1 },
  { id: "features", title: "Features", enabled: true, icon: Zap, order: 2 },
  { id: "how-it-works", title: "How It Works", enabled: true, icon: ListOrdered, order: 3 },
  { id: "plans", title: "Subscription Plans", enabled: true, icon: CreditCard, order: 4 },
  { id: "footer", title: "Footer", enabled: true, icon: FileText, order: 5 },
];

// Collapsible Section Component
function EditorSection({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  badge
}: { 
  title: string; 
  description: string;
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="card-admin overflow-hidden">
      <button
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
              {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Social Media Editor
function SocialMediaEditor() {
  const [links, setLinks] = useState(initialSocialLinks);

  const updateLink = (id: string, field: keyof SocialLink, value: string | boolean) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <link.icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{link.platform}</Label>
              <Input
                value={link.url}
                onChange={(e) => updateLink(link.id, "url", e.target.value)}
                placeholder={`Enter ${link.platform} URL`}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={link.enabled}
                onCheckedChange={(checked) => updateLink(link.id, "enabled", checked)}
              />
              <span className="text-xs text-muted-foreground w-16">
                {link.enabled ? "Visible" : "Hidden"}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      
      <Button variant="outline" className="w-full mt-4">
        <Plus className="w-4 h-4 mr-2" />
        Add Social Link
      </Button>
    </div>
  );
}

// Support Pages Editor with FAQ Management
function SupportPagesEditor() {
  const [pages, setPages] = useState(initialSupportPages);
  const [faqs, setFaqs] = useState(initialFAQs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "General" });
  const [faqSearch, setFaqSearch] = useState("");

  const updatePage = (id: string, field: keyof SupportPage, value: string | boolean) => {
    setPages(pages.map(page => 
      page.id === id ? { ...page, [field]: value } : page
    ));
  };

  const updateFaq = (id: string, field: keyof FAQItem, value: string | boolean | number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return;
    const newItem: FAQItem = {
      id: crypto.randomUUID(),
      question: newFaq.question,
      answer: newFaq.answer,
      category: newFaq.category,
      published: true,
      order: faqs.length + 1,
    };
    setFaqs([...faqs, newItem]);
    setNewFaq({ question: "", answer: "", category: "General" });
    setShowAddFaq(false);
    toast({
      title: "FAQ Added",
      description: "The new FAQ has been added successfully.",
    });
  };

  const deleteFaq = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
    toast({
      title: "FAQ Deleted",
      description: "The FAQ has been removed.",
    });
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const categories = ["General", "Getting Started", "Billing", "Features", "Technical", "Account"];

  return (
    <Tabs defaultValue="pages" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pages">Support Pages</TabsTrigger>
        <TabsTrigger value="faqs">FAQs Management</TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <page.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{page.title}</h4>
                  <Badge variant="outline" className="text-xs font-mono">{page.slug}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={page.enabled}
                  onCheckedChange={(checked) => updatePage(page.id, "enabled", checked)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditingId(editingId === page.id ? null : page.id)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <Label className="text-xs">Page Content</Label>
                      <Textarea
                        placeholder="Enter page content or description..."
                        className="mt-1 min-h-[100px]"
                        value={page.content || ""}
                        onChange={(e) => updatePage(page.id, "content", e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => setEditingId(null)}>
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

      <TabsContent value="faqs" className="space-y-4">
        {/* FAQ Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search FAQs..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10"
            />
            <HelpCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button onClick={() => setShowAddFaq(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add FAQ
          </Button>
        </div>

        {/* Add FAQ Form */}
        <AnimatePresence>
          {showAddFaq && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border bg-card p-4 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Add New FAQ</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label className="text-xs">Question</Label>
                  <Input
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Enter the question..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Answer</Label>
                <Textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddFaq(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={addFaq}>
                  Add FAQ
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No FAQs found</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">{faq.order}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{faq.question}</h4>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{faq.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={faq.published}
                        onCheckedChange={(checked) => updateFaq(faq.id, "published", checked)}
                      />
                      <span className="text-xs text-muted-foreground w-16">
                        {faq.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingFaqId(editingFaqId === faq.id ? null : faq.id)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFaq(faq.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {editingFaqId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 bg-muted/30 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-3">
                            <Label className="text-xs">Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Category</Label>
                            <select
                              value={faq.category}
                              onChange={(e) => updateFaq(faq.id, "category", e.target.value)}
                              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Answer</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                            className="mt-1 min-h-[100px]"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingFaqId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => {
                            setEditingFaqId(null);
                            toast({ title: "FAQ Updated", description: "Changes have been saved." });
                          }}>
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

// Corporate Pages Editor
function CorporatePagesEditor() {
  const [pages, setPages] = useState(initialCorporatePages);
  const [guides, setGuides] = useState(initialGuides);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [newGuide, setNewGuide] = useState({ 
    title: "", 
    description: "", 
    fileType: "pdf" as "image" | "pdf",
    fileName: "",
    fileUrl: ""
  });

  const updatePage = (id: string, field: keyof CorporatePage, value: string | boolean) => {
    setPages(pages.map(page => 
      page.id === id ? { ...page, [field]: value } : page
    ));
  };

  const updateGuide = (id: string, field: keyof Guide, value: string | boolean | number) => {
    setGuides(guides.map(guide => 
      guide.id === id ? { ...guide, [field]: value } : guide
    ));
  };

  const addGuide = () => {
    if (!newGuide.title || !newGuide.description || !newGuide.fileName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields and upload a file.",
        variant: "destructive"
      });
      return;
    }
    const guide: Guide = {
      id: crypto.randomUUID(),
      title: newGuide.title,
      description: newGuide.description,
      fileType: newGuide.fileType,
      fileName: newGuide.fileName,
      fileUrl: newGuide.fileUrl || "#",
      published: true,
      createdAt: new Date().toISOString().split('T')[0],
      downloads: 0
    };
    setGuides([...guides, guide]);
    setNewGuide({ title: "", description: "", fileType: "pdf", fileName: "", fileUrl: "" });
    setShowAddGuide(false);
    toast({
      title: "Guide Added",
      description: "The new guide has been added successfully.",
    });
  };

  const deleteGuide = (id: string) => {
    setGuides(guides.filter(guide => guide.id !== id));
    toast({
      title: "Guide Deleted",
      description: "The guide has been removed.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean, guideId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image or PDF file.",
        variant: "destructive"
      });
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const fileType: "image" | "pdf" = isImage ? "image" : "pdf";

    if (isNew) {
      setNewGuide(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: fileType
      }));
    } else if (guideId) {
      updateGuide(guideId, "fileName", file.name);
      updateGuide(guideId, "fileUrl", fileUrl);
      updateGuide(guideId, "fileType", fileType);
    }

    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  return (
    <Tabs defaultValue="pages" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pages">Corporate Pages</TabsTrigger>
        <TabsTrigger value="guides">Guides Management</TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <page.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{page.title}</h4>
                  <Badge variant="outline" className="text-xs font-mono">{page.slug}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{page.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={page.enabled}
                  onCheckedChange={(checked) => updatePage(page.id, "enabled", checked)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditingId(editingId === page.id ? null : page.id)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Corporate Page
        </Button>
      </TabsContent>

      <TabsContent value="guides" className="space-y-4">
        {/* Guides Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{guides.length} guides available</span>
          </div>
          <Button onClick={() => setShowAddGuide(true)} className="gap-2">
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
              className="rounded-lg border bg-card p-4 space-y-4"
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
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddGuide(false);
                  setNewGuide({ title: "", description: "", fileType: "pdf", fileName: "", fileUrl: "" });
                }}>
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
                      <span>{guide.fileName}</span>
                      <span>•</span>
                      <span>{guide.downloads} downloads</span>
                      <span>•</span>
                      <span>{guide.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={guide.published}
                      onCheckedChange={(checked) => updateGuide(guide.id, "published", checked)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingGuideId(editingGuideId === guide.id ? null : guide.id)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
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
                                  <span className="text-muted-foreground truncate">
                                    {guide.fileName}
                                  </span>
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
                          <Button size="sm" onClick={() => {
                            setEditingGuideId(null);
                            toast({ title: "Guide Updated", description: "Changes have been saved." });
                          }}>
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

// Landing Page Editor
function LandingPageEditor() {
  const [sections, setSections] = useState(initialLandingSections);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  return (
    <Tabs defaultValue="sections" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sections" className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Drag to reorder sections. Toggle visibility on/off for each section.
        </p>
        {sections.sort((a, b) => a.order - b.order).map((section, index) => (
          <motion.div
            key={section.id}
            layout
            className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-move"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <section.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{section.title}</h4>
              <span className="text-xs text-muted-foreground">Section {section.order}</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={section.enabled}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </TabsContent>
      
      <TabsContent value="hero" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero Section</CardTitle>
            <CardDescription>Customize the main banner of your landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input 
                defaultValue="Streamline Your Business with VAYPR" 
                className="mt-1"
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Textarea 
                defaultValue="The all-in-one billing and financial SaaS solution that helps you manage invoices, subscriptions, and payments effortlessly." 
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary CTA Text</Label>
                <Input defaultValue="Start Free Trial" className="mt-1" />
              </div>
              <div>
                <Label>Secondary CTA Text</Label>
                <Input defaultValue="Watch Demo" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Background Image</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
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
              <Label>Section Title</Label>
              <Input defaultValue="Powerful Features for Your Business" className="mt-1" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label>Feature Items</Label>
              {[
                { title: "Automated Invoicing", desc: "Generate and send professional invoices automatically" },
                { title: "Subscription Management", desc: "Handle recurring billing with ease" },
                { title: "Financial Reports", desc: "Get insights with detailed analytics" },
                { title: "Multi-Currency Support", desc: "Accept payments in any currency" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input defaultValue={feature.title} placeholder="Feature title" />
                    <Input defaultValue={feature.desc} placeholder="Feature description" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
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
              <Label>Section Title</Label>
              <Input defaultValue="Get Started in 3 Simple Steps" className="mt-1" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label>Steps</Label>
              {[
                { step: 1, title: "Sign Up", desc: "Create your free account in seconds" },
                { step: 2, title: "Configure", desc: "Set up your billing preferences" },
                { step: 3, title: "Go Live", desc: "Start accepting payments immediately" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input defaultValue={step.title} placeholder="Step title" />
                    <Input defaultValue={step.desc} placeholder="Step description" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="plans" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Plans Section</CardTitle>
            <CardDescription>Configure how pricing is displayed on the landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input defaultValue="Choose Your Plan" className="mt-1" />
            </div>
            <div>
              <Label>Section Subtitle</Label>
              <Input defaultValue="Simple, transparent pricing that grows with you" className="mt-1" />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Show Monthly/Yearly Toggle</h4>
                <p className="text-sm text-muted-foreground">Allow users to switch between billing periods</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <h4 className="font-medium">Highlight Popular Plan</h4>
                <p className="text-sm text-muted-foreground">Add a badge to the recommended plan</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="p-4 rounded-lg border bg-primary/5">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Plans are managed in the <a href="/super-admin/plans" className="text-primary hover:underline">Plans & Billing</a> section.
              </p>
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
              <Label>Company Description</Label>
              <Textarea 
                defaultValue="VAYPR is a leading billing and financial management platform helping businesses streamline their operations since 2020." 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Copyright Text</Label>
              <Input defaultValue="© 2026 VAYPR. All rights reserved." className="mt-1" />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <h4 className="font-medium text-sm">Show Social Links</h4>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <h4 className="font-medium text-sm">Show Newsletter</h4>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div>
              <Label>Newsletter Title</Label>
              <Input defaultValue="Subscribe to our newsletter" className="mt-1" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

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
            Customize VAYPR's website landing page and content sections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
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
          badge="5 links"
          defaultOpen
        >
          <SocialMediaEditor />
        </EditorSection>

        <EditorSection
          title="Support Pages"
          description="Configure support and policy pages"
          icon={HelpCircle}
          badge="4 pages"
        >
          <SupportPagesEditor />
        </EditorSection>

        <EditorSection
          title="Corporate Pages"
          description="Manage corporate and business information pages"
          icon={Building2}
          badge="3 pages"
        >
          <CorporatePagesEditor />
        </EditorSection>

        <EditorSection
          title="Landing Page"
          description="Customize hero, features, and other landing page sections"
          icon={Sparkles}
          badge="5 sections"
        >
          <LandingPageEditor />
        </EditorSection>
      </div>
    </div>
  );
}
