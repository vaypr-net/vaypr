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
  const accentColor = data.itemHeaderColor || '#6366f1';
  const formatCurrency = (amount: number) => `KD ${amount.toFixed(3)}`;

  const getPaymentMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      online_payment: 'Online Payment',
    };
    return labels[type] || type;
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
  const showLeft = data.paymentType || (data.showPaymentTerms && data.paymentTerms) || (data.showBankDetails && data.bankDetails.bankName);

  return (
    <div className="bg-white text-black p-8 min-h-[600px] font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          {data.logo && (
            <img
              src={data.logo}
              alt="Company logo"
              style={{
                height: `${logoSize}px`,
                width: 'auto',
                maxWidth: `${logoSize * 3}px`,
                objectFit: 'contain',
              }}
            />
          )}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold" style={{ color: accentColor }}>
            Recurring
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {getFrequencyLabel(data.frequency)}
          </p>
          <p className="text-sm text-gray-500">
            Next: {data.nextBillingDate ? format(new Date(data.nextBillingDate), 'dd/MM/yyyy') : '—'}
          </p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 bg-gray-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Billed to</p>
        <p className="font-semibold text-gray-800 text-base">{data.clientName || 'Client Name'}</p>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: accentColor }}>
              <th className="text-left px-4 py-3 text-white font-semibold text-sm">Item description</th>
              <th className="text-right px-4 py-3 text-white font-semibold text-sm">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-4 text-gray-700 text-sm">{data.description || 'Billing description'}</td>
              <td className="px-4 py-4 text-right text-gray-700 text-sm">{formatCurrency(data.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom two-column section — matches invoice layout */}
      <div className="flex gap-8 items-start">
        {/* Left: Payment Method + Terms + Bank Details */}
        {showLeft && (
          <div className="flex-1 space-y-3">
            {data.paymentType && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Payment Method</p>
                <p className="text-sm text-gray-600">{getPaymentMethodLabel(data.paymentType)}</p>
              </div>
            )}

            {data.showPaymentTerms && data.paymentTerms && (
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Payment Terms</p>
                <p className="text-xs text-gray-500 whitespace-pre-wrap">{data.paymentTerms}</p>
              </div>
            )}

            {data.showBankDetails && data.bankDetails.bankName && (
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Bank Transfer Details</p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Bank:</span> {data.bankDetails.bankName}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Account Number:</span> {data.bankDetails.accountName}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">IBAN Number:</span> {data.bankDetails.iban}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right: Totals */}
        <div className="w-64 ml-auto">
          <div className="border-t-2 border-gray-800 pt-3 flex justify-between items-center">
            <span className="font-bold text-base text-gray-800">Grand Total:</span>
            <span className="font-bold text-base" style={{ color: accentColor }}>
              {formatCurrency(data.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      {(data.companyFooter.companyName || data.companyFooter.address || data.companyFooter.officePhone || data.companyFooter.websiteEmail) && (
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>
            {[
              data.companyFooter.companyName,
              data.companyFooter.address,
              data.companyFooter.officePhone,
              data.companyFooter.websiteEmail,
            ].filter(Boolean).join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}
