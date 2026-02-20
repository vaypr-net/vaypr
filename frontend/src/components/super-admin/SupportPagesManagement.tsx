import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, RefreshCcw, Edit3, Eye, Plus, Save, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  ABOUT: Mail,
  B2B: Mail,
  CUSTOM: Mail,
};

export function SupportPagesManagement() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showInitDialog, setShowInitDialog] = useState(false);

  // React Query hooks
  const { data: pages = [], isLoading } = useSupportPages();
  const updatePageMutation = useUpdateSupportPage();
  const toggleEnabledMutation = useToggleSupportPageEnabled();
  const initializeMutation = useInitializeSupportPages();

  // Form state for editing
  const [formData, setFormData] = useState<Partial<SupportPage>>({});

  const handleEdit = (page: SupportPage) => {
    setEditingId(page._id);
    setFormData({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription,
      sections: page.sections,
      contactFormSettings: page.contactFormSettings,
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
      data: formData,
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

  const toggleSectionExpand = (pageId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
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
            Manage Contact, Privacy Policy, and Refund Policy pages
          </p>
        </div>
        {pages.length === 0 && (
          <Button onClick={() => setShowInitDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Initialize Default Pages
          </Button>
        )}
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

                          {/* Sections */}
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
