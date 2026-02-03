import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Receipt, FileCheck, ArrowRight, Building2, User, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInvoice } from "@/hooks/api/useInvoices";
import { useCreateQuote } from "@/hooks/api/useQuotes";
import { useCreateReceipt } from "@/hooks/api/useReceipts";
import { useClients } from "@/hooks/api/useClients";
import { InvoiceData } from "@/types/invoice";
import { ReceiptData } from "@/types/receipt";
import { QuoteData } from "@/types/quote";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SaveToDashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "invoice" | "receipt" | "quote";
  invoiceData?: InvoiceData;
  receiptData?: ReceiptData;
  quoteData?: QuoteData;
}

export function SaveToDashboardDialog({
  isOpen,
  onClose,
  documentType,
  invoiceData,
  receiptData,
  quoteData,
}: SaveToDashboardDialogProps) {
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const createQuote = useCreateQuote();
  const createReceipt = useCreateReceipt();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  
  const [selectedClientId, setSelectedClientId] = useState("");
  const [goToDashboard, setGoToDashboard] = useState(false);

  // Separate clients into companies and individuals
  const companies = clients.filter(c => c.clientType === 'company');
  const individuals = clients.filter(c => c.clientType === 'individual' || !c.clientType);

  const selectedClient = clients.find(c => c._id === selectedClientId);

  const getIcon = () => {
    switch (documentType) {
      case "receipt":
        return <Receipt className="h-5 w-5" />;
      case "quote":
        return <FileCheck className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (documentType) {
      case "receipt":
        return "Save Receipt to Dashboard";
      case "quote":
        return "Save Quote to Dashboard";
      default:
        return "Save Invoice to Dashboard";
    }
  };

  const getDashboardPath = () => {
    switch (documentType) {
      case "receipt":
        return "/dashboard/receipts";
      case "quote":
        return "/dashboard/quotes";
      default:
        return "/dashboard/invoices";
    }
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client or company");
      return;
    }

    try {
      if (documentType === "invoice" && invoiceData) {
        const subtotal = invoiceData.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        
        // Calculate discount as percentage of subtotal
        const discountAmount = (subtotal * invoiceData.discount) / 100;
        const total = invoiceData.useManualGrandTotal
          ? invoiceData.manualGrandTotal
          : Math.max(0, subtotal - discountAmount + invoiceData.deliveryFee); // Ensure total is never negative

        // Prepare invoice data for API
        const apiInvoiceData = {
          invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
          clientId: selectedClientId,
          billTo: {
            name: invoiceData.billTo.name,
            phone: invoiceData.billTo.phone || selectedClient?.phone || '',
            area: invoiceData.billTo.area || '',
            block: invoiceData.billTo.block || '',
            street: invoiceData.billTo.street || '',
            house: invoiceData.billTo.house || '',
            other: invoiceData.billTo.other || '',
          },
          status: 'draft',
          issueDate: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
          dueDate: invoiceData.paymentDate || new Date().toISOString().split("T")[0],
          items: invoiceData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
          subtotal,
          tax: 0,
          discount: invoiceData.discount, // Store as percentage
          deliveryFee: invoiceData.deliveryFee,
          total,
          currency: invoiceData.currency,
          currencySymbol: invoiceData.currencySymbol,
          companyFooter: {
            companyName: invoiceData.companyFooter.companyName || '',
            address: invoiceData.companyFooter.address || '',
            officePhone: invoiceData.companyFooter.officePhone || '',
            websiteEmail: invoiceData.companyFooter.websiteEmail || '',
          },
          showPaymentMethod: invoiceData.showPaymentMethod,
          paymentMethodType: invoiceData.paymentMethodType || 'cash',
          showBankAccount: invoiceData.showBankAccount,
          bankAccount: {
            bankName: invoiceData.bankAccount?.bankName || '',
            accountName: invoiceData.bankAccount?.accountName || '',
            iban: invoiceData.bankAccount?.iban || '',
          },
          showPaymentTerms: invoiceData.showPaymentTerms,
          paymentTerms: invoiceData.paymentTerms || '',
          logoScale: invoiceData.logoScale || 1.0,
          tableHeaderColor: invoiceData.tableHeaderColor,
          hideQuantity: invoiceData.hideQuantity,
          hideUnitPrice: invoiceData.hideUnitPrice,
          hideTotalCost: invoiceData.hideTotalCost,
          hideSubTotal: invoiceData.hideSubTotal,
          useManualGrandTotal: invoiceData.useManualGrandTotal,
          manualGrandTotal: invoiceData.manualGrandTotal,
        };

        // Convert logo to File if it's a base64 string
        let logoFile: File | undefined;
        if (invoiceData.logo && typeof invoiceData.logo === 'string' && invoiceData.logo.startsWith('data:')) {
          const response = await fetch(invoiceData.logo);
          const blob = await response.blob();
          logoFile = new File([blob], 'logo.png', { type: 'image/png' });
        }

        await createInvoice.mutateAsync({ 
          data: apiInvoiceData, 
          logo: logoFile 
        });

      } else if (documentType === "quote" && quoteData) {
        const subtotal = quoteData.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        
        // Calculate discount as percentage of subtotal
        const discountAmount = (subtotal * quoteData.discount) / 100;
        const total = quoteData.useManualGrandTotal
          ? quoteData.manualGrandTotal
          : Math.max(0, subtotal - discountAmount + quoteData.deliveryFee); // Ensure total is never negative

        // Prepare quote data for API
        const apiQuoteData = {
          quoteNumber: quoteData.quoteNumber || `QUO-${Date.now()}`,
          clientId: selectedClientId,
          billTo: {
            name: quoteData.billTo.name,
            phone: quoteData.billTo.phone || selectedClient?.phone || '',
            area: quoteData.billTo.area || '',
            block: quoteData.billTo.block || '',
            street: quoteData.billTo.street || '',
            house: quoteData.billTo.house || '',
            other: quoteData.billTo.other || '',
          },
          status: 'draft',
          quoteDate: quoteData.quoteDate || new Date().toISOString().split("T")[0],
          validUntil: quoteData.validUntil || new Date().toISOString().split("T")[0],
          items: quoteData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
          subtotal,
          discount: quoteData.discount, // Store as percentage
          deliveryFee: quoteData.deliveryFee,
          total,
          currency: quoteData.currency,
          currencySymbol: quoteData.currencySymbol,
          companyFooter: {
            companyName: quoteData.companyFooter.companyName || '',
            address: quoteData.companyFooter.address || '',
            officePhone: quoteData.companyFooter.officePhone || '',
            websiteEmail: quoteData.companyFooter.websiteEmail || '',
          },
          showPaymentMethod: quoteData.showPaymentMethod,
          paymentMethodType: quoteData.paymentMethodType || 'cash',
          showBankAccount: quoteData.showBankAccount,
          bankAccount: {
            bankName: quoteData.bankAccount?.bankName || '',
            accountName: quoteData.bankAccount?.accountName || '',
            iban: quoteData.bankAccount?.iban || '',
          },
          showPaymentTerms: quoteData.showPaymentTerms,
          paymentTerms: quoteData.paymentTerms || '',
          logoScale: quoteData.logoScale || 1.0,
          tableHeaderColor: quoteData.tableHeaderColor,
          hideQuantity: quoteData.hideQuantity,
          hideUnitPrice: quoteData.hideUnitPrice,
          hideTotalCost: quoteData.hideTotalCost,
          hideSubTotal: quoteData.hideSubTotal,
          useManualGrandTotal: quoteData.useManualGrandTotal,
          manualGrandTotal: quoteData.manualGrandTotal,
          notes: quoteData.notes || '',
          paymentDetails: quoteData.paymentDetails || '',
        };

        // Convert logo to File if it's a base64 string
        let logoFile: File | undefined;
        if (quoteData.logo && typeof quoteData.logo === 'string' && quoteData.logo.startsWith('data:')) {
          const response = await fetch(quoteData.logo);
          const blob = await response.blob();
          logoFile = new File([blob], 'logo.png', { type: 'image/png' });
        }

        await createQuote.mutateAsync({ 
          data: apiQuoteData, 
          logo: logoFile 
        });

      } else if (documentType === "receipt" && receiptData) {
        // Prepare receipt data for API
        const apiReceiptData = {
          receiptNumber: receiptData.receiptNumber || `REC-${Date.now()}`,
          clientId: selectedClientId,
          receiptDate: receiptData.date || new Date().toISOString().split("T")[0],
          receivedFrom: receiptData.receivedFrom || selectedClient?.name || '',
          amount: receiptData.amount || 0,
          currency: receiptData.currency || 'KWD',
          currencySymbol: receiptData.currencySymbol || 'KD',
          paymentMethod: receiptData.paymentMethod || 'cash',
          reason: receiptData.reason || '',
          receivedBy: receiptData.receivedBy || '',
          companyName: receiptData.companyName || '',
          companyAddress: receiptData.companyAddress || '',
          companyPhone: receiptData.companyPhone || '',
          logoScale: receiptData.logoScale || 1.0,
          titleColor: receiptData.titleColor || '#000000',
          amountColor: receiptData.amountColor || '#000000',
          status: 'draft',
        };

        // Convert logo to File if it's a base64 string
        let logoFile: File | undefined;
        if (receiptData.logo && typeof receiptData.logo === 'string' && receiptData.logo.startsWith('data:')) {
          const response = await fetch(receiptData.logo);
          const blob = await response.blob();
          logoFile = new File([blob], 'logo.png', { type: 'image/png' });
        }

        await createReceipt.mutateAsync({ 
          data: apiReceiptData, 
          logo: logoFile 
        });
      }

      if (goToDashboard) {
        navigate(getDashboardPath());
      }
      
      onClose();
      setSelectedClientId("");
      setGoToDashboard(false);
    } catch (error) {
      console.error('Error saving document:', error);
      // Error toast is already shown by the mutation hook
    }
  };

  const hasClients = clients.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Save this {documentType} to your dashboard for tracking and management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              {documentType === "receipt" ? "Received From" : "Select Client / Company"}
            </Label>
            
            {hasClients ? (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client or company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Companies
                      </div>
                      {companies.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span>{client.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {individuals.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        Individual Clients
                      </div>
                      {individuals.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{client.name}</span>
                            {client.company && (
                              <span className="text-xs text-muted-foreground">({client.company})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                No clients or companies found
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Can't find your client or company?{" "}
              <Link 
                to="/dashboard/clients" 
                className="font-medium text-primary hover:underline"
                onClick={onClose}
              >
                Go to Clients page
              </Link>{" "}
              to add new details, then come back to save your {documentType}.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="goToDashboard"
              checked={goToDashboard}
              onChange={(e) => setGoToDashboard(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="goToDashboard" className="text-sm font-normal cursor-pointer">
              Go to {documentType}s page after saving
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={createInvoice.isPending || createQuote.isPending || createReceipt.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="gap-2" 
            disabled={!selectedClientId || createInvoice.isPending || createQuote.isPending || createReceipt.isPending}
          >
            {(createInvoice.isPending || createQuote.isPending || createReceipt.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save to Dashboard
            {!(createInvoice.isPending || createQuote.isPending || createReceipt.isPending) && (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}