import { Link } from "react-router-dom";
const footerLinks = {
  socialMedia: [{
    label: "Facebook",
    href: "#"
  }, {
    label: "Instagram",
    href: "#"
  }, {
    label: "TikTok",
    href: "#"
  }, {
    label: "LinkedIn",
    href: "#"
  }],
  support: [{
    label: "FAQs",
    href: "/faqs"
  }, {
    label: "Contact Us",
    href: "/contact"
  }, {
    label: "Privacy Policy",
    href: "/privacy"
  }, {
    label: "Refund Policy",
    href: "/refund"
  }],
  corporate: [{
    label: "Guides",
    href: "/guides"
  }, {
    label: "About Us",
    href: "/about"
  }, {
    label: "B2B Services",
    href: "/b2b"
  }]
};
export function Footer() {
  return <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg font-display">V</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">VAYPR</span>
            </Link>
            <p className="text-muted-foreground max-w-xs">
              The modern financial management platform for businesses that want to grow.
            </p>
          </div>

          {/* Social Media Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Social Media</h3>
            <ul className="space-y-3">
              {footerLinks.socialMedia.map(link => <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Corporate Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Corporate</h3>
            <ul className="space-y-3">
              {footerLinks.corporate.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>)}
              <li>
                <Link to="/login" className="inline-block px-4 py-2 border border-foreground rounded-md text-sm text-foreground hover:bg-foreground hover:text-background transition-colors">
                  Corporate Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VAYPR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
}