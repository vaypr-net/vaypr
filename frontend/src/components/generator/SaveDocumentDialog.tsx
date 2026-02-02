import { useState } from "react";
import { Save, FileText, Receipt, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyFile } from "@/types/companyFile";

interface SaveDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  documentType: "invoice" | "receipt" | "quote";
  activeFile: CompanyFile | null;
}

export function SaveDocumentDialog({
  isOpen,
  onClose,
  onSave,
  documentType,
  activeFile,
}: SaveDocumentDialogProps) {
  const [title, setTitle] = useState("");

  const getDefaultTitle = () => {
    const date = new Date().toLocaleDateString();
    const typeLabel = documentType.charAt(0).toUpperCase() + documentType.slice(1);
    return `${typeLabel} - ${date}`;
  };

  const handleSave = () => {
    const finalTitle = title.trim() || getDefaultTitle();
    onSave(finalTitle);
    setTitle("");
    onClose();
  };

  const getIcon = () => {
    switch (documentType) {
      case "invoice":
        return <FileText className="h-5 w-5 text-primary" />;
      case "receipt":
        return <Receipt className="h-5 w-5 text-primary" />;
      case "quote":
        return <FileCheck className="h-5 w-5 text-primary" />;
    }
  };

  if (!activeFile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            Save {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Save this document to <strong>{activeFile.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="docTitle">Document Title</Label>
            <Input
              id="docTitle"
              placeholder={getDefaultTitle()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default title
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${activeFile.color})` }}
              />
              <span className="text-muted-foreground">Saving to:</span>
              <span className="font-medium">{activeFile.name}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
