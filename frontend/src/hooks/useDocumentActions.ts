import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EmailOptions {
  to?: string;
  subject: string;
  body: string;
}

export function useDocumentActions() {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadPDF = useCallback(async (
    elementId: string,
    filename: string,
    onComplete?: () => void
  ) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: 'Error',
        description: 'Could not find document to download',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we generate your document...',
      });

      // Ensure element is visible during capture
      const originalStyle = element.style.display;
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Restore original display
      element.style.display = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${filename}.pdf`);

      toast({
        title: 'Download Complete',
        description: `${filename}.pdf has been downloaded`,
      });

      onComplete?.();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const printPDF = useCallback(async (elementId: string, filename = 'document') => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({ title: 'Error', description: 'Could not find document to print', variant: 'destructive' });
      return;
    }

    try {
      toast({ title: 'Generating Printable PDF', description: 'Preparing document for print without headers...' });

      // Ensure element is visible during capture
      const originalStyle = element.style.display;
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Restore original display
      element.style.display = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Open PDF in a new tab as a blob URL and trigger print on that PDF (browser will not add page URL header/footer)
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) throw new Error('Unable to open new window for printing');

      // Give the PDF viewer a moment to load before triggering print
      setTimeout(() => {
        try {
          newWin.focus();
          newWin.print();
        } catch (e) {
          console.error('Print PDF error:', e);
        }
        // cleanup: revoke object URL after a short delay
        setTimeout(() => {
          try { URL.revokeObjectURL(url); } catch {}
        }, 2000);
      }, 700);
    } catch (error) {
      console.error('Print PDF generation error:', error);
      toast({ title: 'Print Failed', description: 'Could not generate printable PDF', variant: 'destructive' });
    }
  }, [toast]);

  const printDocument = useCallback(async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({ title: 'Error', description: 'Could not find document to print', variant: 'destructive' });
      return;
    }

    try {
      // Create an offscreen iframe to host the printable content in the same tab
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error('Unable to access iframe document for printing');

      // Clone the element to avoid mutating original
      const cloned = element.cloneNode(true) as HTMLElement;

      // Collect stylesheets and style tags to include in iframe
      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((n) => n.outerHTML)
        .join('\n');

      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8">${styleTags}</head><body>${cloned.outerHTML}</body></html>`);
      doc.close();

      // Focus the iframe and trigger print
      const win = iframe.contentWindow;
      if (!win) throw new Error('Unable to access iframe window');

      // Wait briefly to allow styles to load
      setTimeout(() => {
        try {
          win.focus();
          // Use print dialog of iframe (same tab, not a new tab)
          win.print();
        } finally {
          // Remove iframe after a short delay to ensure print dialog opened
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch {}
          }, 500);
        }
      }, 250);
    } catch (error) {
      console.error('Print error:', error);
      toast({ title: 'Print Failed', description: 'Could not open print dialog', variant: 'destructive' });
    }
  }, [toast]);

  const sendEmail = useCallback(({ to, subject, body }: EmailOptions) => {
    const mailtoLink = `mailto:${to || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    
    toast({
      title: 'Email Client Opened',
      description: to ? `Composing email to ${to}` : 'Please enter the recipient email address',
    });
  }, [toast]);

  const openInGenerator = useCallback((
    type: 'invoice' | 'quote' | 'receipt',
    data: object
  ) => {
    // Store data in sessionStorage to pass to generator
    sessionStorage.setItem(`edit_${type}_data`, JSON.stringify(data));
    window.location.href = `/generator?tab=${type}&edit=true`;
  }, []);

  return {
    previewRef,
    downloadPDF,
    printDocument,
    printPDF,
    sendEmail,
    openInGenerator,
  };
}
