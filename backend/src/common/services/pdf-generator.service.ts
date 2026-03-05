import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

/**
 * PDF generation service for recurring auto-mails.
 * Primary path uses Chromium HTML rendering to match frontend/manual output.
 */
@Injectable()
export class PdfGeneratorService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorService.name);

  onModuleDestroy() {
    // No persistent resources to clean up.
  }

  async generateInvoicePdf(invoice: any): Promise<string> {
    try {
      const html = this.buildInvoiceHtml(invoice);
      const pdfBuffer = await this.renderPdfWithChromium(html);
      const base64Content = pdfBuffer.toString('base64');
      this.logger.log(`[PDF Generator] Generated Chromium PDF for: ${invoice.invoiceNumber}`);
      return base64Content;
    } catch (error: any) {
      this.logger.error(
        `[PDF Generator] Chromium PDF failed for ${invoice?.invoiceNumber}: ${error?.message || error}`,
        error?.stack,
      );
      this.logger.warn('[PDF Generator] Falling back to minimal PDF renderer');

      const fallbackPdf = this.buildFallbackPdf(invoice);
      const base64Content = fallbackPdf.toString('base64');
      this.logger.log(`[PDF Generator] Generated fallback PDF for: ${invoice.invoiceNumber}`);
      return base64Content;
    }
  }

  private async renderPdfWithChromium(html: string): Promise<Buffer> {
    const detectedExecutablePath = this.getChromiumExecutablePath();

    // Log env-var state to aid Railway debugging.
    this.logger.log(
      `[PDF Generator] PLAYWRIGHT_BROWSERS_PATH=${process.env.PLAYWRIGHT_BROWSERS_PATH ?? '(unset)'} ` +
      `CHROMIUM_EXECUTABLE_PATH=${process.env.CHROMIUM_EXECUTABLE_PATH ?? '(unset)'}`,
    );

    // Build attempt list: skip detected-path attempt when it's the same as the
    // Playwright default to avoid duplicate failures.
    const attempts: Array<{ executablePath: string | undefined; label: string }> = [];
    if (detectedExecutablePath) {
      attempts.push({ executablePath: detectedExecutablePath, label: `detected-path:${detectedExecutablePath}` });
    }
    // Always include the Playwright-default resolution as a final attempt.
    attempts.push({ executablePath: undefined, label: 'playwright-default' });

    let lastError: any;

    for (const attempt of attempts) {
      let browser: any;
      try {
        this.logger.log(`[PDF Generator] Chromium launch attempt: ${attempt.label}`);
        browser = await chromium.launch({
          headless: true,
          executablePath: attempt.executablePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--single-process',
          ],
        });

        const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });

        // Use 'domcontentloaded' instead of 'networkidle' so that external
        // image loads (e.g. Cloudinary logos) don't block or time out PDF
        // generation in Railway's environment.
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.emulateMedia({ media: 'screen' });

        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          preferCSSPageSize: true,
        });

        this.logger.log(`[PDF Generator] Chromium launch success via: ${attempt.label}`);
        return Buffer.from(pdf);
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `[PDF Generator] Chromium launch attempt failed (${attempt.label}): ${error?.message || error}`,
        );
      } finally {
        if (browser) {
          try { await browser.close(); } catch { /* ignore close errors */ }
        }
      }
    }

    throw lastError || new Error('All Chromium launch attempts failed');
  }

  private getChromiumExecutablePath(): string | undefined {
    // Let Playwright use its bundled browser first if available.
    // If unavailable in production (common on some Railway builds), try system Chromium paths.
    const candidates: string[] = [];

    try {
      const playwrightBundledPath = chromium.executablePath();
      if (playwrightBundledPath) {
        candidates.push(playwrightBundledPath);
      }
    } catch {
      // Ignore and continue with env/system candidates.
    }

    const envPath = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
    if (envPath) {
      candidates.push(envPath);
    }

    candidates.push(
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
    );

    for (const candidate of candidates) {
      if (candidate && existsSync(candidate)) {
        return candidate;
      }
    }

    try {
      const whichPath = execSync(
        'which chromium || which chromium-browser || which google-chrome || which google-chrome-stable',
        { stdio: ['ignore', 'pipe', 'ignore'] },
      )
        .toString()
        .trim()
        .split('\n')[0];
      if (whichPath && existsSync(whichPath)) {
        return whichPath;
      }
    } catch {
      // Ignore and allow Playwright default behavior.
    }

    return undefined;
  }

  private buildInvoiceHtml(invoice: any): string {
    const safe = (v: any) => this.escapeHtml(String(v ?? ''));
    const currency = safe(invoice.currency || 'KWD');
    const invoiceNumber = safe(invoice.invoiceNumber || '---');
    const invoiceDate = safe(this.formatDateDMY(invoice.issueDate || new Date()));

    const billTo = invoice.billTo || {};
    const companyFooter = invoice.companyFooter || {};
    const bankAccount = invoice.bankAccount || {};

    const logoUrl = typeof invoice.logo === 'string' ? invoice.logo.trim() : '';
    const logoScale = Number(invoice.logoScale || 1);

    const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
    const items = rawItems.map((item: any, idx: number) => ({
      id: item?.id || `row-${idx}`,
      description: safe(item?.description || ''),
      quantity: Number(item?.quantity || 0),
      unitPrice: Number(item?.unitPrice || 0),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = Number(invoice.discount || 0);
    const deliveryFee = Number(invoice.deliveryFee || 0);
    const discountAmount = (subtotal * discount) / 100;
    const calculatedGrandTotal = subtotal - discountAmount + deliveryFee;

    const normalizedManualGrandTotal = Number(invoice.manualGrandTotal || 0);
    const hasQuantifiableItems = items.some((item) => item.quantity > 0 || item.unitPrice > 0);
    const useManualGrandTotal =
      Boolean(invoice.useManualGrandTotal) && (normalizedManualGrandTotal > 0 || !hasQuantifiableItems);
    const grandTotal = useManualGrandTotal ? normalizedManualGrandTotal : calculatedGrandTotal;

    const showPaymentMethod = Boolean(invoice.showPaymentMethod);
    const showPaymentTerms = Boolean(invoice.showPaymentTerms) && !!invoice.paymentTerms;
    const showBankAccount =
      Boolean(invoice.showBankAccount) &&
      (Boolean(bankAccount.bankName) || Boolean(bankAccount.accountName) || Boolean(bankAccount.iban));

    const hideQuantity = Boolean(invoice.hideQuantity);
    const hideUnitPrice = Boolean(invoice.hideUnitPrice);
    const hideTotalCost = Boolean(invoice.hideTotalCost);
    const hideSubTotal = Boolean(invoice.hideSubTotal);

    const showQuantity = !hideQuantity;
    const showUnitPrice = !hideUnitPrice;
    const showTotalCost = !hideTotalCost;

    const tableHeaderColor =
      typeof invoice.tableHeaderColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(invoice.tableHeaderColor.trim())
        ? invoice.tableHeaderColor.trim()
        : '#000000';

    const visibleCols = [showQuantity, showUnitPrice, showTotalCost].filter(Boolean).length;
    const colWidths =
      visibleCols === 0
        ? { desc: '100%', qty: '0%', price: '0%', total: '0%' }
        : visibleCols === 1
          ? {
              desc: '65%',
              qty: showQuantity ? '35%' : '0%',
              price: showUnitPrice ? '35%' : '0%',
              total: showTotalCost ? '35%' : '0%',
            }
          : visibleCols === 2
            ? {
                desc: '50%',
                qty: showQuantity ? '25%' : '0%',
                price: showUnitPrice ? '25%' : '0%',
                total: showTotalCost ? '25%' : '0%',
              }
            : { desc: '40%', qty: '20%', price: '20%', total: '20%' };

    const formatCurrency = (amount: number) => `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;

    const billToAddress = [
      billTo.area,
      billTo.block ? `Block ${billTo.block}` : '',
      billTo.street ? `Street ${billTo.street}` : '',
      billTo.house ? `House ${billTo.house}` : '',
    ]
      .filter(Boolean)
      .map((x: string) => safe(x))
      .join(' / ');

    const paymentMethodLabel = this.getPaymentMethodLabel(invoice.paymentMethodType);

    const itemsRows =
      items.length === 0
        ? `<tr><td colspan="4" class="empty-row">No items added</td></tr>`
        : items
            .map(
              (item) => `
          <tr class="item-row">
            <td class="td desc">${item.description || '-'}</td>
            <td class="td qty ${showQuantity ? '' : 'hidden-col'}">${showQuantity ? item.quantity : ''}</td>
            <td class="td price ${showUnitPrice ? '' : 'hidden-col'}">${showUnitPrice ? formatCurrency(item.unitPrice) : ''}</td>
            <td class="td total ${showTotalCost ? '' : 'hidden-col'}">${showTotalCost ? formatCurrency(item.quantity * item.unitPrice) : ''}</td>
          </tr>`,
            )
            .join('');

    const footerExtras = [companyFooter.address, companyFooter.officePhone, companyFooter.websiteEmail]
      .filter(Boolean)
      .map((x: string) => safe(x));

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ffffff;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      font-size: 14px;
    }
    .page {
      width: 794px;
      min-height: 1123px;
      padding: 28px 36px;
      margin: 0 auto;
      background: #ffffff;
    }
    .card {
      background: #ffffff;
      padding: 20px;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .logo-wrap { max-width: 200px; }
    .logo {
      max-width: 200px;
      width: auto;
      height: auto;
      object-fit: contain;
      transform-origin: top left;
    }
    .logo-placeholder {
      height: 80px;
      width: 160px;
      border-radius: 6px;
      background: #f3f4f6;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
    }
    .company-name { font-size: 30px; font-weight: 700; margin: 0; }

    .meta { text-align: right; }
    .title { font-size: 42px; font-weight: 700; line-height: 1; margin: 0 0 10px 0; color: ${tableHeaderColor}; }
    .meta-row { font-size: 24px; line-height: 1.3; }
    .meta-muted { color: #6b7280; }
    .meta-strong { font-weight: 600; }

    .bill-box {
      background: rgba(243, 244, 246, 0.55);
      border-radius: 2px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .bill-title { font-weight: 700; font-size: 24px; margin: 0 0 10px 0; }
    .bill-line { font-size: 16px; line-height: 1.4; margin: 0; }

    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; margin-bottom: 26px; }
    col.desc { width: ${colWidths.desc}; }
    col.qty { width: ${colWidths.qty}; }
    col.price { width: ${colWidths.price}; }
    col.total { width: ${colWidths.total}; }
    thead tr { background: ${tableHeaderColor}; color: #ffffff; }
    th { text-align: left; padding: 12px 14px; font-size: 14px; font-weight: 600; }
    th.qty, td.qty { text-align: center; }
    th.price, td.price, th.total, td.total { text-align: right; }
    .td { padding: 14px; border-bottom: 1px solid #e5e7eb; font-size: 16px; vertical-align: top; word-break: break-word; }
    .hidden-col { padding: 0 !important; font-size: 0 !important; line-height: 0 !important; border: none !important; overflow: hidden !important; }
    .empty-row { padding: 24px; text-align: center; color: #6b7280; border-bottom: 1px solid #e5e7eb; }

    .bottom-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 26px; }
    .left { max-width: 55%; min-width: 0; }
    .section-title { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; }
    .section-text { margin: 0 0 8px 0; font-size: 16px; }
    .box {
      background: rgba(243, 244, 246, 0.35);
      border: 1px solid rgba(229, 231, 235, 0.7);
      border-radius: 6px;
      padding: 10px;
      margin-top: 8px;
    }
    .box h4 { margin: 0 0 6px 0; font-size: 14px; }
    .box p { margin: 0 0 2px 0; font-size: 12px; }

    .totals { text-align: right; font-size: 15px; }
    .tot-row { display: flex; justify-content: flex-end; gap: 16px; margin-bottom: 4px; white-space: nowrap; }
    .tot-muted { color: #6b7280; }
    .grand { font-weight: 700; font-size: 16px; }
    .grand .value { color: ${tableHeaderColor}; }

    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 18px;
      margin-top: 34px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      line-height: 1.5;
      word-break: break-word;
    }
    .footer strong { color: #111827; }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="header">
        <div class="logo-wrap">
          ${logoUrl
            ? `<img class="logo" src="${safe(logoUrl)}" style="max-height: ${Math.max(2, 6 * (Number.isFinite(logoScale) ? logoScale : 1))}rem; transform: scale(${Number.isFinite(logoScale) ? logoScale : 1});" />`
            : companyFooter.companyName
              ? `<h1 class="company-name">${safe(companyFooter.companyName)}</h1>`
              : `<div class="logo-placeholder">Your Logo</div>`}
        </div>

        <div class="meta">
          <h2 class="title">Invoice</h2>
          <div class="meta-row"><span class="meta-muted">Invoice#: </span><span class="meta-strong">${invoiceNumber}</span></div>
          <div class="meta-row"><span class="meta-muted">Invoice Date: </span>${invoiceDate}</div>
        </div>
      </div>

      <div class="bill-box">
        <p class="bill-title">Billed to</p>
        <p class="bill-line">${safe(billTo.name || 'Customer Name')}</p>
        ${billToAddress ? `<p class="bill-line">${billToAddress}</p>` : ''}
        ${billTo.phone ? `<p class="bill-line">${safe(billTo.phone)}</p>` : ''}
        ${billTo.other ? `<p class="bill-line">${safe(billTo.other)}</p>` : ''}
      </div>

      <table>
        <colgroup>
          <col class="desc" />
          <col class="qty" />
          <col class="price" />
          <col class="total" />
        </colgroup>
        <thead>
          <tr>
            <th>Item description</th>
            <th class="qty ${showQuantity ? '' : 'hidden-col'}">${showQuantity ? 'Qty.' : ''}</th>
            <th class="price ${showUnitPrice ? '' : 'hidden-col'}">${showUnitPrice ? 'Unit Price' : ''}</th>
            <th class="total ${showTotalCost ? '' : 'hidden-col'}">${showTotalCost ? 'Total Cost' : ''}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="bottom-row">
        <div class="left">
          ${showPaymentMethod
            ? `<p class="section-title">Payment Method</p><p class="section-text">${safe(paymentMethodLabel)}</p>`
            : ''}

          ${showPaymentTerms
            ? `<div class="box"><h4>Payment Terms</h4><p style="white-space: pre-wrap;">${safe(invoice.paymentTerms)}</p></div>`
            : ''}

          ${showBankAccount
            ? `<div class="box"><h4>Bank Transfer Details</h4>
                ${bankAccount.bankName ? `<p><span class="tot-muted">Bank: </span>${safe(bankAccount.bankName)}</p>` : ''}
                ${bankAccount.accountName ? `<p><span class="tot-muted">Account: </span>${safe(bankAccount.accountName)}</p>` : ''}
                ${bankAccount.iban ? `<p><span class="tot-muted">IBAN: </span>${safe(bankAccount.iban)}</p>` : ''}
              </div>`
            : ''}
        </div>

        <div class="totals">
          ${!hideSubTotal && !useManualGrandTotal
            ? `<div class="tot-row"><span class="tot-muted">Sub Total:</span><span>${formatCurrency(subtotal)}</span></div>`
            : ''}
          ${!useManualGrandTotal && discount > 0
            ? `<div class="tot-row"><span class="tot-muted">Discount (${discount}%):</span><span>-${formatCurrency(discountAmount)}</span></div>`
            : ''}
          ${!useManualGrandTotal && deliveryFee > 0
            ? `<div class="tot-row"><span class="tot-muted">Delivery Fee:</span><span>${formatCurrency(deliveryFee)}</span></div>`
            : ''}
          <div class="tot-row grand"><span>Grand Total:</span><span class="value">${formatCurrency(grandTotal)}</span></div>
        </div>
      </div>

      ${(companyFooter.companyName || footerExtras.length > 0)
        ? `<div class="footer">
            ${companyFooter.companyName ? `<strong>${safe(companyFooter.companyName)}</strong>` : ''}
            ${footerExtras.length > 0 ? ` <span>• ${footerExtras.join(' • ')}</span>` : ''}
          </div>`
        : ''}
    </div>
  </div>
</body>
</html>`;
  }

  private getPaymentMethodLabel(value: any): string {
    switch (String(value || '').toLowerCase()) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cheque':
        return 'Cheque';
      case 'online_payment':
        return 'Online Payment';
      default:
        return value ? String(value) : 'Cash';
    }
  }

  private buildFallbackPdf(invoice: any): Buffer {
    // Minimal plain fallback only when Chromium fails at runtime.
    const lines = [
      'INVOICE',
      `No: ${this.safeText(invoice.invoiceNumber || 'INV-000')}`,
      `Date: ${this.formatDateDMY(invoice.issueDate || new Date())}`,
      '',
      `Bill To: ${this.safeText(invoice?.billTo?.name || 'Client')}`,
      '',
    ];

    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    if (!items.length) {
      lines.push('No items');
    } else {
      for (const item of items.slice(0, 20)) {
        lines.push(
          `- ${this.safeText(item?.description || 'Item')} | ${Number(item?.quantity || 0)} x ${Number(item?.unitPrice || 0).toFixed(2)}`,
        );
      }
    }

    lines.push('');
    lines.push(`Total: ${this.safeText(invoice?.currency || 'KWD')} ${Number(invoice?.total || 0).toFixed(2)}`);

    const content = [
      'BT',
      '/F1 11 Tf',
      '14 TL',
      '48 790 Td',
      ...lines.map((line, idx) => `${idx === 0 ? '' : 'T* '}(${this.escapePdfText(line)}) Tj`),
      'ET',
    ].join('\n');

    const objects: string[] = [];
    const addObj = (no: number, body: string) => objects.push(`${no} 0 obj\n${body}\nendobj\n`);

    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>');
    addObj(4, `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
    addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += object;
    }

    const xref = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    return Buffer.from(pdf, 'utf8');
  }

  private formatDateDMY(value: any): string {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private safeText(value: any): string {
    return String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapePdfText(text: string): string {
    return this.safeText(text)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}
