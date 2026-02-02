import { useState, useEffect } from "react";
import { Palette, FileText, Receipt, FileCheck } from "lucide-react";
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
import { TemplateCategory } from "@/types/designTemplate";

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  documentType: "invoice" | "receipt" | "quote";
  activeCategory: TemplateCategory | null;
}

export function SaveTemplateDialog({
  isOpen,
  onClose,
  onSave,
  documentType,
  activeCategory,
}: SaveTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (isOpen) {
      const defaultName = `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Template`;
      setTemplateName(defaultName);
    }
  }, [isOpen, documentType]);

  const handleSave = () => {
    if (templateName.trim()) {
      onSave(templateName.trim());
      setTemplateName("");
      onClose();
    }
  };

  const getIcon = () => {
    switch (documentType) {
      case "invoice":
        return <FileText className="h-5 w-5" />;
      case "receipt":
        return <Receipt className="h-5 w-5" />;
      case "quote":
        return <FileCheck className="h-5 w-5" />;
    }
  };

  if (!activeCategory) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Save Design Template
            </DialogTitle>
            <DialogDescription>
              Please create or select a template category first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Save Design Template
          </DialogTitle>
          <DialogDescription>
            Save this {documentType} design as a reusable template in{" "}
            <span className="font-medium text-foreground">{activeCategory.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                {getIcon()}
              </div>
              <Input
                id="templateName"
                placeholder="e.g., Corporate Invoice"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              This template will save your current design settings including logo, colors, 
              company information, and payment details. Item details will not be saved.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
