// Quick test for PDF generation
const PDFDocument = require('pdfkit');

const invoice = {
  invoiceNumber: 'INV-001',
  tableHeaderColor: '#2563eb',
  currency: 'KWD',
  issueDate: new Date(),
  companyFooter: { companyName: 'Upedge Technologies', address: 'Kuwait', officePhone: '+965 000', websiteEmail: 'test@test.com' },
  billTo: { name: 'Ali', phone: '+965 000', area: 'Salmiya', block: '5', street: '12', house: '3' },
  hideQuantity: false,
  hideUnitPrice: false,
  hideTotalCost: false,
  hideSubTotal: false,
  items: [{ description: 'Monthly Plan', quantity: 1, unitPrice: 50 }],
  discount: 10,
  deliveryFee: 5,
  showPaymentMethod: true,
  paymentMethodType: 'bank_transfer',
  showPaymentTerms: true,
  paymentTerms: 'Net 30 days',
  showBankAccount: true,
  bankAccount: { bankName: 'NBK', accountName: 'Ali', iban: 'KW000000' },
  logo: '',
  logoScale: 1,
};

async function run() {
  try {
    // Import the compiled service
    const { PdfGeneratorService } = require('./dist/common/services/pdf-generator.service');
    const svc = new PdfGeneratorService();
    const b64 = await svc.generateInvoicePdf(invoice);
    const buf = Buffer.from(b64, 'base64');
    console.log('SUCCESS via compiled service! size:', buf.length, 'header:', buf.slice(0,4).toString());
    require('fs').writeFileSync('/tmp/test-invoice.pdf', buf);
    console.log('Written to /tmp/test-invoice.pdf');
  } catch(e) {
    console.error('COMPILED SERVICE FAILED:', e.message);
    console.error(e.stack);
    
    // Fallback: test raw PDFKit
    console.log('\nTrying raw PDFKit...');
    await new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('Raw PDFKit OK size:', buf.length, 'header:', buf.slice(0,4).toString());
        resolve(buf);
      });
      doc.on('error', reject);
      doc.rect(0,0,595,841).fill('#ffffff');
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text('Test Invoice', 36, 36);
      doc.end();
    });
  }
}
run().catch(e => console.error('FATAL:', e));
