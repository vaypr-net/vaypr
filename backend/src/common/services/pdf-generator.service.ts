import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as https from 'https';
import * as http from 'http';

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
        `[PDF Generator] PDFKit failed for ${invoice?.invoiceNumber}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }

  private async buildPdfWithPdfKit(invoice: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          info: {
            Title: `Invoice ${invoice.invoiceNumber || ''}`,
            Author: invoice.companyFooter?.companyName || 'VAYPR',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        await this.renderInvoice(doc, invoice);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async renderInvoice(doc: any, invoice: any): Promise<void> {
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 36;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const rawHeaderColor = invoice.tableHeaderColor || '#000000';
    const headerColor = /^#[0-9A-Fa-f]{6}$/.test(rawHeaderColor.trim()) ? rawHeaderColor.trim() : '#000000';

    const currency = invoice.currency || 'KWD';
    const invoiceNumber = invoice.invoiceNumber || '---';
    const invoiceDate = this.formatDateDMY(invoice.issueDate || new Date());

    const companyFooter = invoice.companyFooter || {};
    const billTo = invoice.billTo || {};
    const bankAccount = invoice.bankAccount || {};

    const showQuantity = !invoice.hideQuantity;
    const showUnitPrice = !invoice.hideUnitPrice;
    const showTotalCost = !invoice.hideTotalCost;
    const hideSubTotal = Boolean(invoice.hideSubTotal);

    const rawItems: any[] = Array.isArray(invoice.items) ? invoice.items : [];
    const items = rawItems.map((item: any) => ({
      description: String(item?.description || ''),
      quantity: Number(item?.quantity || 0),
      unitPrice: Number(item?.unitPrice || 0),
    }));

    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = Number(invoice.discount || 0);
    const deliveryFee = Number(invoice.deliveryFee || 0);
    const discountAmount = (subtotal * discount) / 100;
    const calculatedGrandTotal = subtotal - discountAmount + deliveryFee;
    const normalizedManual = Number(invoice.manualGrandTotal || 0);
    const hasQuantifiable = items.some((i) => i.quantity > 0 || i.unitPrice > 0);
    const useManual = Boolean(invoice.useManualGrandTotal) && (normalizedManual > 0 || !hasQuantifiable);
    const grandTotal = useManual ? normalizedManual : calculatedGrandTotal;
    const fmt = (n: number) => `${currency} ${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`;

    // White background
    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#ffffff');
    let y = MARGIN;

    // ── HEADER ──────────────────────────────────────────────────────────────
    const logoUrl = typeof invoice.logo === 'string' ? invoice.logo.trim() : '';
    const logoScale = Number(invoice.logoScale || 1);
    const logoMaxH = Math.max(20, Math.min(80, 50 * logoScale));
    const headerTopY = y;

    let logoBuffer: Buffer | null = null;
    if (logoUrl) {
      try { logoBuffer = await this.fetchImageBuffer(logoUrl); } catch { logoBuffer = null; }
    }

    if (logoBuffer) {
      doc.image(logoBuffer, MARGIN, headerTopY, { fit: [160, logoMaxH] });
    } else if (companyFooter.companyName) {
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text(companyFooter.companyName, MARGIN, headerTopY + 6, { width: 200 });
    }

    doc.font('Helvetica-Bold').fontSize(36).fillColor(headerColor).text('Invoice', MARGIN, headerTopY, { width: CONTENT_W, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Invoice#:  ', MARGIN, headerTopY + 46, { width: CONTENT_W, align: 'right', continued: true })
      .font('Helvetica-Bold').fillColor('#111827').text(invoiceNumber);
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(`Invoice Date:  ${invoiceDate}`, MARGIN, headerTopY + 62, { width: CONTENT_W, align: 'right' });

    y = headerTopY + Math.max(logoMaxH, 80) + 16;

    // Divider
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    y += 16;

    // ── BILL TO ──────────────────────────────────────────────────────────────
    const billLines: string[] = [];
    if (billTo.name) billLines.push(billTo.name);
    const addrParts = [billTo.area, billTo.block ? `Block ${billTo.block}` : '', billTo.street ? `Street ${billTo.street}` : '', billTo.house ? `House ${billTo.house}` : ''].filter(Boolean);
    if (addrParts.length) billLines.push(addrParts.join(' / '));
    if (billTo.phone) billLines.push(billTo.phone);
    if (billTo.other) billLines.push(billTo.other);

    const BP = 14;
    const billBoxH = BP * 2 + 18 + billLines.length * 16;
    doc.roundedRect(MARGIN, y, CONTENT_W, billBoxH, 3).fill('#f3f4f6');
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Billed to', MARGIN + BP, y + BP);
    let billY = y + BP + 18;
    doc.font('Helvetica').fontSize(11).fillColor('#374151');
    for (const line of billLines) { doc.text(line, MARGIN + BP, billY, { width: CONTENT_W - BP * 2 }); billY += 16; }
    y += billBoxH + 18;

    // ── ITEMS TABLE ──────────────────────────────────────────────────────────
    const visibleCols = [showQuantity, showUnitPrice, showTotalCost].filter(Boolean).length;
    const descW = visibleCols === 0 ? CONTENT_W : visibleCols === 1 ? CONTENT_W * 0.6 : visibleCols === 2 ? CONTENT_W * 0.5 : CONTENT_W * 0.4;
    const otherW = visibleCols === 0 ? 0 : (CONTENT_W - descW) / visibleCols;
    const colX = {
      desc: MARGIN,
      qty: MARGIN + descW,
      price: MARGIN + descW + (showQuantity ? otherW : 0),
      total: MARGIN + descW + (showQuantity ? otherW : 0) + (showUnitPrice ? otherW : 0),
    };

    const TH = 26;
    doc.rect(MARGIN, y, CONTENT_W, TH).fill(headerColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
    doc.text('Item description', colX.desc + 8, y + 8, { width: descW - 12 });
    if (showQuantity) doc.text('Qty.', colX.qty, y + 8, { width: otherW - 4, align: 'center' });
    if (showUnitPrice) doc.text('Unit Price', colX.price, y + 8, { width: otherW - 8, align: 'right' });
    if (showTotalCost) doc.text('Total Cost', colX.total, y + 8, { width: otherW - 8, align: 'right' });
    y += TH;

    if (items.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('No items added', MARGIN + 8, y + 10, { width: CONTENT_W - 16, align: 'center' });
      doc.moveTo(MARGIN, y + 28).lineTo(PAGE_W - MARGIN, y + 28).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 30;
    } else {
      for (const item of items) {
        const rowH = Math.max(30, doc.heightOfString(item.description || '-', { width: descW - 16, fontSize: 11 }) + 16);
        doc.font('Helvetica').fontSize(11).fillColor('#111827');
        doc.text(item.description || '-', colX.desc + 8, y + 8, { width: descW - 16 });
        if (showQuantity) doc.text(String(item.quantity), colX.qty, y + 8, { width: otherW - 4, align: 'center' });
        if (showUnitPrice) doc.text(fmt(item.unitPrice), colX.price, y + 8, { width: otherW - 8, align: 'right' });
        if (showTotalCost) doc.text(fmt(item.quantity * item.unitPrice), colX.total, y + 8, { width: otherW - 8, align: 'right' });
        doc.moveTo(MARGIN, y + rowH).lineTo(PAGE_W - MARGIN, y + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        y += rowH;
      }
    }
    y += 16;

    // ── BOTTOM: Payment left, Totals right ──────────────────────────────────
    const leftColW = CONTENT_W * 0.52;
    const rightColW = CONTENT_W * 0.44;
    const rightColX = MARGIN + CONTENT_W - rightColW;
    let leftY = y;
    let rightY = y;

    if (Boolean(invoice.showPaymentMethod) && invoice.paymentMethodType) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Payment Method', MARGIN, leftY);
      leftY += 18;
      doc.font('Helvetica').fontSize(11).fillColor('#374151').text(this.getPaymentMethodLabel(invoice.paymentMethodType), MARGIN, leftY);
      leftY += 22;
    }

    if (Boolean(invoice.showPaymentTerms) && invoice.paymentTerms) {
      const ptH = 14 + doc.heightOfString(invoice.paymentTerms, { width: leftColW - 20, fontSize: 10 }) + 10;
      doc.roundedRect(MARGIN, leftY, leftColW, ptH, 4).fill('#f9fafb').stroke('#e5e7eb');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Payment Terms', MARGIN + 10, leftY + 8);
      leftY += 22;
      doc.font('Helvetica').fontSize(10).fillColor('#374151').text(invoice.paymentTerms, MARGIN + 10, leftY, { width: leftColW - 20 });
      leftY += doc.heightOfString(invoice.paymentTerms, { width: leftColW - 20, fontSize: 10 }) + 12;
    }

    const showBank = Boolean(invoice.showBankAccount) && (bankAccount.bankName || bankAccount.accountName || bankAccount.iban);
    if (showBank) {
      const bankLines = [bankAccount.bankName && `Bank: ${bankAccount.bankName}`, bankAccount.accountName && `Account: ${bankAccount.accountName}`, bankAccount.iban && `IBAN: ${bankAccount.iban}`].filter(Boolean) as string[];
      const bkH = 14 + bankLines.length * 15 + 10;
      doc.roundedRect(MARGIN, leftY, leftColW, bkH, 4).fill('#f9fafb').stroke('#e5e7eb');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Bank Transfer Details', MARGIN + 10, leftY + 8);
      let bkY = leftY + 22;
      doc.font('Helvetica').fontSize(10).fillColor('#374151');
      for (const l of bankLines) { doc.text(l, MARGIN + 10, bkY); bkY += 15; }
      leftY = bkY + 8;
    }

    // Totals
    const TROH = 18;
    if (!hideSubTotal && !useManual) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text('Sub Total:', rightColX, rightY, { width: rightColW - 4, align: 'right', continued: true }).fillColor('#111827').text(`  ${fmt(subtotal)}`);
      rightY += TROH;
    }
    if (!useManual && discount > 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text(`Discount (${discount}%):`, rightColX, rightY, { width: rightColW - 4, align: 'right', continued: true }).fillColor('#111827').text(`  -${fmt(discountAmount)}`);
      rightY += TROH;
    }
    if (!useManual && deliveryFee > 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text('Delivery Fee:', rightColX, rightY, { width: rightColW - 4, align: 'right', continued: true }).fillColor('#111827').text(`  ${fmt(deliveryFee)}`);
      rightY += TROH + 2;
    }
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Grand Total:', rightColX, rightY, { width: rightColW - 4, align: 'right', continued: true }).fillColor(headerColor).text(`  ${fmt(grandTotal)}`);
    rightY += 24;

    y = Math.max(leftY, rightY) + 20;

    // ── FOOTER ──────────────────────────────────────────────────────────────
    const footerParts = [companyFooter.address, companyFooter.officePhone, companyFooter.websiteEmail].filter(Boolean);
    if (companyFooter.companyName || footerParts.length > 0) {
      const footerY = Math.max(y + 10, PAGE_H - 55);
      doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      const footerText = [companyFooter.companyName, ...footerParts].filter(Boolean).join('  •  ');
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(footerText, MARGIN, footerY + 10, { width: CONTENT_W, align: 'center' });
    }
  }

  private async fetchImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proto = url.startsWith('https') ? https : http;
      const req = proto.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) { reject(new Error(`Image fetch failed: ${res.statusCode}`)); return; }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Image fetch timeout')); });
    });
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
}
