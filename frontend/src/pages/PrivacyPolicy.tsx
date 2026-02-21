import { Shield } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes:

• **Account Information**: Name, email address, company name, and password when you register.
• **Billing Information**: Payment card details and billing address when you make purchases.
• **Business Data**: Invoices, quotes, client information, and other documents you create using our platform.
• **Communications**: Messages, feedback, and correspondence you send to us.
• **Usage Data**: Information about how you interact with our services, including features used, pages visited, and actions taken.`
  },
  {
    title: "How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, security alerts, and support messages
• Respond to your comments, questions, and requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Personalize and improve your experience
• Send promotional communications (with your consent)`
  },
  {
    title: "Information Sharing",
    content: `We do not sell your personal information. We may share your information in the following circumstances:

• **Service Providers**: With third-party vendors who perform services on our behalf (payment processing, hosting, analytics)
• **Legal Requirements**: When required by law or to respond to legal process
• **Protection**: To protect the rights, property, and safety of VAYPR, our users, and the public
• **Business Transfers**: In connection with a merger, acquisition, or sale of assets
• **Consent**: With your consent or at your direction`
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures to protect your information:

• **Encryption**: All data is encrypted in transit (TLS 1.3) and at rest (AES-256)
• **Access Controls**: Strict access controls and authentication requirements
• **Regular Audits**: Ongoing security assessments and penetration testing
• **SOC 2 Compliance**: Our infrastructure meets SOC 2 Type II standards
• **Monitoring**: 24/7 security monitoring and incident response

While we strive to protect your information, no method of transmission over the internet is 100% secure.`
  },
  {
    title: "Data Retention",
    content: `We retain your information for as long as your account is active or as needed to provide services. We will also retain information as necessary to:

• Comply with legal obligations
• Resolve disputes
• Enforce our agreements
• Support business operations

You can request deletion of your data at any time through your account settings or by contacting us.`
  },
  {
    title: "Your Rights",
    content: `Depending on your location, you may have the following rights:

• **Access**: Request access to your personal information
• **Correction**: Request correction of inaccurate information
• **Deletion**: Request deletion of your personal information
• **Portability**: Receive a copy of your data in a portable format
• **Opt-out**: Opt out of marketing communications
• **Restriction**: Request restriction of processing

To exercise these rights, please contact us at privacy@vaypr.com.`
  },
  {
    title: "Cookies and Tracking",
    content: `We use cookies and similar technologies to:

• Keep you logged in
• Remember your preferences
• Analyze site usage and performance
• Provide personalized content

You can control cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our services.`
  },
  {
    title: "Children's Privacy",
    content: `Our services are not directed to children under 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`
  },
  {
    title: "Changes to This Policy",
    content: `We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`
  },
  {
    title: "Contact Us",
    content: `If you have questions about this privacy policy or our privacy practices, please contact us at:

**Email**: team@vaypr.net
**Address**: Salhiya, Mohammad Thunayan Alghanim Street, Kuwait City
**Phone**: (+965) 2246-4030`
  }
];

export default function PrivacyPolicy() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: January 15, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {sections.map((section, idx) => (
              <div key={idx} className="mb-12">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                  {idx + 1}. {section.title}
                </h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
