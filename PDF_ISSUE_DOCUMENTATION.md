# PDF Generation Issue — Complete Documentation

## Project: VAYPR (Invoice/Quote Management Platform)

**Date:** March 2026  
**Stack:** React + Vite frontend, NestJS backend, Tailwind CSS, html2canvas + jsPDF for PDF generation  
**Repository:** `/Users/saaddev/vayper`

---

## 1. Problem Statement

When **clients** download invoices or quotes as PDF, the generated PDF shows only **static/inline-styled content** (logo image, colored headers like "QUOTE" or "INVOICE", table header row) but **all dynamic body content is invisible** (client name, dates, line items, quantities, amounts, totals, notes, footer info).

The issue does **not** reproduce on the developer's own device — it only occurs on certain client devices/browsers.

---

## 2. Architecture Overview

### PDF Generation Pipeline

```
User clicks "Download PDF"
  → Page sets state (e.g., setInvoiceForDownload(invoice))
  → React conditionally renders a hidden off-screen <div> containing <InvoicePreview> or <QuotePreview>
  → waitForElementAndDownload() polls every 100ms (3s timeout) until element exists, has size, and contains expected text
  → downloadPDF(elementId, filename) is called
  → renderElementToCanvas(element) runs:
      1. Sets element display: block
      2. Waits for fonts (5s timeout)
      3. Waits for images (8s timeout per image)
      4. 3x requestAnimationFrame + 400ms delay
      5. Calls html2canvas(element, { onclone, backgroundColor: '#ffffff', scale: 2, ... })
      6. html2canvas clones the DOM, applies onclone callback, renders to <canvas>
  → Canvas is sliced into A4 pages with intelligent page-break detection
  → jsPDF assembles pages and triggers browser download
```

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/hooks/useDocumentActions.ts` | Central PDF generation hook — `downloadPDF()`, `printPDF()`, `generatePdfBase64()`, `printDocument()`, `renderElementToCanvas()` |
| `frontend/src/components/invoice/InvoicePreview.tsx` | Presentational component for invoice document rendering |
| `frontend/src/components/quote/QuotePreview.tsx` | Presentational component for quote document rendering |
| `frontend/src/pages/Invoices.tsx` | Invoice list page — handles download flow, maps API data, renders hidden preview |
| `frontend/src/pages/Quotes.tsx` | Quote list page — handles download flow, maps API data, renders hidden preview |
| `frontend/src/pages/Receipts.tsx` | Receipt page — similar download flow |
| `frontend/src/pages/Generator.tsx` | Document generator — creates invoices/quotes/receipts from scratch |
| `frontend/src/pages/Recurring.tsx` | Recurring invoices — generates PDF for email |
| `frontend/src/pages/super-admin/Transactions.tsx` | Admin transaction page — invoice download |
| `frontend/src/index.css` | CSS custom properties (light + dark mode variables) |
| `frontend/tailwind.config.ts` | Tailwind config — `darkMode: ["class"]` |

### All Captured Element IDs

| Page | Element ID | Purpose |
|------|-----------|---------|
| Invoices | `invoice-preview-download` | PDF download |
| Invoices | `invoice-preview-email` | Email attachment |
| Invoices | `invoice-preview` | Dialog preview |
| Quotes | `quote-preview-download` | PDF download |
| Quotes | `quote-preview-email` | Email attachment |
| Receipts | `receipt-preview-download` | PDF download |
| Receipts | `receipt-preview-email` | Email attachment |
| Generator | `generator-invoice-export-preview` | Export invoice |
| Generator | `generator-receipt-export-preview` | Export receipt |
| Generator | `generator-quote-export-preview` | Export quote |
| Recurring | `recurring-invoice-preview-email` | Email attachment |
| Transactions | `transaction-invoice-preview-download` | Admin download |

### Data Flow

- **Invoices**: API response → `mapInvoiceToPreviewData()` (Invoices.tsx line ~188) → `<InvoicePreview data={...}>`
- **Quotes**: API response → `mapApiQuoteToLocal()` (Quotes.tsx line ~177) → `mapQuoteToPreviewData()` (Quotes.tsx line ~363) → `<QuotePreview data={...}>`

Data is **always fully populated** — confirmed by the preview working in modal dialogs and `waitForElementAndDownload()` verifying text content before triggering capture.

---

## 3. Root Cause Analysis

### The Pattern

From the user's screenshot of a broken Quote PDF:
- **VISIBLE**: Logo (`<img>` tag), "QUOTE" header (inline `style={{ color: data.tableHeaderColor }}`), table header row (inline `style={{ backgroundColor: data.tableHeaderColor, color: '#fff' }}`)
- **INVISIBLE**: Client name, dates, item descriptions, quantities, amounts, totals, notes

**Key insight:** Every visible element uses **hardcoded inline styles**. Every invisible element uses **Tailwind CSS classes** that resolve via CSS custom properties.

### The Mechanism

#### Color System

The app uses Tailwind CSS with HSL custom properties for all colors:

```css
/* frontend/src/index.css */

