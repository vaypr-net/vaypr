import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useSupportPageBySlug } from "@/hooks/useSupportPages";

const defaultContent = {
  title: "Terms of Service",
  description: "By using VAYPR, you agree to these terms. Please read them carefully.",
  lastUpdated: "February 14, 2026",
  acceptanceHeading: "1. Acceptance of Terms",
  acceptanceOfTerms:
    "By accessing and using VAYPR, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.",
  useOfServiceHeading: "2. Use of Service",
  useOfServiceIntro: "VAYPR provides invoicing and business management tools. You agree to:",
  useOfServiceItems: [
    "Use the service only for lawful purposes",
    "Not attempt to gain unauthorized access to our systems",
    "Not use the service to transmit harmful content",
    "Maintain the security of your account credentials"
  ],
  accountResponsibilitiesHeading: "3. Account Responsibilities",
  accountResponsibilitiesIntro: "You are responsible for:",
  accountResponsibilitiesItems: [
    "Maintaining accurate account information",
    "All activities that occur under your account",
    "Notifying us of any unauthorized use",
    "Complying with all applicable laws and regulations"
  ],
  subscriptionAndBillingHeading: "4. Subscription and Billing",
  subscriptionAndBilling:
    "Subscription fees are billed in advance on a monthly or annual basis. You agree to provide accurate billing information and authorize us to charge your payment method. Fees are non-refundable except as stated in our Refund Policy.",
  intellectualPropertyHeading: "5. Intellectual Property",
  intellectualProperty:
    "VAYPR and its content are protected by copyright, trademark, and other laws. You retain ownership of your data, but grant us the right to use it to provide our services. We retain all rights to the VAYPR platform and software.",
  dataAndPrivacyHeading: "6. Data and Privacy",
  dataAndPrivacy:
    "We collect and process your data as described in our Privacy Policy. You are responsible for the accuracy and legality of data you upload to our service.",
  serviceAvailabilityHeading: "7. Service Availability",
  serviceAvailability:
    "We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications without prior notice.",
  terminationHeading: "8. Termination",
  termination:
    "We may suspend or terminate your account if you violate these terms. You may cancel your subscription at any time through your account settings. Upon termination, you will lose access to your account and data.",
  limitationOfLiabilityHeading: "9. Limitation of Liability",
  limitationOfLiability:
    "VAYPR is provided \"as is\" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.",
  changesToTermsHeading: "10. Changes to Terms",
  changesToTerms:
    "We reserve the right to modify these terms at any time. We will notify you of significant changes via email or through the service. Continued use after changes constitutes acceptance.",
  governingLawHeading: "11. Governing Law",
  governingLaw:
    "These terms are governed by the laws of Kuwait. Any disputes will be resolved in the courts of Kuwait.",
  contactHeading: "12. Contact Information",
  contactIntro: "For questions about these Terms of Service, please contact us:",
  contactEmail: "legal@vaypr.com",
  contactAddress: "Salhiya, Mohammad Thunayan Alghanim Street, Kuwait City",
  contactPhone: "(+965) 2246-4030",
  additionalSections: [] as Array<{ title: string; content: string }>,
};

export default function TermsOfService() {
  const { data: apiContent, isLoading } = useSupportPageBySlug("terms");
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }
  const content = (apiContent as any)?.content ?? defaultContent;
  const additionalSections = Array.isArray(content?.additionalSections)
    ? content.additionalSections
    : defaultContent.additionalSections;

  return <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {content?.title || defaultContent.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content?.description || defaultContent.description}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: {apiContent?.updatedAt
              ? new Date(apiContent.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : content?.lastUpdated || defaultContent.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="prose prose-lg max-w-none">
            {/* Acceptance of Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.acceptanceHeading || defaultContent.acceptanceHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.acceptanceOfTerms || defaultContent.acceptanceOfTerms}
              </p>
            </section>

            {/* Use of Service */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.useOfServiceHeading || defaultContent.useOfServiceHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {content?.useOfServiceIntro || defaultContent.useOfServiceIntro}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {(content?.useOfServiceItems || defaultContent.useOfServiceItems).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Account Responsibilities */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.accountResponsibilitiesHeading || defaultContent.accountResponsibilitiesHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {content?.accountResponsibilitiesIntro || defaultContent.accountResponsibilitiesIntro}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {(content?.accountResponsibilitiesItems || defaultContent.accountResponsibilitiesItems).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Subscription and Billing */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.subscriptionAndBillingHeading || defaultContent.subscriptionAndBillingHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.subscriptionAndBilling || defaultContent.subscriptionAndBilling}
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.intellectualPropertyHeading || defaultContent.intellectualPropertyHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.intellectualProperty || defaultContent.intellectualProperty}
              </p>
            </section>

            {/* Data and Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.dataAndPrivacyHeading || defaultContent.dataAndPrivacyHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {(content?.dataAndPrivacy || defaultContent.dataAndPrivacy).split("Privacy Policy")[0]}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                {(content?.dataAndPrivacy || defaultContent.dataAndPrivacy).split("Privacy Policy").slice(1).join("Privacy Policy")}
              </p>
            </section>

            {/* Service Availability */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.serviceAvailabilityHeading || defaultContent.serviceAvailabilityHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.serviceAvailability || defaultContent.serviceAvailability}
              </p>
            </section>

            {/* Termination */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.terminationHeading || defaultContent.terminationHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.termination || defaultContent.termination}
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.limitationOfLiabilityHeading || defaultContent.limitationOfLiabilityHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.limitationOfLiability || defaultContent.limitationOfLiability}
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.changesToTermsHeading || defaultContent.changesToTermsHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.changesToTerms || defaultContent.changesToTerms}
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.governingLawHeading || defaultContent.governingLawHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {content?.governingLaw || defaultContent.governingLaw}
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                {content?.contactHeading || defaultContent.contactHeading}
              </h2>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="text-muted-foreground mb-2">
                  {content?.contactIntro || defaultContent.contactIntro}
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> {content?.contactEmail || defaultContent.contactEmail}</li>
                  <li><strong>Address:</strong> {content?.contactAddress || defaultContent.contactAddress}</li>
                  <li><strong>Phone:</strong> {content?.contactPhone || defaultContent.contactPhone}</li>
                </ul>
              </div>
            </section>

            {additionalSections.map((section: { title: string; content: string }, index: number) => {
              const sectionNumber = 13 + index;
              const headingText = section.title?.trim() || `Additional Section ${sectionNumber}`;
              const prefixedHeading = /^\d+\./.test(headingText)
                ? headingText
                : `${sectionNumber}. ${headingText}`;

              return (
                <section key={`${section.title}-${index}`} className="mb-12">
                  <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                    {prefixedHeading}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </section>
              );
            })}
            </div>
        </div>
      </section>

    </div>;
}
