import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EmailOptions {
  to?: string;
  subject: string;
  body: string;
}

interface PdfOptions {
  fitToPage?: boolean;
  fitScale?: number;
}

interface ProtectedRange {
  start: number;
  end: number;
  kind: 'row' | 'block';
}

export function useDocumentActions() {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const findNaturalPageBreak = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    startY: number,
    idealEndY: number,
    maxY: number,
  ): number => {
    const searchRange = 160;
    const minSliceHeight = 220;
    const fromY = Math.max(startY + minSliceHeight, idealEndY - searchRange);
    const toY = Math.min(maxY - 1, idealEndY + searchRange);

    if (fromY >= toY) return idealEndY;

    let bestY = idealEndY;
    let bestScore = -1;
    let bestDistance = Number.MAX_SAFE_INTEGER;

    for (let y = fromY; y <= toY; y += 2) {
      const row = ctx.getImageData(0, y, width, 1).data;
      let whiteCount = 0;
      let sampleCount = 0;

      // Sample every 4th pixel to keep this efficient
      for (let i = 0; i < row.length; i += 16) {
        const r = row[i];
        const g = row[i + 1];
        const b = row[i + 2];
        const a = row[i + 3];
        sampleCount += 1;
        if (a > 245 && r > 245 && g > 245 && b > 245) {
          whiteCount += 1;
        }
      }

      const whiteness = sampleCount > 0 ? whiteCount / sampleCount : 0;
      const distance = Math.abs(y - idealEndY);

      if (
        whiteness > bestScore ||
        (Math.abs(whiteness - bestScore) < 0.0001 && distance < bestDistance)
      ) {
        bestScore = whiteness;
        bestY = y;
        bestDistance = distance;
      }
    }

    // Only trust the adjustment if we found a mostly-white row.
    return bestScore >= 0.93 ? bestY : idealEndY;
  }, []);

  const renderElementToCanvas = useCallback(async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const originalStyle = element.style.display;
    element.style.display = 'block';

    try {
      console.log('[PDF Debug] Starting canvas rendering...');
      console.log('[PDF Debug] User Agent:', navigator.userAgent);
      console.log('[PDF Debug] Element dimensions:', {
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
      });

      // Wait for fonts and images to load to ensure correct layout before rendering
      // Add timeout to prevent hanging on slow networks
      try {
        if (document?.fonts && typeof (document as any).fonts.ready?.then === 'function') {
          // Wait for fonts to be ready (modern browsers) with 5 second timeout
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
          console.log('[PDF Debug] Fonts loaded (or timed out after 5s)');
        }
      } catch (e) {
        console.warn('[PDF Debug] Font loading error:', e);
      }

      const imgs = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
      console.log('[PDF Debug] Found', imgs.length, 'images');
      if (imgs.length > 0) {
        const imgStatuses = imgs.map(img => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }));
        console.log('[PDF Debug] Image statuses:', imgStatuses);

        // Wait for all images with 8 second timeout per image
        await Promise.all(imgs.map((img) => Promise.race([
          new Promise<void>((resolve) => {
            if (!img || img.complete) {
              // Even if complete, wait a bit for actual rendering
              setTimeout(resolve, 50);
              return;
            }
            const onLoad = () => { cleanup(); setTimeout(resolve, 50); };
            const onError = () => { 
              console.error('[PDF Debug] Image failed to load:', img.src);
              cleanup(); 
              resolve(); 
            };
            const cleanup = () => {
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
          }),
          // Timeout after 8 seconds per image for slow connections
          new Promise<void>((resolve) => setTimeout(() => {
            console.warn('[PDF Debug] Image load timeout:', img.src);
            resolve();
          }, 8000)),
        ])));
        console.log('[PDF Debug] All images processed');
      }

      // CRITICAL FIX: Wait for browser to complete rendering cycle
      // After fonts/images load, the browser still needs time to:
      // 1. Calculate layout (reflow)
      // 2. Apply styles (recalculate styles)
      // 3. Paint content to screen
      // This is especially important on slower devices or slower connections
      // where the rendering cycle takes longer to complete.
      // INCREASED from 100ms to 400ms to handle high-latency networks (e.g., Kuwait)
      // and slower devices where CSS/font rendering takes longer.
      await new Promise<void>((resolve) => {
        // Use multiple requestAnimationFrame calls to ensure content is fully painted
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Increased delay to 400ms for slower devices and high-latency networks
              setTimeout(resolve, 400);
            });
          });
        });
      });
      console.log('[PDF Debug] Rendering cycle complete');

      const sourceWidth = Math.max(1, Math.ceil(element.scrollWidth || element.clientWidth || element.offsetWidth));
      const sourceHeight = Math.max(1, Math.ceil(element.scrollHeight || element.clientHeight || element.offsetHeight));

      const baseScale = 2;
      const maxCanvasEdge = 16384;
      const scale = Math.max(
        0.5,
        Math.min(baseScale, maxCanvasEdge / sourceWidth, maxCanvasEdge / sourceHeight),
      );

      console.log('[PDF Debug] Canvas config:', {
        sourceWidth,
        sourceHeight,
        scale,
        targetWidth: sourceWidth * scale,
        targetHeight: sourceHeight * scale,
        browserMemoryMB: (performance as any)?.memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) 
          : 'unknown'
      });

      // Try to render canvas with timeout protection
      const canvas = await Promise.race([
        html2canvas(element, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true, // Enable html2canvas logging for debugging
          removeContainer: false,
          windowWidth: sourceWidth,
          windowHeight: sourceHeight,
          width: sourceWidth,
          height: sourceHeight,
          // Force inline styles to ensure CSS is captured
          foreignObjectRendering: false,
          // Add timeout for proxy loading
          proxy: undefined,
          onclone: (clonedDoc) => {
            console.log('[PDF Debug] Document cloned for canvas rendering');
            // Ensure all computed styles are applied in the clone
            const clonedElement = clonedDoc.getElementById(element.id);
            if (clonedElement) {
              clonedElement.style.display = 'block';
              clonedElement.style.visibility = 'visible';
            }
          },
        }),
        // 30 second timeout for canvas generation (handles slow networks)
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Canvas generation timeout after 30s')), 30000)
        ),
      ]) as HTMLCanvasElement;

      console.log('[PDF Debug] Canvas created:', {
        width: canvas.width,
        height: canvas.height,
        isEmpty: canvas.width === 0 || canvas.height === 0
      });

      // Check if canvas is actually blank
      if (canvas.width > 0 && canvas.height > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
          const isBlank = Array.from(imageData.data).every((val, i) => i % 4 === 3 || val === 255);
          console.log('[PDF Debug] Canvas content check:', { isBlank });
        }
      }

      return canvas;

    } finally {
      element.style.display = originalStyle;
    }
  }, []);

  const getProtectedRanges = useCallback((
    element: HTMLElement,
    canvas: HTMLCanvasElement,
  ): ProtectedRange[] => {
    const rowCandidates = Array.from(element.querySelectorAll('tr')) as HTMLElement[];
    const blockCandidates = Array.from(
      element.querySelectorAll('[data-pdf-avoid-break="true"]'),
    ) as HTMLElement[];
    const candidates = [
      ...rowCandidates.map((node) => ({ node, kind: 'row' as const })),
      ...blockCandidates.map((node) => ({ node, kind: 'block' as const })),
    ];

    if (candidates.length === 0) return [];

    const rootRect = element.getBoundingClientRect();
    const scaleY = canvas.height / Math.max(1, rootRect.height);
    const ranges: ProtectedRange[] = [];

    for (const candidate of candidates) {
      const { node, kind } = candidate;
      const rect = node.getBoundingClientRect();
      if (rect.height <= 2) continue;

      const topCss = rect.top - rootRect.top;
      const bottomCss = topCss + rect.height;
      const start = Math.max(0, Math.floor(topCss * scaleY) - 2);
      const end = Math.min(canvas.height, Math.ceil(bottomCss * scaleY) + 2);

      if (end > start) {
        ranges.push({ start, end, kind });
      }
    }

    if (ranges.length <= 1) return ranges;

    ranges.sort((a, b) => a.start - b.start);
    const merged: ProtectedRange[] = [ranges[0]];

    for (let i = 1; i < ranges.length; i += 1) {
      const current = ranges[i];
      const last = merged[merged.length - 1];
      // Keep table rows independent so one split inside the table does not
      // move the entire table to the next page and leave large blank space.
      if (
        current.kind === last.kind &&
        current.kind === 'block' &&
        current.start <= last.end
      ) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }, []);

  const avoidProtectedSplit = useCallback((
    splitY: number,
    startY: number,
    maxY: number,
    ranges: ProtectedRange[],
  ): number => {
    if (ranges.length === 0) return splitY;

    const minSliceHeight = 80;
    const minFallbackHeight = 24;
    let adjusted = splitY;

    for (const range of ranges) {
      if (adjusted <= range.start || adjusted >= range.end) continue;

      const before = range.start - 2;
      const after = range.end + 2;
      const beforeHeight = before - startY;
      const afterHeight = after - startY;

      if (beforeHeight >= minSliceHeight) {
        adjusted = before;
      } else if (after < maxY && afterHeight >= minSliceHeight) {
        adjusted = after;
      } else if (beforeHeight >= minFallbackHeight) {
        adjusted = before;
      } else if (after < maxY) {
        adjusted = after;
      }
      break;
    }

    if (adjusted <= startY + 1) return splitY;
    return Math.min(adjusted, maxY);
  }, []);

  const buildPaginatedPdf = useCallback(async (element: HTMLElement): Promise<jsPDF> => {
      const canvas = await renderElementToCanvas(element);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pagePaddingMm = 10;
      const usablePageHeightMm = Math.max(10, pdfHeight - pagePaddingMm * 2);
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      const pxToMmRatio = pdfWidth / imgWidthPx;
      const pageHeightPx = Math.max(1, Math.floor(usablePageHeightMm / pxToMmRatio));
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) throw new Error('Could not create source canvas context');
      const protectedRanges = getProtectedRanges(element, canvas);

      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < imgHeightPx) {
        let sliceEndY = Math.min(yOffset + pageHeightPx, imgHeightPx);
        if (sliceEndY < imgHeightPx) {
          sliceEndY = findNaturalPageBreak(
            canvasCtx,
            imgWidthPx,
            yOffset,
            sliceEndY,
            imgHeightPx,
          );
          sliceEndY = avoidProtectedSplit(
            sliceEndY,
            yOffset,
            imgHeightPx,
            protectedRanges,
          );

          // Keep a small visual breathing space at the bottom of each page.
          // This avoids sections appearing to "touch" the page break line.
          const bottomSafetyPx = 14;
          const minAllowedEnd = yOffset + 1;
          sliceEndY = Math.max(minAllowedEnd, sliceEndY - bottomSafetyPx);
        }
        const sliceHeightPx = Math.max(1, sliceEndY - yOffset);
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = imgWidthPx;
        tmpCanvas.height = sliceHeightPx;
        const tmpCtx = tmpCanvas.getContext('2d');
        if (!tmpCtx) throw new Error('Could not create canvas context for PDF slice');

        tmpCtx.drawImage(canvas, 0, yOffset, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx);
        const sliceData = tmpCanvas.toDataURL('image/png');
        const sliceHeightMm = sliceHeightPx * pxToMmRatio;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', 0, pagePaddingMm, pdfWidth, sliceHeightMm);

        yOffset = sliceEndY;
        pageIndex += 1;
      }

      return pdf;
  }, [avoidProtectedSplit, findNaturalPageBreak, getProtectedRanges, renderElementToCanvas]);

  const buildSinglePagePdf = useCallback(async (
    element: HTMLElement,
    options?: PdfOptions,
  ): Promise<jsPDF> => {
    const canvas = await renderElementToCanvas(element);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;

    let renderWidth = pageWidth;
    let renderHeight = pageHeight;

    if (canvasRatio > pageRatio) {
      renderWidth = pageWidth;
      renderHeight = pageWidth / canvasRatio;
    } else {
      renderHeight = pageHeight;
      renderWidth = pageHeight * canvasRatio;
    }

    const requestedScale = options?.fitScale;
    const fitScale =
      typeof requestedScale === 'number' && Number.isFinite(requestedScale)
        ? Math.min(1, Math.max(0.6, requestedScale))
        : 1;

    renderWidth *= fitScale;
    renderHeight *= fitScale;

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);

    return pdf;
  }, [renderElementToCanvas]);

  const downloadPDF = useCallback(async (
    elementId: string,
    filename: string,
    onComplete?: () => void,
    options?: PdfOptions,
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
      console.log('[PDF Debug] Starting PDF download:', { elementId, filename, options });
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we generate your document...',
      });

      const pdf = options?.fitToPage
        ? await buildSinglePagePdf(element, options)
        : await buildPaginatedPdf(element);

      console.log('[PDF Debug] PDF generated successfully');
      pdf.save(`${filename}.pdf`);

      toast({
        title: 'Download Complete',
        description: `${filename}.pdf has been downloaded`,
      });

      onComplete?.();
    } catch (error) {
      console.error('[PDF Debug] PDF generation error:', error);
      console.error('[PDF Debug] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        browser: navigator.userAgent,
        memory: (performance as any)?.memory 
          ? {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
              limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            }
          : 'unknown'
      });
      
      toast({
        title: 'Download Failed',
        description: error instanceof Error 
          ? `Error: ${error.message}. Check console for details.`
          : 'Could not generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  }, [buildPaginatedPdf, buildSinglePagePdf, toast]);

  const printPDF = useCallback(async (
    elementId: string,
    filename = 'document',
    options?: PdfOptions,
  ) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({ title: 'Error', description: 'Could not find document to print', variant: 'destructive' });
      return;
    }

    try {
      console.log('[PDF Debug] Starting print PDF:', { elementId, filename, options });
      toast({ title: 'Generating Printable PDF', description: 'Preparing document for print without headers...' });

      const pdf = options?.fitToPage
        ? await buildSinglePagePdf(element, options)
        : await buildPaginatedPdf(element);

      console.log('[PDF Debug] Print PDF generated successfully');
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
          console.error('[PDF Debug] Print dialog error:', e);
        }
        // cleanup: revoke object URL after a short delay
        setTimeout(() => {
          try { URL.revokeObjectURL(url); } catch {}
        }, 2000);
      }, 700);
    } catch (error) {
      console.error('[PDF Debug] Print PDF generation error:', error);
      console.error('[PDF Debug] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        browser: navigator.userAgent
      });
      toast({ title: 'Print Failed', description: 'Could not generate printable PDF', variant: 'destructive' });
    }
  }, [buildPaginatedPdf, buildSinglePagePdf, toast]);

  const generatePdfBase64 = useCallback(async (
    elementId: string,
    options?: PdfOptions,
  ): Promise<string> => {
    console.log('[PDF Debug] Starting PDF base64 generation:', { elementId, options });
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('[PDF Debug] Element not found:', elementId);
      throw new Error('Could not find document preview');
    }
    try {
      const pdf = options?.fitToPage
        ? await buildSinglePagePdf(element, options)
        : await buildPaginatedPdf(element);
      const base64 = pdf.output('dataurlstring').split(',')[1];
      console.log('[PDF Debug] Base64 PDF generated, length:', base64.length);
      return base64;
    } catch (error) {
      console.error('[PDF Debug] Base64 PDF generation error:', error);
      throw error;
    }
  }, [buildPaginatedPdf, buildSinglePagePdf]);

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
    generatePdfBase64,
    sendEmail,
    openInGenerator,
  };
}
