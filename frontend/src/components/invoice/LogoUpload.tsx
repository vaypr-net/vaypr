import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LogoUploadProps {
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export function LogoUpload({ logo, onLogoChange }: LogoUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Company Logo</h3>
      
      <p className="text-xs text-muted-foreground">Recommended size: 200 × 80 pixels (PNG or JPG)</p>
      
      {logo ? (
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-lg border border-border bg-secondary/50 overflow-hidden">
            <img 
              src={logo} 
              alt="Company logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onLogoChange(null)}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      )}
    </div>
  );
}
