import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Receipt, FileCheck, ArrowRight, Building2, User, AlertCircle } from "lucide-react";
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
import { useInvoices, useQuotes, useReceipts, useClients } from "@/hooks/useData";
import { InvoiceData } from "@/types/invoice";
import { ReceiptData } from "@/types/receipt";
import { QuoteData } from "@/types/quote";
import { Invoice, Quote, ReceiptVoucher } from "@/types/app";
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
  const { addInvoice } = useInvoices();
  const { addQuote } = useQuotes();
  const { addReceipt } = useReceipts();
  const { clients } = useClients();
  
  const [selectedClientId, setSelectedClientId] = useState("");
  const [goToDashboard, setGoToDashboard] = useState(false);

  // Separate clients into companies and individuals
  const companies = clients.filter(c => c.type === 'company');
  const individuals = clients.filter(c => c.type === 'individual' || !c.type);

  const selectedClient = clients.find(c => c.id === selectedClientId);

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

  const handleSave = () => {
    if (!selectedClientId) {
      toast.error("Please select a client or company");
      return;
    }

    const clientName = selectedClient?.name || "Unknown Client";

    if (documentType === "invoice" && invoiceData) {
      const subtotal = invoiceData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const discountAmount = (subtotal * invoiceData.discount) / 100;
      const total = invoiceData.useManualGrandTotal
        ? invoiceData.manualGrandTotal
        : subtotal - discountAmount + invoiceData.deliveryFee;

      const invoice: Omit<Invoice, "id" | "createdAt"> = {
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        clientId: selectedClientId,
        clientName: clientName,
        clientPhone: selectedClient?.phone || invoiceData.billTo.phone || undefined,
        clientArea: invoiceData.billTo.area || undefined,
        clientBlock: invoiceData.billTo.block || undefined,
        clientStreet: invoiceData.billTo.street || undefined,
        clientHouse: invoiceData.billTo.house || undefined,
        clientOther: invoiceData.billTo.other || undefined,
        status: "draft",
        issueDate: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
        dueDate: invoiceData.paymentDate || new Date().toISOString().split("T")[0],
        items: invoiceData.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
        subtotal,
        tax: 0,
        discount: invoiceData.discount,
        deliveryFee: invoiceData.deliveryFee,
        total,
        currency: invoiceData.currency,
        currencySymbol: invoiceData.currencySymbol,
        notes: invoiceData.paymentTerms || undefined,
        paymentMethod: invoiceData.paymentMethodType === 'cash' ? 'Cash' : 
                       invoiceData.paymentMethodType === 'bank_transfer' ? 'Bank Transfer' :
                       invoiceData.paymentMethodType === 'cheque' ? 'Cheque' :
                       invoiceData.paymentMethodType === 'online_payment' ? 'Online Payment' : undefined,
        paymentTerms: invoiceData.paymentTerms || undefined,
        showPaymentMethod: invoiceData.showPaymentMethod,
        showPaymentTerms: invoiceData.showPaymentTerms,
        showBankAccount: invoiceData.showBankAccount,
        bankName: invoiceData.bankAccount.bankName || undefined,
        bankAccountName: invoiceData.bankAccount.accountName || undefined,
        bankIban: invoiceData.bankAccount.iban || undefined,
        companyName: invoiceData.companyFooter.companyName || undefined,
        companyAddress: invoiceData.companyFooter.address || undefined,
        companyPhone: invoiceData.companyFooter.officePhone || undefined,
        companyEmail: invoiceData.companyFooter.websiteEmail || undefined,
        logo: invoiceData.logo,
        tableHeaderColor: invoiceData.tableHeaderColor || undefined,
        hideQuantity: invoiceData.hideQuantity,
        hideUnitPrice: invoiceData.hideUnitPrice,
        hideTotalCost: invoiceData.hideTotalCost,
        hideSubTotal: invoiceData.hideSubTotal,
        useManualGrandTotal: invoiceData.useManualGrandTotal,
        manualGrandTotal: invoiceData.manualGrandTotal,
      };

      addInvoice(invoice);
      toast.success("Invoice saved to dashboard!");
    } else if (documentType === "quote" && quoteData) {
      const subtotal = quoteData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const total = quoteData.useManualGrandTotal
        ? quoteData.manualGrandTotal
        : subtotal - quoteData.discount + quoteData.deliveryFee;

      const quote: Omit<Quote, "id" | "createdAt"> = {
        quoteNumber: quoteData.quoteNumber || `QT-${Date.now()}`,
        clientId: selectedClientId,
        clientName: clientName,
        clientPhone: selectedClient?.phone || quoteData.billTo.phone || undefined,
        clientArea: quoteData.billTo.area || undefined,
        clientBlock: quoteData.billTo.block || undefined,
        clientStreet: quoteData.billTo.street || undefined,
        clientHouse: quoteData.billTo.house || undefined,
        status: "draft",
        quoteDate: quoteData.quoteDate || new Date().toISOString().split("T")[0],
        validUntil: quoteData.validUntil || new Date().toISOString().split("T")[0],
        items: quoteData.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        subtotal,
        discount: quoteData.discount,
        total,
        currency: quoteData.currency,
        currencySymbol: quoteData.currencySymbol,
        notes: quoteData.notes || undefined,
        companyName: quoteData.companyFooter.companyName || undefined,
        companyAddress: quoteData.companyFooter.address || undefined,
        companyPhone: quoteData.companyFooter.officePhone || undefined,
        companyEmail: quoteData.companyFooter.websiteEmail || undefined,
        logo: quoteData.logo,
        shareToken: crypto.randomUUID().replace(/-/g, '').substring(0, 16),
      };

      addQuote(quote);
      toast.success("Quote saved to dashboard!");
    } else if (documentType === "receipt" && receiptData) {
      const receipt: Omit<ReceiptVoucher, "id" | "createdAt"> = {
        receiptNumber: receiptData.receiptNumber || `RCV-${Date.now()}`,
        receivedFrom: clientName,
        clientId: selectedClientId,
        amount: receiptData.amount,
        currency: receiptData.currency,
        currencySymbol: receiptData.currencySymbol,
        paymentMethod: receiptData.paymentMethod || "Cash",
        reason: receiptData.reason || "",
        receiptDate: receiptData.receiptDate || new Date().toISOString().split("T")[0],
        status: "draft",
        companyName: receiptData.companyName || undefined,
        companyAddress: receiptData.companyAddress || undefined,
        companyPhone: receiptData.companyPhone || undefined,
        logo: receiptData.logo,
        titleColor: receiptData.titleColor || undefined,
        amountColor: receiptData.amountColor || undefined,
      };

      addReceipt(receipt);
      toast.success("Receipt saved to dashboard!");
    }

    if (goToDashboard) {
      navigate(getDashboardPath());
    }
    
    onClose();
    setSelectedClientId("");
    setGoToDashboard(false);
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
                        <SelectItem key={client.id} value={client.id}>
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
                        <SelectItem key={client.id} value={client.id}>
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!selectedClientId}>
            Save to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}