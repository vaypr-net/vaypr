import { useState } from "react";
import {
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit3,
  FileText,
  Receipt,
  FileCheck,
  ChevronRight,
  Plus,
  X,
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
import { CompanyFile, FILE_COLORS } from "@/types/companyFile";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompanyFileSidebarProps {
  files: CompanyFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, color: string, description?: string) => void;
  onUpdateFile: (id: string, updates: Partial<Omit<CompanyFile, "id" | "createdAt" | "documents">>) => void;
  onDeleteFile: (id: string) => void;
  onSelectDocument: (doc: any, type: "invoice" | "receipt" | "quote") => void;
}

export function CompanyFileSidebar({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  onSelectDocument,
}: CompanyFileSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CompanyFile | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFileDescription, setNewFileDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(FILE_COLORS[0].value);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim(), selectedColor, newFileDescription.trim() || undefined);
      setNewFileName("");
      setNewFileDescription("");
      setSelectedColor(FILE_COLORS[0].value);
      setIsCreateOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingFile && newFileName.trim()) {
      onUpdateFile(editingFile.id, {
        name: newFileName.trim(),
        description: newFileDescription.trim() || undefined,
        color: selectedColor,
      });
      setEditingFile(null);
      setNewFileName("");
      setNewFileDescription("");
      setIsEditOpen(false);
    }
  };

  const openEditDialog = (file: CompanyFile) => {
    setEditingFile(file);
    setNewFileName(file.name);
    setNewFileDescription(file.description || "");
    setSelectedColor(file.color);
    setIsEditOpen(true);
  };

  const getDocumentIcon = (type: string) => {
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

  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <>
      <div className="w-72 border-r border-border bg-card/50 flex flex-col h-full print:hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Company Files</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCreateOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create files to organize your documents
          </p>
        </div>

        {/* File List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {files.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Folder className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No files yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create First File
                </Button>
              </div>
            ) : (
              files.map((file) => {
                const isActive = file.id === activeFileId;
                const isExpanded = expandedFileId === file.id;
                const documentCount = file.documents.length;

                return (
                  <div key={file.id} className="space-y-0.5">
                    <div
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                        isActive
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted border border-transparent"
                      )}
                      onClick={() => {
                        onSelectFile(file.id);
                        setExpandedFileId(isExpanded ? null : file.id);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `hsl(${file.color} / 0.15)` }}
                      >
                        {isActive ? (
                          <FolderOpen
                            className="h-4 w-4"
                            style={{ color: `hsl(${file.color})` }}
                          />
                        ) : (
                          <Folder
                            className="h-4 w-4"
                            style={{ color: `hsl(${file.color})` }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {documentCount} document{documentCount !== 1 ? "s" : ""}
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
                          <DropdownMenuItem onClick={() => openEditDialog(file)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Documents List */}
                    {isExpanded && file.documents.length > 0 && (
                      <div className="ml-6 pl-4 border-l border-border space-y-0.5">
                        {file.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDocument(doc.data, doc.type);
                            }}
                          >
                            <span
                              className="shrink-0"
                              style={{ color: `hsl(${file.color})` }}
                            >
                              {getDocumentIcon(doc.type)}
                            </span>
                            <span className="truncate text-muted-foreground">
                              {doc.title}
                            </span>
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

        {/* Active File Summary */}
        {activeFile && (
          <div
            className="p-4 border-t border-border"
            style={{ backgroundColor: `hsl(${activeFile.color} / 0.05)` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `hsl(${activeFile.color})` }}
              />
              <span className="text-xs font-medium text-foreground">Active File</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {activeFile.name}
            </p>
            {activeFile.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activeFile.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create File Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Create New File
            </DialogTitle>
            <DialogDescription>
              Create a company file to organize your invoices, receipts, and quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="e.g., My Company LLC"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileDescription">Description (Optional)</Label>
              <Input
                id="fileDescription"
                placeholder="e.g., Main business documents"
                value={newFileDescription}
                onChange={(e) => setNewFileDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {FILE_COLORS.map((color) => (
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
            <Button onClick={handleCreate} disabled={!newFileName.trim()}>
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFileName">File Name</Label>
              <Input
                id="editFileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFileDescription">Description (Optional)</Label>
              <Input
                id="editFileDescription"
                value={newFileDescription}
                onChange={(e) => setNewFileDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {FILE_COLORS.map((color) => (
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
            <Button onClick={handleEdit} disabled={!newFileName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
