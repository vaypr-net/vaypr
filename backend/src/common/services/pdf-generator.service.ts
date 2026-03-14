import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * PDF generation service for recurring auto-mails.
 * Uses PDFKit (pure Node.js) — no Chromium, no browser, no system dependencies.
 * Works reliably on Railway and any containerized environment.
 */
@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateInvoicePdf(invoice: any): Promise<string> {
    try {
      const pdfBuffer = await this.buildPdfWithPdfKit(invoice);
      const base64Content = pdfBuffer.toString('base64');
      this.logger.log(`[PDF Generator] Generated PDFKit PDF for: ${invoice.invoiceNumber}`);
      return base64Content;
    } catch (error: any) {
      this.logger.error(
        `[PDF Generator] PDFKit FAILED for ${invoice?.invoiceNumber}: ${error?.message || error}`,
        error?.stack,
      );
      this.logger.warn('[PDF Generator] Falling back to minimal PDF attachment');
      return this.buildEmergencyPdfBase64(invoice);
    }
  }

  private async buildPdfWithPdfKit(invoice: any): Promise<Buffer> {
    // Fetch logo asynchronously BEFORE creating the PDF stream
    let logoBuffer: Buffer | null = null;
    const logoUrl = typeof invoice?.logo === 'string' ? invoice.logo.trim() : '';
    this.logger.log(
      `[PDF Generator] Invoice: ${invoice?.invoiceNumber || 'unknown'} | Logo URL from DB: ${logoUrl || '(none)'}`,
    );
    if (logoUrl) {
      const candidates = this.getLogoCandidates(logoUrl);
      this.logger.log(
        `[PDF Generator] Trying ${candidates.length} candidate(s):\n  1) ${candidates.join('\n  2) ')}`,
      );
      for (const candidate of candidates) {
        try {
          logoBuffer = await this.fetchImageBuffer(candidate);
          this.logger.log(
            `[PDF Generator] Logo loaded for ${invoice?.invoiceNumber || 'invoice'} from: ${candidate}`,
          );
          break;
        } catch (e: any) {
          this.logger.warn(
            `[PDF Generator] Logo candidate failed for ${invoice?.invoiceNumber || 'invoice'}: ${candidate} — ${e?.message || e}`,
          );
        }
      }
      if (!logoBuffer) {
        this.logger.warn(
          `[PDF Generator] Could not load logo for ${invoice?.invoiceNumber || 'invoice'} from URL: ${logoUrl}`,
        );
      }
    }

    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 0 });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderInvoiceSync(doc, invoice, logoBuffer);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderInvoiceSync(doc: any, invoice: any, logoBuffer: Buffer | null): void {
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 36;
    const CW = PAGE_W - MARGIN * 2; // content width

    const rawColor = (invoice.tableHeaderColor || '#000000').trim();
    const headerColor = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : '#000000';

    const currency = String(invoice.currency || 'KWD');
    const invoiceNumber = String(invoice.invoiceNumber || '---');
    const invoiceDate = this.formatDateDMY(invoice.issueDate || new Date());

    const cf = invoice.companyFooter || {};
    const bt = invoice.billTo || {};
    const ba = invoice.bankAccount || {};

    const showQty   = !invoice.hideQuantity;
    const showPrice = !invoice.hideUnitPrice;
    const showTotal = !invoice.hideTotalCost;
    const hideSubTotal = Boolean(invoice.hideSubTotal);

    const rawItems: any[] = Array.isArray(invoice.items) ? invoice.items : [];
    const items = rawItems.map((it: any) => ({
      description: String(it?.description || ''),
      quantity:    Number(it?.quantity  || 0),
      unitPrice:   Number(it?.unitPrice || 0),
    }));

    const subtotal    = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount    = Number(invoice.discount    || 0);
    const delivery    = Number(invoice.deliveryFee || 0);
    const discAmt     = (subtotal * discount) / 100;
    const calcTotal   = subtotal - discAmt + delivery;
    const manualTotal = Number(invoice.manualGrandTotal || 0);
    const hasQItems   = items.some(i => i.quantity > 0 || i.unitPrice > 0);
    const useManual   = Boolean(invoice.useManualGrandTotal) && (manualTotal > 0 || !hasQItems);
    const grandTotal  = useManual ? manualTotal : calcTotal;
    const fmt = (n: number) => `${currency} ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

    // ── White page background ──────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#ffffff');
    let y = MARGIN;

    // ── HEADER ────────────────────────────────────────────────────────────
    const logoScale = Math.max(0.1, Math.min(3, Number(invoice.logoScale) || 1));
    const logoBoxW = 200;
    const logoBoxH = Math.max(40, Math.min(180, 96 * logoScale));

    // Left: logo (pre-fetched) or company name
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MARGIN, y, {
          fit: [logoBoxW, logoBoxH],
          align: 'left',
          valign: 'top',
        });
      } catch (error: any) {
        // Log the ACTUAL PDFKit render error (e.g. CMYK JPEG, progressive JPEG)
        this.logger.warn(
          `[PDF Generator] PDFKit failed to render logo for ${invoice?.invoiceNumber}: ${error?.message || error}. Falling back to company name.`,
        );
        if (cf.companyName) {
          doc.font('Helvetica').fontSize(18).fillColor('#6b7280')
            .text(cf.companyName, MARGIN, y + 4, { width: 200 });
        }
      }
    } else if (cf.companyName) {
      doc.font('Helvetica').fontSize(18).fillColor('#6b7280')
        .text(cf.companyName, MARGIN, y + 4, { width: 200 });
    }

    // Right: "Invoice" + number + date (drawn separately, no continued)
    doc.font('Helvetica-Bold').fontSize(34).fillColor(headerColor)
      .text('Invoice', MARGIN, y, { width: CW, align: 'right' });

    doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
      .text(`Invoice#: ${invoiceNumber}`, MARGIN, y + 44, { width: CW, align: 'right' });

    doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
      .text(`Invoice Date: ${invoiceDate}`, MARGIN, y + 58, { width: CW, align: 'right' });

    y += Math.max(logoBoxH, 78) + 14;

    // Divider
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
      .strokeColor('#e5e7eb').lineWidth(1).stroke();
    y += 14;

    // ── BILL TO box ───────────────────────────────────────────────────────
    const billLines: string[] = [];
    if (bt.name) billLines.push(bt.name);
    const addr = [bt.area, bt.block && `Block ${bt.block}`, bt.street && `Street ${bt.street}`, bt.house && `House ${bt.house}`].filter(Boolean);
    if (addr.length) billLines.push((addr as string[]).join(' / '));
    if (bt.phone) billLines.push(bt.phone);
    if (bt.other) billLines.push(bt.other);

    const BP = 12;
    const textWidth = CW - BP * 2;
    // Measure actual height of each line (accounts for text wrapping)
    doc.font('Helvetica').fontSize(11);
    const billLineHeights = billLines.map((line) =>
      Math.max(16, doc.heightOfString(line, { width: textWidth }) + 4),
    );
    const billTextH = billLineHeights.reduce((s, h) => s + h, 0);
    const billH = BP * 2 + 18 + billTextH;
    doc.rect(MARGIN, y, CW, billH).fill('#f3f4f6');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827')
      .text('Billed to', MARGIN + BP, y + BP);
    let billY = y + BP + 18;
    doc.font('Helvetica').fontSize(11).fillColor('#374151');
    for (let i = 0; i < billLines.length; i++) {
      doc.text(billLines[i], MARGIN + BP, billY, { width: textWidth });
      billY += billLineHeights[i];
    }
    y += billH + 16;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────
    const visCols = [showQty, showPrice, showTotal].filter(Boolean).length;
    const dW = CW * (visCols === 0 ? 1 : visCols === 1 ? 0.6 : visCols === 2 ? 0.5 : 0.4);
    const oW = visCols === 0 ? 0 : (CW - dW) / visCols;
    const qX = MARGIN + dW;
    const pX = qX + (showQty   ? oW : 0);
    const tX = pX + (showPrice ? oW : 0);

    // Table header row
    const TH = 24;
    doc.rect(MARGIN, y, CW, TH).fill(headerColor);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('Item description', MARGIN + 8, y + 8, { width: dW - 12 });
    if (showQty)   doc.text('Qty.',       qX,     y + 8, { width: oW - 4, align: 'center' });
    if (showPrice) doc.text('Unit Price', pX,     y + 8, { width: oW - 8, align: 'right' });
    if (showTotal) doc.text('Total Cost', tX,     y + 8, { width: oW - 8, align: 'right' });
    y += TH;

    // Item rows
    if (items.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280')
        .text('No items added', MARGIN, y + 8, { width: CW, align: 'center' });
      doc.moveTo(MARGIN, y + 26).lineTo(PAGE_W - MARGIN, y + 26).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 28;
    } else {
      for (const item of items) {
        const descH = doc.heightOfString(item.description || '-', { width: dW - 16 }) || 14;
        const rH = Math.max(28, descH + 14);
        doc.font('Helvetica').fontSize(11).fillColor('#111827');
        doc.text(item.description || '-', MARGIN + 8, y + 7, { width: dW - 16 });
        if (showQty)   doc.text(String(item.quantity),          qX, y + 7, { width: oW - 4, align: 'center' });
        if (showPrice) doc.text(fmt(item.unitPrice),            pX, y + 7, { width: oW - 8, align: 'right'  });
        if (showTotal) doc.text(fmt(item.quantity * item.unitPrice), tX, y + 7, { width: oW - 8, align: 'right' });
        doc.moveTo(MARGIN, y + rH).lineTo(PAGE_W - MARGIN, y + rH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        y += rH;
      }
    }
    y += 14;

    // ── BOTTOM SECTION ────────────────────────────────────────────────────
    const lW = CW * 0.52;
    const rW = CW * 0.44;
    const rX = MARGIN + CW - rW;
    let lY = y;
    let rY = y;

    // Left: payment method
    if (invoice.showPaymentMethod && invoice.paymentMethodType) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Payment Method', MARGIN, lY);
      lY += 17;
      doc.font('Helvetica').fontSize(10).fillColor('#374151').text(this.getPaymentMethodLabel(invoice.paymentMethodType), MARGIN, lY);
      lY += 20;
    }

    // Left: payment terms
    if (invoice.showPaymentTerms && invoice.paymentTerms) {
      const ptLines = String(invoice.paymentTerms);
      const ptH = 14 + (doc.heightOfString(ptLines, { width: lW - 20 }) || 12) + 8;
      doc.rect(MARGIN, lY, lW, ptH).fill('#f9fafb').stroke('#e5e7eb');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('Payment Terms', MARGIN + 8, lY + 7);
      lY += 20;
      doc.font('Helvetica').fontSize(9).fillColor('#374151').text(ptLines, MARGIN + 8, lY, { width: lW - 16 });
      lY += (doc.heightOfString(ptLines, { width: lW - 16 }) || 12) + 10;
    }

    // Left: bank details
    const showBank = Boolean(invoice.showBankAccount) && (ba.bankName || ba.accountName || ba.iban);
    if (showBank) {
      const bkLines = [ba.bankName && `Bank: ${ba.bankName}`, ba.accountName && `Account: ${ba.accountName}`, ba.iban && `IBAN: ${ba.iban}`].filter(Boolean) as string[];
      const bkH = 14 + bkLines.length * 14 + 8;
      doc.rect(MARGIN, lY, lW, bkH).fill('#f9fafb').stroke('#e5e7eb');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('Bank Transfer Details', MARGIN + 8, lY + 7);
      let bkY = lY + 20;
      doc.font('Helvetica').fontSize(9).fillColor('#374151');
      for (const l of bkLines) { doc.text(l, MARGIN + 8, bkY, { width: lW - 16 }); bkY += 14; }
      lY = bkY + 6;
    }

    // Right: totals — each line drawn independently (no continued:true)
    const ROW_H = 17;
    doc.font('Helvetica').fontSize(10);
    if (!hideSubTotal && !useManual) {
      doc.fillColor('#6b7280').text('Sub Total:',     rX, rY, { width: rW * 0.55 });
      doc.fillColor('#111827').text(fmt(subtotal),    rX + rW * 0.55, rY, { width: rW * 0.45, align: 'right' });
      rY += ROW_H;
    }
    if (!useManual && discount > 0) {
      doc.fillColor('#6b7280').text(`Discount (${discount}%):`, rX, rY, { width: rW * 0.55 });
      doc.fillColor('#111827').text(`-${fmt(discAmt)}`,         rX + rW * 0.55, rY, { width: rW * 0.45, align: 'right' });
      rY += ROW_H;
    }
    if (!useManual && delivery > 0) {
      doc.fillColor('#6b7280').text('Delivery Fee:',  rX, rY, { width: rW * 0.55 });
      doc.fillColor('#111827').text(fmt(delivery),    rX + rW * 0.55, rY, { width: rW * 0.45, align: 'right' });
      rY += ROW_H + 2;
    }
    doc.font('Helvetica-Bold').fontSize(12);
    doc.fillColor('#111827').text('Grand Total:',   rX, rY, { width: rW * 0.55 });
    doc.fillColor(headerColor).text(fmt(grandTotal), rX + rW * 0.55, rY, { width: rW * 0.45, align: 'right' });
    rY += 22;

    y = Math.max(lY, rY) + 18;

    // ── FOOTER ────────────────────────────────────────────────────────────
    const footerParts = [cf.address, cf.officePhone, cf.websiteEmail].filter(Boolean) as string[];
    if (cf.companyName || footerParts.length > 0) {
      const fY = Math.max(y + 8, PAGE_H - 50);
      doc.moveTo(MARGIN, fY).lineTo(PAGE_W - MARGIN, fY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      const fText = [cf.companyName, ...footerParts].filter(Boolean).join('  •  ');
      doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
        .text(fText, MARGIN, fY + 8, { width: CW, align: 'center' });
    }
  }

  private async fetchImageBuffer(url: string): Promise<Buffer> {
    // Use axios — handles redirects, full-request timeout, better error messages
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'VAYPR-PDF/1.0',
        Accept: 'image/*,*/*;q=0.8',
      },
    });
    return Buffer.from(response.data);
  }

  private getCloudinaryPngUrl(url: string): string | null {
    if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
      return null;
    }

    // Insert f_png transformation right after /image/upload/
    if (url.includes('/image/upload/f_png/')) {
      return url;
    }
    return url.replace('/image/upload/', '/image/upload/f_png/');
  }

  private getLogoCandidates(url: string): string[] {
    const out: string[] = [];

    const cloudinaryPng = this.getCloudinaryPngUrl(url);
    if (cloudinaryPng) {
      // PNG variants FIRST — PDFKit handles PNG reliably regardless of
      // original JPEG encoding (CMYK, progressive, etc.)
      out.push(cloudinaryPng.replace('/image/upload/f_png/', '/image/upload/f_png,fl_preserve_transparency/'));
      out.push(cloudinaryPng.replace('/image/upload/f_png/', '/image/upload/f_png,q_100/'));
      out.push(cloudinaryPng);
    }

    // Original as final fallback
    if (url) out.push(url);

    // De-duplicate candidates
    return [...new Set(out)];
  }

  private getPaymentMethodLabel(value: any): string {
    switch (String(value || '').toLowerCase()) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      case 'online_payment': return 'Online Payment';
      default: return value ? String(value) : 'Cash';
    }
  }

  private formatDateDMY(value: any): string {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private buildEmergencyPdfBase64(invoice: any): string {
    const lines = [
      'INVOICE',
      `No: ${String(invoice?.invoiceNumber || 'INV-000')}`,
      `Date: ${this.formatDateDMY(invoice?.issueDate || new Date())}`,
      '',
      `Bill To: ${String(invoice?.billTo?.name || 'Client')}`,
      '',
      `Total: ${String(invoice?.currency || 'KWD')} ${Number(invoice?.total || 0).toFixed(2)}`,
    ];

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

    return Buffer.from(pdf, 'utf8').toString('base64');
  }

  private escapePdfText(text: string): string {
    return String(text ?? '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}
