import { Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useCorporatePages } from "@/hooks/useCorporatePages";
import { useSupportPages } from "@/hooks/useSupportPages";
import { useLandingPage } from "@/hooks/useLandingPage";
import type { FooterLink as LandingFooterLink } from "@/api/services/landing-page.service";

interface FooterLinkItem {
  label: string;
  href: string;
}

interface PublicSocialLink {
  _id: string;
  platform: string;
  url: string;
  enabled: boolean;
  order: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Static corporate links shown when VITE_FORCE_STATIC_PAGES=true
const STATIC_CORPORATE_LINKS: FooterLinkItem[] = [
  { label: 'About', href: '/about' },
  { label: 'B2B', href: '/b2b' },
  { label: 'Guides', href: '/guides' },
];

const FORCE_STATIC_PAGES = import.meta.env.VITE_FORCE_STATIC_PAGES === 'true';

const toHref = (slug: string): string => {
  if (!slug) return "/";
  if (/^https?:\/\//i.test(slug)) return slug;
  if (slug.startsWith("/") || slug.startsWith("#")) return slug;
  return `/${slug}`;
};

const isExternalHref = (href: string): boolean => /^https?:\/\//i.test(href);

const mapPageLinks = (
  pages: Array<{ title: string; slug: string; showInFooter: boolean; order: number; createdAt?: string; updatedAt?: string }>,
  prefix?: string
): FooterLinkItem[] =>
  pages
    .filter((page) => page.showInFooter)
    .sort((a, b) => a.order - b.order)
    .map((page) => {
      // Skip prefix for absolute paths or URLs
      if (page.slug.startsWith('/') || page.slug.startsWith('http')) {
        return {
          label: page.title,
          href: toHref(page.slug),
        };
      }

      // Special hardcoded pages
      const hardcodedPages = ['contact', 'privacy', 'refund', 'terms', 'faqs', 'about', 'b2b', 'guides'];
      const slugLower = page.slug.toLowerCase();

      if (hardcodedPages.includes(slugLower)) {
        // Always prefer the frontend route for Guides so it uses the dedicated
        // `/guides` page with the intended design, even if the corporate DB
        // record was edited.
        if (slugLower === 'guides') {
          return { label: 'Guides', href: '/guides' };
        }

        // Keep Refund Policy on the canonical frontend route.
        if (slugLower === 'refund') {
          return { label: page.title, href: '/refund' };
        }

        // Normalize the label for some known pages (use short label in footer)
        const footerLabel = page.title;

        return {
          label: footerLabel,
          href: `/${slugLower}`,
        };
      }

      // Add prefix if provided for dynamic pages
      return {
        label: page.title,
        href: prefix ? `${prefix}/${page.slug}` : toHref(page.slug),
      };
    });

const mapLandingLinks = (links: LandingFooterLink[] | undefined): FooterLinkItem[] =>
  (links ?? [])
    .filter((link) => Boolean(link?.label) && Boolean(link?.href))
    .map((link) => ({
      label: link.label,
      href: toHref(link.href),
    }));

export function Footer() {
  const { data: landingPage } = useLandingPage();
  const { data: supportPages = [] } = useSupportPages({ enabledOnly: true });
  const { data: corporatePages = [] } = useCorporatePages({ enabledOnly: true });
  const { data: publicSocialLinks = [] } = useQuery({
    queryKey: ["public-social-links"],
    queryFn: async () => {
      const response = await axios.get<PublicSocialLink[]>(`${API_BASE_URL}/social-links`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const socialLinksFromPublicApi: FooterLinkItem[] = publicSocialLinks
    .filter((link) => link.enabled)
    .sort((a, b) => a.order - b.order)
    .map((link) => ({
      label: link.platform,
      href: toHref(link.url),
    }));
  const socialLinksFromLanding = mapLandingLinks(landingPage?.footerSection?.socialMediaLinks);
  const socialLinks = socialLinksFromPublicApi.length > 0 ? socialLinksFromPublicApi : socialLinksFromLanding;
  const supportLinksFromPages = mapPageLinks(supportPages, '/support');
  const corporateLinksFromPages = mapPageLinks(corporatePages, '/corporate');

  // Ensure FAQs always appears in the Support section
  const faqLink: FooterLinkItem = { label: 'FAQs', href: '/faqs' };
  const hasFaqLink = (links: FooterLinkItem[]) =>
    links.some((l) => l.href === '/faqs' || l.label.toLowerCase() === 'faqs');

  const supportLinks = (() => {
    const base = supportLinksFromPages.length > 0
      ? supportLinksFromPages
      : mapLandingLinks(landingPage?.footerSection?.supportLinks);
    return hasFaqLink(base) ? base : [...base, faqLink];
  })();
  const corporateLinks = FORCE_STATIC_PAGES
    ? STATIC_CORPORATE_LINKS
    : corporateLinksFromPages.length > 0
      ? corporateLinksFromPages
      : mapLandingLinks(landingPage?.footerSection?.corporateLinks);

  // Reorder corporate links so Guides appears first, then About, then B2B
  const reorderPriority = ['guides', 'about', 'b2b'];
  const orderedCorporateLinks = (() => {
    if (!corporateLinks || corporateLinks.length === 0) return corporateLinks;

    const prioritized: FooterLinkItem[] = [];
    const others: FooterLinkItem[] = [];

    const lower = (s: string) => s.toLowerCase();

    // Place prioritized items first by matching href or label to known slugs
    for (const key of reorderPriority) {
      const idx = corporateLinks.findIndex((link) => {
        const href = lower(link.href || '');
        const label = lower(link.label || '');
        return href.endsWith(`/${key}`) || href === `/${key}` || label.includes(key);
      });
      if (idx !== -1) {
        prioritized.push(corporateLinks[idx]);
      }
    }

    // Add remaining links preserving original order, excluding already added
    for (const link of corporateLinks) {
      const exists = prioritized.find((p) => p.label === link.label && p.href === link.href);
      if (!exists) others.push(link);
    }

    return [...prioritized, ...others];
  })();

  return <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg font-display">V</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                {landingPage?.footerSection?.companyName}
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs">
              {landingPage?.footerSection?.description}
            </p>
          </div>

          {/* Social Media Links */}
          {landingPage?.footerSection?.showSocialLinks && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">Social Media</h3>
              <ul className="space-y-3">
                {socialLinks.map(link => <li key={link.label}>
                    {isExternalHref(link.href) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        {link.label}
                      </Link>
                    )}
                  </li>)}
              </ul>
            </div>
          )}

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map(link => <li key={link.label}>
                  {isExternalHref(link.href) ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.label}
                    </Link>
                  )}
                </li>)}
            </ul>
          </div>

          {/* Corporate Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Corporate</h3>
            <ul className="space-y-3">
              {(orderedCorporateLinks || corporateLinks).map(link => <li key={link.label}>
                  {isExternalHref(link.href) ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.label}
                    </Link>
                  )}
                </li>)}
            </ul>
            <div className="mt-3 flex justify-start">
              {(() => {
                const configuredHref = landingPage?.footerSection?.corporateLoginHref || '/corporate/login';
                const href = configuredHref === '/login' ? '/corporate/login' : configuredHref;
                const label = landingPage?.footerSection?.corporateLoginLabel || 'Corporate Login';
                const baseClasses = 'inline-block px-5 py-2 rounded-lg border border-foreground text-base font-medium text-foreground bg-background hover:bg-muted/5 transition-colors';
                return isExternalHref(href) ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={baseClasses}
                    style={{ borderWidth: 1 }}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    to={href}
                    className={baseClasses}
                    style={{ borderWidth: 1 }}
                  >
                    {label}
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex justify-center">
          <p className="text-sm text-muted-foreground">
            {landingPage?.footerSection?.copyright}
          </p>
        </div>
      </div>
    </footer>;
}
