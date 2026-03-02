export type EmailTemplateStyle = 'modern' | 'classic' | 'minimal';

interface BrandedEmailTemplateOptions {
  emailTitle: string;
  companyName: string;
  message: string;
  accentColor: string;
  templateStyle: EmailTemplateStyle;
  attachmentNote: string;
  logoUrl?: string;
}

const escapeHtml = (value: string): string =>
  (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeHexColor = (value: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '#6366f1';
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : '#6366f1';
};

const normalizeLogoUrl = (value?: string): string => {
  if (!value) return '';
  let normalized = value.trim();
  if (!normalized) return '';

  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  } else if (normalized.startsWith('http://')) {
    normalized = `https://${normalized.slice('http://'.length)}`;
  }

  if (normalized.includes('res.cloudinary.com') && normalized.includes('/upload/')) {
    normalized = normalized.replace('/upload/', '/upload/f_auto,q_auto/');
  }

  return encodeURI(normalized);
};

const messageToHtml = (message: string): string =>
  (message || '')
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br />'}</p>`)
    .join('');

const getHeroBackground = (templateStyle: EmailTemplateStyle, color: string): string => {
  if (templateStyle === 'classic') return color;
  if (templateStyle === 'minimal') return '#ffffff';
  return `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;
};

const getCardShadow = (templateStyle: EmailTemplateStyle, color: string): string => {
  if (templateStyle === 'minimal') return 'none';
  if (templateStyle === 'classic') return '0 6px 20px rgba(17, 24, 39, 0.08)';
  return `0 10px 28px ${color}22`;
};

export const buildBrandedEmailHtml = ({
  emailTitle,
  companyName,
  message,
  accentColor,
  templateStyle,
  attachmentNote,
  logoUrl,
}: BrandedEmailTemplateOptions): string => {
  const safeTitle = escapeHtml(emailTitle);
  const safeCompany = escapeHtml(companyName);
  const safeAttachment = escapeHtml(attachmentNote);
  const safeColor = normalizeHexColor(accentColor);
  const safeLogoUrl = normalizeLogoUrl(logoUrl);
  const messageHtml = messageToHtml(message);
  const heroBackground = getHeroBackground(templateStyle, safeColor);
  const cardShadow = getCardShadow(templateStyle, safeColor);
  const borderRadius = templateStyle === 'minimal' ? '8px' : '16px';

  return `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif; color: #111827; }
          .container { max-width: 760px; margin: 0 auto; padding: 24px 16px; }
          .card { background: #ffffff; border-radius: ${borderRadius}; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: ${cardShadow}; }
          .hero { background: ${heroBackground}; color: ${templateStyle === 'minimal' ? '#111827' : '#ffffff'}; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
          .brand-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .brand-logo-cell { width: 82px; vertical-align: middle; padding-right: 18px; }
          .brand-name-cell { vertical-align: middle; }
          .logo { width: 58px; height: 58px; object-fit: contain; display: block; background: #ffffff; border-radius: 8px; padding: 6px; }
          .company-name { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.1px; line-height: 1.15; font-family: 'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
          .doc-title-row { margin-top: 8px; }
          .doc-title { margin: 0; font-size: 14px; font-weight: 500; opacity: 0.95; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; display: block; }
          .content { padding: 28px; }
          .message-box { background: #f8fafc; border: 1px solid #e5e7eb; border-left: 6px solid ${safeColor}; border-radius: 14px; padding: 24px; margin: 0 0 18px; min-height: 240px; }
          .message-box p { margin: 10px 0; font-size: 16px; line-height: 1.75; color: #1f2937; }
          .attachment { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-top: 10px; font-size: 13px; color: #4b5563; }
          .signature { margin-top: 18px; font-size: 14px; color: #374151; }
          .signature strong { color: #111827; }
          .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="hero">
              <table role="presentation" class="brand-table">
                <tr>
                  <td class="brand-logo-cell">
                    ${safeLogoUrl ? `<img src="${safeLogoUrl}" alt="Company logo" class="logo" />` : ''}
                  </td>
                  <td class="brand-name-cell">
                    <h1 class="company-name">${safeCompany}</h1>
                  </td>
                </tr>
              </table>
              <div class="doc-title-row">
                <p class="doc-title">${safeTitle}</p>
              </div>
            </div>
            <div class="content">
              <div class="message-box">
                ${messageHtml}
              </div>
              <div class="attachment">${safeAttachment}</div>
              <p class="signature">Best regards,<br/><strong>${safeCompany}</strong></p>
            </div>
          </div>
          <p class="footer">Powered by VAYPR</p>
        </div>
      </body>
    </html>
  `;
};
