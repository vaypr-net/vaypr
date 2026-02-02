import { useState } from "react";
import {
  Palette,
  FolderOpen,
  Folder,
  MoreVertical,
  Trash2,
  Edit3,
  FileText,
  Receipt,
  FileCheck,
  ChevronRight,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateCategory, CATEGORY_COLORS, DesignTemplate } from "@/types/designTemplate";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DesignTemplateSidebarProps {
  categories: TemplateCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onCreateCategory: (name: string, color: string, description?: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Omit<TemplateCategory, "id" | "createdAt" | "templates">>) => void;
  onDeleteCategory: (id: string) => void;
  onSelectTemplate: (template: DesignTemplate) => void;
  onDeleteTemplate: (categoryId: string, templateId: string) => void;
}

export function DesignTemplateSidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectTemplate,
  onDeleteTemplate,
}: DesignTemplateSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLORS[0].value);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim(), selectedColor, newCategoryDescription.trim() || undefined);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setSelectedColor(CATEGORY_COLORS[0].value);
      setIsCreateOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingCategory && newCategoryName.trim()) {
      onUpdateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: selectedColor,
      });
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setIsEditOpen(false);
    }
  };

  const openEditDialog = (category: TemplateCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || "");
    setSelectedColor(category.color);
    setIsEditOpen(true);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-3 w-3" />;
      case "receipt":
        return <Receipt className="h-3 w-3" />;
      case "quote":
        return <FileCheck className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <>
      <div className="w-72 border-r border-border bg-card/50 flex flex-col h-full print:hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Design Templates
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Save templates for reusable designs
          </p>
        </div>

        {/* Category List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {categories.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Palette className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No templates yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Category
                </Button>
              </div>
            ) : (
              categories.map((category) => {
                const isActive = category.id === activeCategoryId;
                const isExpanded = expandedCategoryId === category.id;
                const templateCount = category.templates.length;

                return (
                  <div key={category.id} className="space-y-0.5">
                    <div
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                        isActive
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted border border-transparent"
                      )}
                      onClick={() => {
                        onSelectCategory(category.id);
                        setExpandedCategoryId(isExpanded ? null : category.id);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `hsl(${category.color} / 0.15)` }}
                      >
                        {isActive ? (
                          <FolderOpen
                            className="h-4 w-4"
                            style={{ color: `hsl(${category.color})` }}
                          />
                        ) : (
                          <Folder
                            className="h-4 w-4"
                            style={{ color: `hsl(${category.color})` }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {templateCount} template{templateCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Templates List */}
                    {isExpanded && category.templates.length > 0 && (
                      <div className="ml-6 pl-4 border-l border-border space-y-0.5">
                        {category.templates.map((template) => (
                          <div
                            key={template.id}
                            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate(template);
                            }}
                          >
                            <span
                              className="shrink-0"
                              style={{ color: `hsl(${category.color})` }}
                            >
                              {getTemplateIcon(template.type)}
                            </span>
                            <span className="truncate text-muted-foreground flex-1">
                              {template.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTemplate(category.id, template.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Active Category Summary */}
        {activeCategory && (
          <div
            className="p-4 border-t border-border"
            style={{ backgroundColor: `hsl(${activeCategory.color} / 0.05)` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `hsl(${activeCategory.color})` }}
              />
              <span className="text-xs font-medium text-foreground">Active Category</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {activeCategory.name}
            </p>
            {activeCategory.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activeCategory.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Create Template Category
            </DialogTitle>
            <DialogDescription>
              Create a category to organize your design templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Corporate Templates"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description (Optional)</Label>
              <Input
                id="categoryDescription"
                placeholder="e.g., Professional business templates"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        : "hover:scale-110"
                    )}
                    style={{
                      backgroundColor: `hsl(${color.value})`,
                    }}
                    onClick={() => setSelectedColor(color.value as string)}
                  >
                    {selectedColor === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newCategoryName.trim()}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryDescription">Description (Optional)</Label>
              <Input
                id="editCategoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        : "hover:scale-110"
                    )}
                    style={{
                      backgroundColor: `hsl(${color.value})`,
                    }}
                    onClick={() => setSelectedColor(color.value as string)}
                  >
                    {selectedColor === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!newCategoryName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
