import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===== Type Definitions =====

// Feature Item
export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  order: number;
}

// Stat Item
export interface StatItem {
  icon: string;
  value: string;
  label: string;
}

// How It Works Step
export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
  features: string[];
  order: number;
}

// Testimonial Item
export interface TestimonialItem {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  order: number;
}

// Pricing Plan
export interface PricingPlan {
  name: string;
  badge: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  order: number;
}

// Footer Link
export interface FooterLink {
  label: string;
  href: string;
}

// Section Interfaces
export interface HeroSection {
  badge: string;
  headline: string;
  subheadline: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

export interface FeaturesSection {
  badge: string;
  headline: string;
  description: string;
  features: FeatureItem[];
}

export interface StatsSection {
  stats: StatItem[];
}

export interface HowItWorksSection {
  badge: string;
  headline: string;
  description: string;
  steps: HowItWorksStep[];
}

export interface TestimonialsSection {
  badge: string;
  headline: string;
  testimonials: TestimonialItem[];
  enabled: boolean;
}

export interface PricingSection {
  headline: string;
  description: string;
  plans: PricingPlan[];
  enabled: boolean;
  showYearlyToggle: boolean;
}

export interface CTASection {
  headline: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  disclaimer: string;
  enabled: boolean;
}

export interface FooterSection {
  companyName: string;
  description: string;
  copyright: string;
  socialMediaLinks: FooterLink[];
  supportLinks: FooterLink[];
  corporateLinks: FooterLink[];
  showSocialLinks: boolean;
  // Optional CTA for corporate login
  corporateLoginLabel?: string;
  corporateLoginHref?: string;
}

// Main Landing Page Interface
export interface LandingPage {
  _id?: string;
  heroSection: HeroSection;
  featuresSection: FeaturesSection;
  statsSection: StatsSection;
  howItWorksSection: HowItWorksSection;
  testimonialsSection: TestimonialsSection;
  pricingSection: PricingSection;
  ctaSection: CTASection;
  footerSection: FooterSection;
  createdAt?: string;
  updatedAt?: string;
}

// Update DTOs
export type UpdateLandingPageDto = Partial<LandingPage>;

export type UpdateSectionDto = 
  | Partial<HeroSection>
  | Partial<FeaturesSection>
  | Partial<StatsSection>
  | Partial<HowItWorksSection>
  | Partial<TestimonialsSection>
  | Partial<PricingSection>
  | Partial<CTASection>
  | Partial<FooterSection>;

// Section Names Type
export type SectionName = 
  | 'heroSection'
  | 'featuresSection'
  | 'statsSection'
  | 'howItWorksSection'
  | 'testimonialsSection'
  | 'pricingSection'
  | 'ctaSection'
  | 'footerSection';

// ===== Helper Functions =====

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// ===== API Service =====

export const landingPageService = {
  /**
   * Get landing page settings (public endpoint)
   */
  async getSettings(): Promise<LandingPage> {
    const response = await axios.get(`${API_BASE_URL}/landing-page`);
    return response.data;
  },

  /**
   * Update all landing page settings (admin only)
   */
  async updateSettings(dto: UpdateLandingPageDto): Promise<LandingPage> {
    const response = await axios.patch(
      `${API_BASE_URL}/landing-page`,
      dto,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Update a specific section (admin only)
   */
  async updateSection(section: SectionName, data: UpdateSectionDto): Promise<LandingPage> {
    const response = await axios.patch(
      `${API_BASE_URL}/landing-page/section/${section}`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Reset landing page to defaults (admin only)
   */
  async resetToDefaults(): Promise<LandingPage> {
    const response = await axios.post(
      `${API_BASE_URL}/landing-page/reset`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  // ===== Section-Specific Update Methods =====

  /**
   * Update hero section
   */
  async updateHeroSection(data: Partial<HeroSection>): Promise<LandingPage> {
    return this.updateSection('heroSection', data);
  },

  /**
   * Update features section
   */
  async updateFeaturesSection(data: Partial<FeaturesSection>): Promise<LandingPage> {
    return this.updateSection('featuresSection', data);
  },

  /**
   * Update stats section
   */
  async updateStatsSection(data: Partial<StatsSection>): Promise<LandingPage> {
    return this.updateSection('statsSection', data);
  },

  /**
   * Update how it works section
   */
  async updateHowItWorksSection(data: Partial<HowItWorksSection>): Promise<LandingPage> {
    return this.updateSection('howItWorksSection', data);
  },

  /**
   * Update testimonials section
   */
  async updateTestimonialsSection(data: Partial<TestimonialsSection>): Promise<LandingPage> {
    return this.updateSection('testimonialsSection', data);
  },

  /**
   * Update pricing section
   */
  async updatePricingSection(data: Partial<PricingSection>): Promise<LandingPage> {
    return this.updateSection('pricingSection', data);
  },

  /**
   * Update CTA section
   */
  async updateCTASection(data: Partial<CTASection>): Promise<LandingPage> {
    return this.updateSection('ctaSection', data);
  },

  /**
   * Update footer section
   */
  async updateFooterSection(data: Partial<FooterSection>): Promise<LandingPage> {
    return this.updateSection('footerSection', data);
  },
};

export default landingPageService;
