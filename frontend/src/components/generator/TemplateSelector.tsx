import { FileText, Receipt, FileCheck, Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DesignTemplate } from "@/types/designTemplate";

interface TemplateSelectorProps {
  templates: (DesignTemplate & { categoryName: string; categoryColor: string })[];
  documentType: "invoice" | "receipt" | "quote";
  onSelectTemplate: (template: DesignTemplate) => void;
}

export function TemplateSelector({
  templates,
  documentType,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const filteredTemplates = templates.filter((t) => t.type === documentType);

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.categoryName]) {
      acc[template.categoryName] = {
        color: template.categoryColor,
        templates: [],
      };
    }
    acc[template.categoryName].templates.push(template);
    return acc;
  }, {} as Record<string, { color: string; templates: typeof filteredTemplates }>);

  const getIcon = () => {
    switch (documentType) {
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "receipt":
        return <Receipt className="h-4 w-4" />;
      case "quote":
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const handleValueChange = (templateId: string) => {
    const template = filteredTemplates.find((t) => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  if (filteredTemplates.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Palette className="h-4 w-4 text-muted-foreground" />
      <Select onValueChange={handleValueChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Choose a template..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedTemplates).map(([categoryName, { color, templates }]) => (
            <SelectGroup key={categoryName}>
              <SelectLabel className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `hsl(${color})` }}
                />
                {categoryName}
              </SelectLabel>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {getIcon()}
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
