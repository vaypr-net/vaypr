import { useState } from "react";
import { 
  ExternalLink, 
  Plus, 
  Save, 
  Trash2,
  Loader2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetSocialLinks,
  useCreateSocialLink,
  useUpdateSocialLink,
  useDeleteSocialLink,
  useToggleSocialLink,
} from "@/hooks/api/useSocialLinks";
import { getSocialIcon, SOCIAL_PLATFORMS } from "@/lib/social-icons";
import type { SocialLink } from "@/api/services/social-links.service";

export function SocialMediaEditor() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({
    platform: '',
    url: '',
    icon: '',
  });

  // API hooks
  const { data: socialLinks, isLoading, error } = useGetSocialLinks();
  const createMutation = useCreateSocialLink();
  const updateMutation = useUpdateSocialLink();
  const deleteMutation = useDeleteSocialLink();
  const toggleMutation = useToggleSocialLink();

  // Handle URL change with auto-save
  const handleUrlChange = (id: string, url: string) => {
    updateMutation.mutate({ 
      id, 
      data: { url } 
    });
  };

  // Handle toggle enabled/disabled
  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setDeletingLinkId(id);
  };

  const confirmDelete = () => {
    if (deletingLinkId) {
      deleteMutation.mutate(deletingLinkId, {
        onSuccess: () => {
          setDeletingLinkId(null);
        },
      });
    }
  };

  // Handle add new link
  const handleAddLink = () => {
    if (!newLink.platform || !newLink.url) return;

    createMutation.mutate(
      {
        platform: newLink.platform,
        url: newLink.url,
        icon: newLink.icon || newLink.platform.toLowerCase(),
        enabled: true,
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setNewLink({ platform: '', url: '', icon: '' });
        },
      }
    );
  };

  // Handle platform selection
  const handlePlatformSelect = (value: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === value);
    setNewLink({
      platform: platform?.label || value,
      url: '',
      icon: platform?.icon || value,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading social links...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <p className="text-sm text-destructive">
          Failed to load social links. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Social Links List */}
      {socialLinks?.map((link) => {
        const IconComponent = getSocialIcon(link.icon);
        
        return (
          <div 
            key={link._id} 
            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* URL Input */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {link.platform}
                </Label>
                <Input
                  value={link.url}
                  onChange={(e) => handleUrlChange(link._id, e.target.value)}
                  placeholder={`Enter ${link.platform} URL`}
                  className="h-9"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Toggle enabled/disabled */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={link.enabled}
                  onCheckedChange={() => handleToggle(link._id)}
                  disabled={toggleMutation.isPending}
                />
                <span className="text-xs text-muted-foreground w-16">
                  {link.enabled ? "Visible" : "Hidden"}
                </span>
              </div>

              {/* Preview link */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => window.open(link.url, '_blank')}
                disabled={!link.url}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(link._id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add New Link Button */}
      <Button 
        variant="outline" 
        className="w-full mt-4"
        onClick={() => setShowAddDialog(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Social Link
      </Button>

      {/* Add Link Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Link</DialogTitle>
            <DialogDescription>
              Add a new social media link to your website footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Platform selector */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select onValueChange={handlePlatformSelect} value={newLink.icon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const IconComponent = getSocialIcon(platform.icon);
                    return (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{platform.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                setNewLink({ platform: '', url: '', icon: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddLink}
              disabled={!newLink.platform || !newLink.url || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLinkId} onOpenChange={(open) => !open && setDeletingLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Social Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this social link? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
