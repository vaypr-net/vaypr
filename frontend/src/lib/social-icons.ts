import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Globe,
  Youtube,
  Github,
  type LucideIcon
} from "lucide-react";

// Icon mapping for social platforms
export const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter, // X (formerly Twitter)
  linkedin: Linkedin,
  tiktok: Globe,
  youtube: Youtube,
  github: Github,
  website: Globe,
  globe: Globe,
};

// Get icon component by name
export function getSocialIcon(iconName: string): LucideIcon {
  const normalizedName = iconName.toLowerCase();
  return SOCIAL_ICON_MAP[normalizedName] || Globe;
}

// Available social platforms
export const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: 'facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'instagram' },
  { value: 'twitter', label: 'X (Twitter)', icon: 'twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { value: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { value: 'youtube', label: 'YouTube', icon: 'youtube' },
  { value: 'github', label: 'GitHub', icon: 'github' },
  { value: 'website', label: 'Website', icon: 'globe' },
] as const;