/* Light mode (:root) */
:root {
  --foreground: 224 71% 4%;        /* hsl(224, 71%, 4%) = NEAR-BLACK #060D18 */
  --muted-foreground: 220 9% 46%;  /* hsl(220, 9%, 46%) = GRAY */
  --card-foreground: 224 71% 4%;   /* NEAR-BLACK */
  --background: 220 14% 96%;       /* LIGHT GRAY */
  --card: 0 0% 100%;               /* WHITE */
  /* ... other variables ... */
}

/* Dark mode (.dark) */
.dark {
  --foreground: 220 14% 96%;       /* hsl(220, 14%, 96%) = NEAR-WHITE #F2F3F5 */
  --muted-foreground: 220 9% 64%;  /* LIGHT GRAY */
  --card-foreground: 220 14% 96%;  /* NEAR-WHITE */
  --background: 224 71% 4%;        /* DARK */
  --card: 224 47% 10%;             /* DARK */
  /* ... other variables ... */
}
```

Tailwind resolves these in `tailwind.config.ts`:
```typescript
foreground: "hsl(var(--foreground))",
// darkMode: ["class"]  — only activates via .dark class on ancestor
```

#### How Dark Mode Gets Activated

The app itself has **no ThemeProvider** and **no runtime code** that programmatically adds `.dark` class. The `next-themes` package is installed (v0.3.0) but only imported by `sonner.tsx` — no `<ThemeProvider>` wraps the app in `App.tsx`.

However, dark mode can be activated **externally** by:
1. **Browser extensions** (Dark Reader, Night Eye, etc.) that inject `.dark` class or modify CSS
2. **OS-level dark mode** picked up by browser in some configurations
3. **Browser forced dark mode** flags (e.g., Chrome's `#enable-force-dark`)

#### Why It Causes Invisible Text

1. External force adds `.dark` class or equivalent to `<html>` or `<body>`
2. CSS variables resolve: `--foreground` becomes `220 14% 96%` (near-white)
3. All `text-foreground` and `text-muted-foreground` elements render with near-white text
4. html2canvas captures the DOM clone, resolving computed styles at that moment
5. html2canvas uses `backgroundColor: '#ffffff'` (white)
6. Result: **near-white text on white background = invisible**
7. Elements with inline `style={{ color: '#...' }}` bypass CSS variables entirely, so they remain visible

#### Why It Works on Developer's Device

The developer's device doesn't have dark mode activated (no browser extension, no OS dark mode that triggers `.dark`), so `--foreground` always resolves to `224 71% 4%` (near-black).

---

## 4. Secondary Issues Found

### 4.1 Generator.tsx Missing `await`

In `frontend/src/pages/Generator.tsx` line ~500, `waitForRender()` is called without `await`:
```typescript
// BUG: fire-and-forget — capture may start before render completes
waitForRender();  // should be: await waitForRender();
```
This can cause PDF capture to start before the preview element is fully rendered on slower devices.

### 4.2 Quotes.tsx Missing `await` (fixed)

`waitForElementAndDownload` was called without `await` in Quotes.tsx line 455. This was fixed in the local changes.

---

## 5. Fix Implementation

### 5.1 Three-Layer Defense Strategy

The fix uses three independent layers to ensure light-mode rendering in PDFs regardless of the user's theme:

#### Layer 1: `onclone` Callback in useDocumentActions.ts

When html2canvas clones the DOM for rendering, the `onclone` callback now:
1. Removes `.dark` class from cloned `<html>` and `<body>`
2. Force-sets all 12 light-mode CSS variables directly on the cloned `:root`

```typescript
onclone: (clonedDoc) => {
  // Remove dark mode class
  clonedDoc.documentElement.classList.remove('dark');
  clonedDoc.body.classList.remove('dark');

  // Force light-mode CSS variables
  const root = clonedDoc.documentElement;
  root.style.setProperty('--background', '220 14% 96%');
  root.style.setProperty('--foreground', '224 71% 4%');
  root.style.setProperty('--card', '0 0% 100%');
  root.style.setProperty('--card-foreground', '224 71% 4%');
  root.style.setProperty('--popover', '0 0% 100%');
  root.style.setProperty('--popover-foreground', '224 71% 4%');
  root.style.setProperty('--muted', '220 14% 96%');
  root.style.setProperty('--muted-foreground', '220 9% 46%');
  root.style.setProperty('--secondary', '220 14% 96%');
  root.style.setProperty('--secondary-foreground', '224 71% 4%');
  root.style.setProperty('--border', '220 13% 91%');
  root.style.setProperty('--input', '220 13% 91%');

  // Ensure cloned element is visible
  const clonedElement = clonedDoc.getElementById(element.id);
  if (clonedElement) {
    clonedElement.style.display = 'block';
    clonedElement.style.visibility = 'visible';
  }
}
```

#### Layer 2: `.light` CSS Scope in index.css

Added a CSS scope that forces light-mode variables regardless of parent theme:

```css
.dark .light,
.light {
  --background: 220 14% 96%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;
  /* ... all other light-mode variables ... */
  color-scheme: light;
}
```

#### Layer 3: `.light` Class on Hidden Preview Containers

