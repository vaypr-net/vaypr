import { format } from 'date-fns';

interface RecurringPreviewProps {
  data: {
    logo: string | null;
    logoScale: number;
    clientName: string;
    frequency: string;
    nextBillingDate: string;
    description: string;
    grandTotal: number;
    paymentType: string;
    showBankDetails: boolean;
    bankDetails: {
      bankName: string;
      accountName: string;
      iban: string;
    };
    showPaymentTerms: boolean;
    paymentTerms: string;
    companyFooter: {
      companyName: string;
      officePhone: string;
      address: string;
      websiteEmail: string;
    };
    itemHeaderColor: string;
  };
}

export function RecurringPreview({ data }: RecurringPreviewProps) {
  const formatCurrency = (amount: number) => `KD ${amount.toFixed(3)}`;
  
  const getPaymentMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      cash: 'CASH',
      bank_transfer: 'BANK TRANSFER',
      cheque: 'CHEQUE',
      online_payment: 'ONLINE PAYMENT',
    };
    return labels[type] || type.toUpperCase();
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const logoSize = 80 * (data.logoScale || 1);

  return (
    <div className="bg-white text-black p-8 min-h-[600px] rounded-lg shadow-lg">
      {/* Header with Logo */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {data.logo && (
            <img 
              src={data.logo} 
              alt="Company logo" 
              crossOrigin="anonymous"
              style={{ 
                height: `${logoSize}px`,
                width: 'auto',
                maxWidth: `${logoSize * 2.5}px`,
                objectFit: 'contain'
              }}
            />
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800">RECURRING BILLING</h1>
          <p className="text-sm text-gray-600 mt-1">
            {getFrequencyLabel(data.frequency)} • Next: {data.nextBillingDate ? format(new Date(data.nextBillingDate), 'MMM d, yyyy') : '-'}
          </p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
        <p className="font-medium text-gray-800">{data.clientName || 'Client Name'}</p>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: data.itemHeaderColor || '#6366f1' }}>
              <th className="text-left p-3 text-white font-medium">Description</th>
              <th className="text-right p-3 text-white font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">{data.description || 'Billing description'}</td>
              <td className="p-3 text-right text-gray-700">{formatCurrency(data.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
            <span>Grand Total</span>
            <span>{formatCurrency(data.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Method</h3>
        <p className="text-gray-700">{getPaymentMethodLabel(data.paymentType)}</p>
      </div>

      {/* Bank Details */}
      {data.showBankDetails && data.bankDetails.bankName && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bank Details</h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-medium">Bank:</span> {data.bankDetails.bankName}</p>
            <p><span className="font-medium">Account Number:</span> {data.bankDetails.accountName}</p>
            <p><span className="font-medium">IBAN Number:</span> {data.bankDetails.iban}</p>
          </div>
        </div>
      )}

      {/* Payment Terms */}
      {data.showPaymentTerms && data.paymentTerms && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Terms</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.paymentTerms}</p>
        </div>
      )}

      {/* Footer */}
      {(data.companyFooter.companyName || data.companyFooter.address) && (
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            {data.companyFooter.companyName}
            {data.companyFooter.address && ` • ${data.companyFooter.address}`}
            {data.companyFooter.officePhone && ` • Office: ${data.companyFooter.officePhone}`}
            {data.companyFooter.websiteEmail && ` • ${data.companyFooter.websiteEmail}`}
          </p>
        </div>
      )}
    </div>
  );
}
