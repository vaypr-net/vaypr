import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  X,
  Loader2,
  Info
} from 'lucide-react';
import { ClientType } from '@/types/app';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportedClient {
  type: ClientType;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}

interface ParsedRow {
  data: ImportedClient;
  isValid: boolean;
  errors: string[];
  rowNumber: number;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (clients: ImportedClient[]) => void;
}

export function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const requiredFields = [
    { field: 'name', label: 'Name', required: true, description: 'Client full name or company name' },
    { field: 'email', label: 'Email', required: true, description: 'Valid email address' },
  ];

  const optionalFields = [
    { field: 'type', label: 'Type', required: false, description: 'Either "individual" or "company" (defaults to individual)' },
    { field: 'phone', label: 'Phone', required: false, description: 'Contact phone number' },
    { field: 'company', label: 'Company', required: false, description: 'Company/organization name' },
    { field: 'address', label: 'Address', required: false, description: 'Full address' },
    { field: 'notes', label: 'Notes', required: false, description: 'Additional notes about the client' },
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const parseRow = (row: Record<string, unknown>, rowNumber: number): ParsedRow => {
    const errors: string[] = [];
    
    // Extract and normalize values
    const name = String(row.name || row.Name || row.NAME || '').trim();
    const email = String(row.email || row.Email || row.EMAIL || '').trim();
    const typeRaw = String(row.type || row.Type || row.TYPE || 'individual').trim().toLowerCase();
    const phone = String(row.phone || row.Phone || row.PHONE || row.mobile || row.Mobile || '').trim();
    const company = String(row.company || row.Company || row.COMPANY || row.organization || row.Organization || '').trim();
    const address = String(row.address || row.Address || row.ADDRESS || '').trim();
    const notes = String(row.notes || row.Notes || row.NOTES || '').trim();

    // Validate required fields
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Invalid email format');

    // Normalize type
    const type: ClientType = typeRaw === 'company' ? 'company' : 'individual';

    return {
      data: {
        type,
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
        address: address || undefined,
        notes: notes || undefined,
      },
      isValid: errors.length === 0,
      errors,
      rowNumber,
    };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let rawData: Record<string, unknown>[] = [];

      if (extension === 'csv') {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });
        rawData = result.data as Record<string, unknown>[];
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawData = XLSX.utils.sheet_to_json(firstSheet);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      if (rawData.length === 0) {
        throw new Error('No data found in file');
      }

      // Parse and validate each row
      const parsed = rawData.map((row, index) => parseRow(row, index + 2)); // +2 for header row and 1-indexing
      setParsedData(parsed);

      const validCount = parsed.filter(r => r.isValid).length;
      const invalidCount = parsed.filter(r => !r.isValid).length;

      toast({
        title: 'File processed',
        description: `${validCount} valid clients, ${invalidCount} with errors`,
      });
    } catch (error) {
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const downloadTemplate = () => {
    const headers = ['name', 'email', 'type', 'phone', 'company', 'address', 'notes'];
    const sampleData = [
      headers.join(','),
      'John Doe,john@example.com,individual,+965 1234 5678,ABC Corp,Kuwait City,Valued customer',
      'Tech Solutions LLC,contact@techsolutions.com,company,+965 8765 4321,,Salmiya - Block 5,Enterprise account',
    ];
    
    const csvContent = sampleData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'client_import_template.csv';
    link.click();
  };

  const handleImport = () => {
    const validClients = parsedData.filter(r => r.isValid).map(r => r.data);
    if (validClients.length === 0) {
      toast({
        title: 'No valid clients',
        description: 'Please fix the errors and try again',
        variant: 'destructive',
      });
      return;
    }
    
    onImport(validClients);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setParsedData([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Clients
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple clients at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Field Requirements */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-primary" />
              Required Fields
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {requiredFields.map(field => (
                <div key={field.field} className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">{field.label}</Badge>
                  <span className="text-xs text-muted-foreground">{field.description}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium mt-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Optional Fields
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {optionalFields.map(field => (
                <div key={field.field} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{field.label}</Badge>
                  <span className="text-xs text-muted-foreground">{field.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          {parsedData.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processing file...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-4 mb-4">
                    <FileSpreadsheet className="h-10 w-10 text-primary" />
                    <FileText className="h-10 w-10 text-primary/70" />
                  </div>
                  <p className="text-lg font-medium mb-2">Drag & drop your file here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports CSV and Excel files (.csv, .xlsx, .xls)
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* File Info & Stats */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{fileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {invalidCount} errors
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview Table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Row</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, index) => (
                      <tr key={index} className={`border-b ${!row.isValid ? 'bg-destructive/5' : ''}`}>
                        <td className="p-3 text-muted-foreground">{row.rowNumber}</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </td>
                        <td className="p-3 font-medium">{row.data.name || '-'}</td>
                        <td className="p-3">{row.data.email || '-'}</td>
                        <td className="p-3">
                          <Badge variant={row.data.type === 'company' ? 'default' : 'secondary'} className="text-xs">
                            {row.data.type}
                          </Badge>
                        </td>
                        <td className="p-3">{row.data.phone || '-'}</td>
                        <td className="p-3">
                          {row.errors.length > 0 && (
                            <span className="text-xs text-destructive">{row.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={validCount === 0}>
              Import {validCount} Client{validCount !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