All hidden off-screen preview containers across all 6 page files now have `className="light"` and `style={{ colorScheme: 'light' }}`:

```tsx
{invoiceForDownload && (
  <div className="light" style={{ position: 'absolute', left: '-9999px', top: '-9999px', colorScheme: 'light' }}>
    <InvoicePreview previewId="invoice-preview-download" data={...} />
  </div>
)}
```

### 5.2 Debug Logging Added

Comprehensive diagnostic logging was added to help debug any future issues:

**In `useDocumentActions.ts` (`renderElementToCanvas`):**
- Theme state: `document.documentElement.className`, `prefers-color-scheme` media query
- CSS variable resolution: `--foreground`, `--background`, `--card`, etc. from both root and element
- Computed styles: `color`, `backgroundColor`, `visibility`, `display`, `opacity` on the capture element
- DOM content: child count, text node count, visible text node count, innerText snippet
- Color visibility check: first text element's computed color vs background
- Clone state: logs CSS variables and computed colors BEFORE and AFTER the `onclone` fix is applied

**In `Invoices.tsx` and `Quotes.tsx` (`waitForElementAndDownload`):**
- Logs when polling starts with element ID
- Logs every 500ms while waiting (element exists?, sized?, has data?)
- Logs when element is ready (dimensions, text content length, text snippet)
- Logs on timeout with final state

All logs use `[PDF Debug]` prefix for easy filtering in browser console.

---

## 6. Files Modified (Uncommitted)

| File | Changes |
|------|---------|
| `frontend/src/hooks/useDocumentActions.ts` | `onclone` dark mode removal + CSS variable forcing + comprehensive debug logging |
| `frontend/src/index.css` | `.light` / `.dark .light` CSS scope with forced light variables |
| `frontend/src/pages/Invoices.tsx` | Hidden container `className="light"` + debug logging in `waitForElementAndDownload` |
| `frontend/src/pages/Quotes.tsx` | Hidden container `className="light"` + debug logging + fixed missing `await` |
| `frontend/src/pages/Receipts.tsx` | Hidden container `className="light"` |
| `frontend/src/pages/Generator.tsx` | Hidden container `className="light"` |
| `frontend/src/pages/Recurring.tsx` | Hidden container `className="light"` |
| `frontend/src/pages/super-admin/Transactions.tsx` | Hidden container `className="light"` |

---

## 7. Production State

As of the latest commit (`d5fa0b7` — "remove extra header in faqs"):
- **Production `onclone`** only does `display: block; visibility: visible` — NO dark mode handling
- **Production hidden containers** have NO `.light` class
- **Production `index.css`** has NO `.light` scope
- All fixes exist **only as uncommitted local changes**

### To Deploy

```bash
git add frontend/src/hooks/useDocumentActions.ts \
       frontend/src/index.css \
       frontend/src/pages/Generator.tsx \
       frontend/src/pages/Invoices.tsx \
       frontend/src/pages/Quotes.tsx \
       frontend/src/pages/Receipts.tsx \
       frontend/src/pages/Recurring.tsx \
       frontend/src/pages/super-admin/Transactions.tsx

git commit -m "fix: force light mode in PDF generation to prevent invisible text on dark mode devices"
git push
```

---

## 8. Key Technical Details

### html2canvas Behavior
- html2canvas **clones** the entire DOM into an iframe
- It resolves **computed styles** at clone time (not raw CSS)
- CSS custom properties are resolved to their computed values
- `backgroundColor: '#ffffff'` sets the canvas background to white
- The `onclone` callback runs **after** cloning but **before** rendering — this is where we force light mode

### Tailwind Dark Mode Config
```typescript
// tailwind.config.ts
darkMode: ["class"]  // Only activates via .dark class on ancestor element
```

### InvoicePreview / QuotePreview Color Usage
- **Inline styles (ALWAYS visible):** Logo image, document title ("INVOICE"/"QUOTE"), table header row background
- **CSS variable classes (invisible in dark mode):** `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-background`, `border-border` — used for ALL body content (client info, dates, items, amounts, totals, notes, footer)

### Theme Management
- **No ThemeProvider** wraps the app (`App.tsx` only has `AuthProvider`, `QueryClientProvider`, `TooltipProvider`)
- `next-themes` v0.3.0 is installed but only used by `sonner.tsx` toast component
- Dark mode is only triggered by **external sources** (browser extensions, OS settings)

---

## 9. Summary

| Aspect | Detail |
|--------|--------|
| **Symptom** | PDF shows logo + colored headers but body text is invisible |
| **Affected users** | Clients whose device/browser applies dark mode externally |
| **Root cause** | CSS custom properties (`--foreground` etc.) resolve to near-white in dark mode; html2canvas captures white text on white canvas |
| **Why inline-styled elements work** | They bypass CSS variables entirely |
| **Why it works on dev's device** | No dark mode activated |
| **Fix strategy** | 3-layer defense: onclone CSS variable forcing + .light CSS scope + .light class on containers |
| **Secondary fixes** | Missing `await` in Quotes.tsx and Generator.tsx |
| **Status** | Implemented locally, NOT deployed to production |
