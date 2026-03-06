import { Injectable } from '@nestjs/common';

/**
 * Simple PDF generator for invoices
 * Creates a basic PDF with invoice details
 */
@Injectable()
export class InvoicePdfService {
  /**
   * Generate a simple HTML invoice that can be converted to PDF
   */
  generateInvoiceHtml(invoice: any, companyFooter?: any): string {
    const invoiceNumber = invoice.invoiceNumber || 'INV-000';
    const issueDate = new Date(invoice.issueDate).toLocaleDateString();
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    const total = invoice.total?.toFixed(2) || '0.00';
    const subtotal = invoice.subtotal?.toFixed(2) || '0.00';
    const tax = invoice.tax?.toFixed(2) || '0.00';
    const currency = invoice.currency || 'KWD';

    const companyName = companyFooter?.companyName || 'VAYPR';
    const phone = companyFooter?.officePhone || '';
    const address = companyFooter?.address || '';
    const email = companyFooter?.websiteEmail || '';

    const billTo = invoice.billTo || {};
    const clientName = billTo.name || 'Client';

    let itemsHtml = '';
    if (invoice.items && Array.isArray(invoice.items)) {
      itemsHtml = invoice.items
        .map(
          (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description || ''}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity || 0}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${currency} ${(item.unitPrice || 0).toFixed(2)}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${currency} ${(item.amount || 0).toFixed(2)}</td>
        </tr>`,
        )
        .join('');
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #fff;
          }
          .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 40px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
          }
          .company-info h1 {
            margin: 0;
            font-size: 28px;
            color: #6b7280;
            font-weight: normal;
          }
          .company-details {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.8;
            margin-top: 8px;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-details h2 {
            margin: 0;
            font-size: 24px;
            color: #111827;
          }
          .invoice-dates {
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
          }
          .invoice-dates div {
            margin: 4px 0;
          }
          .bill-to {
            margin-bottom: 40px;
          }
          .bill-to h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
          }
          .bill-to-details {
            font-size: 14px;
            color: #111827;
            line-height: 1.8;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
          }
          .items-table th:nth-child(2),
          .items-table th:nth-child(3),
          .items-table th:nth-child(4) {
            text-align: right;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-box {
            width: 280px;
            border-left: 2px solid #e5e7eb;
            padding-left: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .totals-row.total {
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-bottom: 0;
            font-weight: 600;
            font-size: 16px;
            color: #111827;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>${companyName}</h1>
              <div class="company-details">
                ${address ? `<div>${address}</div>` : ''}
                ${phone ? `<div>${phone}</div>` : ''}
                ${email ? `<div>${email}</div>` : ''}
              </div>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <div class="invoice-dates">
                <div><strong>${invoiceNumber}</strong></div>
                <div>Issue Date: ${issueDate}</div>
                <div>Due Date: ${dueDate}</div>
              </div>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To</h3>
            <div class="bill-to-details">
              ${clientName}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>${currency} ${subtotal}</span>
              </div>
              ${tax !== '0.00' ? `<div class="totals-row"><span>Tax:</span><span>${currency} ${tax}</span></div>` : ''}
              <div class="totals-row total">
                <span>Total:</span>
                <span>${currency} ${total}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Powered by VAYPR - Invoice Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
