import { QuoteData, QuoteItem } from "@/types/quote";
import { LogoUpload } from "@/components/invoice/LogoUpload";
import { LogoSizeControl } from "@/components/invoice/LogoSizeControl";
import { CurrencySelect } from "@/components/invoice/CurrencySelect";
import { BillToSection } from "@/components/invoice/BillToSection";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { ItemDetails } from "@/components/invoice/ItemDetails";
import { TotalsSection } from "@/components/invoice/TotalsSection";
import { CompanyFooterSection } from "@/components/invoice/CompanyFooterSection";
import { PaymentMethod } from "@/components/invoice/PaymentMethod";
import { BankAccountSection } from "@/components/invoice/BankAccountSection";
import { PaymentTermsSection } from "@/components/invoice/PaymentTermsSection";
import { InvoiceItem } from "@/types/invoice";

interface QuoteEditFormProps {
  data: QuoteData;
  onChange: (data: QuoteData) => void;
}

export function QuoteEditForm({ data, onChange }: QuoteEditFormProps) {
  // Convert QuoteItems to InvoiceItems for ItemDetails component (both use same structure now)
  const convertedItems: InvoiceItem[] = data.items.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  // Handle item changes from ItemDetails and convert back to QuoteItem
  const handleItemsChange = (invoiceItems: InvoiceItem[]) => {
    const quoteItems: QuoteItem[] = invoiceItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    onChange({ ...data, items: quoteItems });
  };

  return (
    <div className="space-y-4">
      {/* Logo & Currency */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <LogoUpload
          logo={data.logo}
          onLogoChange={(logo) => onChange({ ...data, logo })}
        />
        {data.logo && (
          <LogoSizeControl
            value={data.logoScale}
            onChange={(logoScale) => onChange({ ...data, logoScale })}
          />
        )}
        <div className="border-t border-border pt-6">
          <CurrencySelect
            value={data.currency}
            onChange={(currency, currencySymbol) =>
              onChange({ ...data, currency, currencySymbol })
            }
          />
        </div>
      </section>

      {/* Bill To */}
      <section className="bg-card border border-border rounded-lg p-6">
        <BillToSection
          billTo={data.billTo}
          onChange={(billTo) => onChange({ ...data, billTo })}
        />
      </section>

      {/* Quote Details */}
      <section className="bg-card border border-border rounded-lg p-6">
        <QuoteForm data={data} onChange={onChange} />
      </section>

      {/* Items */}
      <section className="bg-card border border-border rounded-lg p-6">
        <ItemDetails
          items={convertedItems}
          currencySymbol={data.currencySymbol}
          onItemsChange={handleItemsChange}
          hideQuantity={data.hideQuantity}
          hideUnitPrice={data.hideUnitPrice}
          hideTotalCost={data.hideTotalCost}
          onHideQuantityChange={(hideQuantity) => onChange({ ...data, hideQuantity })}
          onHideUnitPriceChange={(hideUnitPrice) => onChange({ ...data, hideUnitPrice })}
          onHideTotalCostChange={(hideTotalCost) => onChange({ ...data, hideTotalCost })}
          tableHeaderColor={data.tableHeaderColor}
          onTableHeaderColorChange={(tableHeaderColor) => onChange({ ...data, tableHeaderColor })}
        />
      </section>

      {/* Payment Terms */}
      <section className="bg-card border border-border rounded-lg p-6">
        <PaymentTermsSection
          showPaymentTerms={data.showPaymentTerms}
          paymentTerms={data.paymentTerms}
          onToggle={(showPaymentTerms) => onChange({ ...data, showPaymentTerms })}
          onChange={(paymentTerms) => onChange({ ...data, paymentTerms })}
        />
      </section>

      {/* Totals */}
      <section className="bg-card border border-border rounded-lg p-6">
        <TotalsSection
          items={convertedItems}
          discount={data.discount}
          deliveryFee={data.deliveryFee}
          currencySymbol={data.currencySymbol}
          currency={data.currency}
          onDiscountChange={(discount) => onChange({ ...data, discount })}
          onDeliveryFeeChange={(deliveryFee) => onChange({ ...data, deliveryFee })}
          hideSubTotal={data.hideSubTotal}
          useManualGrandTotal={data.useManualGrandTotal}
          manualGrandTotal={data.manualGrandTotal}
          onHideSubTotalChange={(hideSubTotal) => onChange({ ...data, hideSubTotal })}
          onUseManualGrandTotalChange={(useManualGrandTotal) => onChange({ ...data, useManualGrandTotal })}
          onManualGrandTotalChange={(manualGrandTotal) => onChange({ ...data, manualGrandTotal })}
        />
      </section>

      {/* Company Footer */}
      <section className="bg-card border border-border rounded-lg p-6">
        <CompanyFooterSection
          footer={data.companyFooter}
          onChange={(companyFooter) => onChange({ ...data, companyFooter })}
        />
      </section>

      {/* Payment Method */}
      <section className="bg-card border border-border rounded-lg p-6">
        <PaymentMethod
          showPaymentMethod={data.showPaymentMethod}
          paymentMethodType={data.paymentMethodType}
          onToggle={(showPaymentMethod) => onChange({ ...data, showPaymentMethod })}
          onMethodChange={(paymentMethodType) => onChange({ ...data, paymentMethodType })}
        />
      </section>

      {/* Bank Account Details */}
      <section className="bg-card border border-border rounded-lg p-6">
        <BankAccountSection
          showBankAccount={data.showBankAccount}
          bankAccount={data.bankAccount}
          onToggle={(showBankAccount) => onChange({ ...data, showBankAccount })}
          onChange={(bankAccount) => onChange({ ...data, bankAccount })}
        />
      </section>
    </div>
  );
}
