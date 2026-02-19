import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Briefcase, Edit3, Eye, Plus, Save, X, Trash2, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useCorporatePages,
  useUpdateCorporatePage,
  useToggleCorporatePageEnabled,
  useToggleCorporatePageFooter,
  useInitializeCorporatePages,
} from "@/hooks/useCorporatePages";
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
  CorporatePageType,
  type CorporatePage,
  type ContentSection,
  type TeamMember,
  type ServiceFeature,
} from "@/api/services/corporate-pages.service";

const PAGE_ICONS = {
  ABOUT: Building2,
  B2B: Briefcase,
  GUIDES: Building2,
  CUSTOM: Building2,
};

export function CorporatePagesManagement() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInitDialog, setShowInitDialog] = useState(false);

  // React Query hooks
  const { data: pages = [], isLoading } = useCorporatePages();
  const updatePageMutation = useUpdateCorporatePage();
  const toggleEnabledMutation = useToggleCorporatePageEnabled();
  const toggleFooterMutation = useToggleCorporatePageFooter();
  const initializeMutation = useInitializeCorporatePages();

  // Form state for editing
  const [formData, setFormData] = useState<Partial<CorporatePage>>({});

  const handleEdit = (page: CorporatePage) => {
    setEditingId(page._id);
    setFormData({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription,
      heroTitle: page.heroTitle,
      heroSubtitle: page.heroSubtitle,
      heroImageUrl: page.heroImageUrl,
      sections: page.sections || [],
      teamMembers: page.teamMembers || [],
      features: page.features || [],
      ctaSection: page.ctaSection,
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

  const handleToggleFooter = async (id: string) => {
    try {
      await toggleFooterMutation.mutateAsync(id);
    } catch (e) {
      // handled by hook toasts
    }
  };

  const handleInitializeDefaults = async () => {
    await initializeMutation.mutateAsync();
    setShowInitDialog(false);
  };

  // Section management
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

  // Team member management
  const updateTeamMember = (memberIndex: number, field: keyof TeamMember, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers?.map((member, index) =>
        index === memberIndex ? { ...member, [field]: value } : member
      ),
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [
        ...(prev.teamMembers || []),
        { name: '', position: '', bio: '', imageUrl: '', order: (prev.teamMembers?.length || 0) + 1 },
      ],
    }));
  };

  const removeTeamMember = (memberIndex: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers?.filter((_, index) => index !== memberIndex),
    }));
  };

  // Feature management
  const updateFeature = (featureIndex: number, field: keyof ServiceFeature, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.map((feature, index) =>
        index === featureIndex ? { ...feature, [field]: value } : feature
      ),
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [
        ...(prev.features || []),
        { title: '', description: '', icon: '', order: (prev.features?.length || 0) + 1 },
      ],
    }));
  };

  const removeFeature = (featureIndex: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, index) => index !== featureIndex),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading corporate pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Corporate Pages</h3>
          <p className="text-sm text-muted-foreground">
            Manage About Us and B2B Services pages
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
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No corporate pages found</p>
            <p className="text-sm mb-4">Initialize default pages to get started</p>
            <Button onClick={() => setShowInitDialog(true)}>
              Initialize Default Pages
            </Button>
          </div>
        ) : (
          pages
            .filter(page => page.type !== CorporatePageType.GUIDES)
            .sort((a, b) => a.order - b.order)
            .map((page) => {
              const IconComponent = PAGE_ICONS[page.type as keyof typeof PAGE_ICONS] || Building2;
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
                      {page.heroTitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {page.heroTitle}
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
                        onClick={() => handleToggleFooter(page._id)}
                        disabled={toggleFooterMutation.isPending}
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

                          {/* Hero Section */}
                          <div className="space-y-3 border-t pt-4">
                            <Label className="text-sm font-semibold">Hero Section</Label>
                            <div>
                              <Label className="text-xs">Hero Title</Label>
                              <Input
                                value={formData.heroTitle || ''}
                                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                                className="mt-1"
                                placeholder="Main heading..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Hero Subtitle</Label>
                              <Textarea
                                value={formData.heroSubtitle || ''}
                                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                                className="mt-1 min-h-[60px]"
                                placeholder="Subtitle or description..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Hero Image URL</Label>
                              <Input
                                value={formData.heroImageUrl || ''}
                                onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                                className="mt-1"
                                placeholder="https://..."
                              />
                            </div>
                          </div>

                          {/* Content Sections */}
                          <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">Content Sections ({formData.sections?.length || 0})</Label>
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
                                <Input
                                  value={section.title}
                                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                                  placeholder="Section title..."
                                  className="text-sm"
                                />
                                <Textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(index, 'content', e.target.value)}
                                  placeholder="Section content..."
                                  className="text-sm min-h-[80px]"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Team Members (About page only) */}
                          {page.type === CorporatePageType.ABOUT && (
                            <div className="space-y-2 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Team Members ({formData.teamMembers?.length || 0})</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addTeamMember}
                                  className="h-7 text-xs"
                                >
                                  <User className="w-3 h-3 mr-1" />
                                  Add Team Member
                                </Button>
                              </div>

                              {formData.teamMembers?.map((member, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-background space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Team Member {index + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => removeTeamMember(index)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      value={member.name}
                                      onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                      placeholder="Name..."
                                      className="text-sm"
                                    />
                                    <Input
                                      value={member.position}
                                      onChange={(e) => updateTeamMember(index, 'position', e.target.value)}
                                      placeholder="Position..."
                                      className="text-sm"
                                    />
                                  </div>
                                  <Textarea
                                    value={member.bio}
                                    onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                                    placeholder="Bio..."
                                    className="text-sm min-h-[60px]"
                                  />
                                  <Input
                                    value={member.imageUrl || ''}
                                    onChange={(e) => updateTeamMember(index, 'imageUrl', e.target.value)}
                                    placeholder="Image URL..."
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Service Features (B2B page only) */}
                          {page.type === CorporatePageType.B2B && (
                            <div className="space-y-2 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Service Features ({formData.features?.length || 0})</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addFeature}
                                  className="h-7 text-xs"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  Add Feature
                                </Button>
                              </div>

                              {formData.features?.map((feature, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-background space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Feature {index + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => removeFeature(index)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={feature.title}
                                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                                    placeholder="Feature title..."
                                    className="text-sm"
                                  />
                                  <Textarea
                                    value={feature.description}
                                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                                    placeholder="Feature description..."
                                    className="text-sm min-h-[60px]"
                                  />
                                  <Input
                                    value={feature.icon || ''}
                                    onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                                    placeholder="Icon name..."
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* CTA Section */}
                          {formData.ctaSection && (
                            <div className="space-y-3 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Call-to-Action Section</Label>
                                <Switch
                                  checked={formData.ctaSection.enabled}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      ctaSection: { ...formData.ctaSection!, enabled: checked },
                                    })
                                  }
                                />
                              </div>
                              <Input
                                value={formData.ctaSection.title}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ctaSection: { ...formData.ctaSection!, title: e.target.value },
                                  })
                                }
                                placeholder="CTA title..."
                                className="text-sm"
                              />
                              <Textarea
                                value={formData.ctaSection.description}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ctaSection: { ...formData.ctaSection!, description: e.target.value },
                                  })
                                }
                                placeholder="CTA description..."
                                className="text-sm min-h-[60px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={formData.ctaSection.buttonText}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      ctaSection: { ...formData.ctaSection!, buttonText: e.target.value },
                                    })
                                  }
                                  placeholder="Button text..."
                                  className="text-sm"
                                />
                                <Input
                                  value={formData.ctaSection.buttonLink}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      ctaSection: { ...formData.ctaSection!, buttonLink: e.target.value },
                                    })
                                  }
                                  placeholder="Button link..."
                                  className="text-sm"
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
            <AlertDialogTitle>Initialize Default Corporate Pages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create default About Us and B2B Services pages with pre-filled content including team members and features.
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
