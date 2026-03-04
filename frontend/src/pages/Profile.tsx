import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionPlan, Subscription } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';
import { billingService } from '@/api/services/billing.service';
import { BillingPlanService, BillingPlan } from '@/api/services/billing-plan.service';
import { useDashboardStats } from '@/hooks/api/useDashboard';
import CancelSubscriptionDialog from '@/components/billing/CancelSubscriptionDialog';
import { ReferralCodeModal } from '@/components/billing/ReferralCodeModal';
import { EmailSettingsForm } from '@/components/settings/EmailSettingsForm';
import { SendersManagement } from '@/components/settings/SendersManagement';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Check,
  Crown,
  Zap,
  Rocket,
  Clock,
  FileText,
  Users,
  HardDrive,
  AlertCircle,
  Pencil,
  Lock,
  Globe,
  Receipt,
  RefreshCw,
  Wallet,
  Palette,
  Headphones,
  Loader2,
} from 'lucide-react';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Kuwait', label: 'Kuwait (AST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, {
  name: string;
  price: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
  limits: Subscription['limits'];
}> = {
  free: {
    name: 'Starter',
    price: 0,
    icon: Zap,
    color: 'bg-muted text-muted-foreground',
    features: [
      'Up to 3 Invoices per month',
      'Up to 2 Quotes per month',
      'Up to 3 Receipts per month',
      '10 Clients',
      '1 Recurring Subscription',
      'Up to 5 Expense Tracking',
      '1 Custom Template',
    ],
    limits: {
      invoicesPerMonth: 3,
      quotesPerMonth: 2,
      clients: 10,
      teamMembers: 1,
      storageGB: 0.5,
    },
  },
  pro: {
    name: 'Pro',
    price: 19,
    icon: Crown,
    color: 'bg-primary text-primary-foreground',
    features: [
      'Unlimited invoices',
      'Unlimited quotes',
      'Up to 100 clients',
      'Up to 5 team members',
      '10GB storage',
      'Premium templates',
      'Priority support',
      'Custom branding',
      'Recurring invoices',
    ],
    limits: {
      invoicesPerMonth: -1,
      quotesPerMonth: -1,
      clients: 100,
      teamMembers: 5,
      storageGB: 10,
    },
  },
  business: {
    name: 'Business',
    price: 49,
    icon: Rocket,
    color: 'bg-gradient-to-r from-accent to-primary text-primary-foreground',
    features: [
      'Everything in Pro',
      'Unlimited clients',
      'Unlimited team members',
      '100GB storage',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
      'White-label options',
    ],
    limits: {
      invoicesPerMonth: -1,
      quotesPerMonth: -1,
      clients: -1,
      teamMembers: -1,
      storageGB: 100,
    },
  },
};

// Default subscription for users without one
const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  startDate: new Date().toISOString(),
  features: SUBSCRIPTION_PLANS.free.features,
  limits: SUBSCRIPTION_PLANS.free.limits,
  usage: {
    invoicesThisMonth: 0,
    quotesThisMonth: 0,
    currentClients: 0,
    currentTeamMembers: 1,
    storageUsedGB: 0,
  },
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLastChanged, setPasswordLastChanged] = useState<Date | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isSessionsDialogOpen, setIsSessionsDialogOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<any | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState<boolean>((user as any)?.twoFactorEnabled || false);
  const [showTwoFASuccess, setShowTwoFASuccess] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<BillingPlan | null>(null);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    // Invoices
    invoiceDueSoon: true,
    invoiceOverdue: true,
    // Quotes
    quoteViewed: true,
    quoteAccepted: true,
    quoteRejected: true,
    quoteExpired: true,
    // Recurring Subscriptions
    upcomingRenewal: true,
    renewalSuccessful: true,
    renewalPaymentFailed: true,
    subscriptionChanged: true,
    // Priority Email Support
    supportAgentReplied: true,
    ticketResolved: true,
    // Push
    pushNotifications: true,
  });

  // Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    address: user?.address || '',
    timezone: user?.timezone || 'UTC',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start with whatever is in the auth user object
  const subscription = user?.subscription || DEFAULT_SUBSCRIPTION;

  const { data: subscriptionInfo } = useQuery({
    queryKey: ['billing', 'me'],
    queryFn: () => billingService.getSubscriptionInfo(),
    enabled: !!user?.id,
  });

  const { data: publicPlansResponse, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['billing-plans', 'public', 'active'],
    queryFn: () => BillingPlanService.getPublicPlans('active', 50, 0),
    enabled: !!user?.id,
  });
  const { data: billingHistory = [], isLoading: isLoadingBillingHistory } = useQuery({
    queryKey: ['billing', 'history'],
    queryFn: () => billingService.getBillingHistory(),
    enabled: !!user?.id,
  });
  const { data: dashboardStats } = useDashboardStats();

  // Resolve current plan info safely. `subscription.plan` may be a string key
  // or a plan object returned by the billing API. Map known cases and
  // fall back to the `free` plan to avoid runtime errors when `color` or
  // other properties are accessed.
  let currentPlanInfo = SUBSCRIPTION_PLANS.free;
  try {
    if (typeof subscription.plan === 'string') {
      if ((SUBSCRIPTION_PLANS as any)[subscription.plan]) {
        currentPlanInfo = (SUBSCRIPTION_PLANS as any)[subscription.plan];
      }
    } else if (subscription.plan && typeof subscription.plan === 'object') {
      const planObj: any = subscription.plan;
      // Prefer explicit mapping by known plan names
      if (planObj.name) {
        const nameLower = String(planObj.name).toLowerCase();
        if (nameLower.includes('pro')) currentPlanInfo = SUBSCRIPTION_PLANS.pro;
        else if (nameLower.includes('business')) currentPlanInfo = SUBSCRIPTION_PLANS.business;
        else currentPlanInfo = SUBSCRIPTION_PLANS.free;
      } else if (typeof planObj.price === 'number') {
        currentPlanInfo = planObj.price > 0 ? SUBSCRIPTION_PLANS.pro : SUBSCRIPTION_PLANS.free;
      }
    }
  } catch (e) {
    currentPlanInfo = SUBSCRIPTION_PLANS.free;
  }

  const currentPlanId = subscriptionInfo?.plan?._id || '';
  const subscriptionStatus = subscriptionInfo?.status || subscription?.status || 'active';
  const isCanceledStatus =
    subscriptionStatus === 'canceled' || subscriptionStatus === 'cancelled';
  const hasScheduledCancellation =
    !isCanceledStatus &&
    !!subscriptionInfo?.accessUntilDate &&
    (subscriptionStatus === 'active' ||
      subscriptionStatus === 'trialing' ||
      subscriptionStatus === 'past_due' ||
      subscriptionStatus === 'incomplete');
  const isCancelledSubscription = isCanceledStatus || hasScheduledCancellation;
  // For profile subscription tab, show Free once cancellation is initiated.
  const currentPlanName = isCancelledSubscription
    ? 'Free'
    : (subscriptionInfo?.plan?.name || currentPlanInfo.name);
  const currentPlanStatus = isCancelledSubscription
    ? 'cancelled'
    : subscriptionStatus;
  const currentPlanBadgeName = currentPlanName || currentPlanInfo.name;
  const normalizedCurrentPlanName = currentPlanBadgeName.toLowerCase();
  const currentPlanBadgeStyle =
    normalizedCurrentPlanName.includes('business')
      ? SUBSCRIPTION_PLANS.business
      : normalizedCurrentPlanName.includes('pro') || normalizedCurrentPlanName.includes('premium')
      ? SUBSCRIPTION_PLANS.pro
      : SUBSCRIPTION_PLANS.free;
  const currentPeriodEnd =
    subscriptionInfo?.accessUntilDate ||
    subscriptionInfo?.currentPeriodEnd ||
    subscription.endDate ||
    null;
  // When cancelled, use free plan limits instead of the old plan limits
  const currentPlanLimits = isCancelledSubscription 
    ? null 
    : (subscriptionInfo?.plan?.limits || null);
  const fallbackLimits = isCancelledSubscription
    ? DEFAULT_SUBSCRIPTION.limits
    : (subscription?.limits || DEFAULT_SUBSCRIPTION.limits);
  const fallbackUsage = subscription?.usage || DEFAULT_SUBSCRIPTION.usage;
  const invoicesUsed = dashboardStats?.overview?.totalInvoices ?? fallbackUsage.invoicesThisMonth ?? 0;
  const quotesUsed = dashboardStats?.overview?.totalQuotes ?? fallbackUsage.quotesThisMonth ?? 0;
  const clientsUsed = dashboardStats?.overview?.totalClients ?? fallbackUsage.currentClients ?? 0;
  const receiptsUsed = (dashboardStats as any)?.overview?.totalReceipts ?? 0;
  const hasPaidPlan = isCancelledSubscription
    ? false
    : subscriptionInfo?.plan
    ? subscriptionInfo.plan.price > 0
    : subscription.plan !== 'free';
  const availableUpgradePlans = useMemo(
    () =>
      (publicPlansResponse?.items || [])
        .filter((plan) => plan.status === 'active' && plan.price > 0)
        .filter((plan) => !currentPlanId || plan._id !== currentPlanId),
    [publicPlansResponse?.items, currentPlanId],
  );
  const isSingleUpgradePlan = availableUpgradePlans.length === 1;

  useEffect(() => {
    if (!selectedPlanId && availableUpgradePlans.length > 0) {
      setSelectedPlanId(availableUpgradePlans[0]._id);
    }
  }, [availableUpgradePlans, selectedPlanId]);

  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const response = await axios.get('/userprofile');
        const profile = response.data;

        setProfileForm((prev) => ({
          ...prev,
          name: profile?.fullName || user.fullName || user.name || '',
          email: profile?.email || user.email || '',
          phone: profile?.phoneNumber || '',
          company: profile?.companyName || '',
          address: profile?.businessAddress || '',
          timezone: profile?.timeZone || 'UTC',
        }));

        // Load notification preferences
        setNotifications((prev) => ({
          invoiceDueSoon: profile?.invoiceDueSoon !== false,
          invoiceOverdue: profile?.invoiceOverdue !== false,
          quoteViewed: profile?.quoteViewed !== false,
          quoteAccepted: profile?.quoteAccepted !== false,
          quoteRejected: profile?.quoteRejected !== false,
          quoteExpired: profile?.quoteExpired !== false,
          upcomingRenewal: profile?.upcomingRenewal !== false,
          renewalSuccessful: profile?.renewalSuccessful !== false,
          renewalPaymentFailed: profile?.renewalPaymentFailed !== false,
          subscriptionChanged: profile?.subscriptionChanged !== false,
          supportAgentReplied: profile?.supportAgentReplied !== false,
          ticketResolved: profile?.ticketResolved !== false,
          pushNotifications: profile?.pushNotifications !== false,
        }));

        // Set superadmin flag
        setIsSuperAdmin(profile?.isSuperAdmin || false);

        // Sync 2FA status from profile
        if (profile?.twoFactorEnabled !== undefined) {
          setIsTwoFAEnabled(profile.twoFactorEnabled);
        }

        updateUser({
          ...user,
          fullName: profile?.fullName || user.fullName,
          name: profile?.fullName || user.name || user.fullName,
          email: profile?.email || user.email,
          avatar: user.avatar || profile?.profileImage,
          twoFactorEnabled: profile?.twoFactorEnabled || false,
        } as any);
      } catch {
        // No userprofile yet is valid for some manual users; keep current form defaults.
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleUpdateProfile = async () => {
    if (!user?.id) {
      toast({
        title: 'Update Failed',
        description: 'User not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent multiple submissions
    if (isSavingProfile) return;
    setIsSavingProfile(true);

    try {
      // Keep core user record in sync for auth/sidebar display.
      await axios.patch(`/user/${user.id}`, {
        fullName: profileForm.name,
        email: profileForm.email,
      });

      const profilePayload = {
        fullName: profileForm.name,
        email: profileForm.email,
        phoneNumber: profileForm.phone,
        companyName: profileForm.company,
        businessAddress: profileForm.address,
        timeZone: profileForm.timezone,
      };

      // Update profile document; create it if it does not exist.
      try {
        await axios.patch('/userprofile', profilePayload);
      } catch (profileError: any) {
        if (profileError?.response?.status === 404) {
          await axios.post('/userprofile', profilePayload);
        } else {
          throw profileError;
        }
      }

      updateUser({
        ...user,
        fullName: profileForm.name,
        name: profileForm.name,
        email: profileForm.email,
      } as any);

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error?.response?.data?.message || 'Could not update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (!passwordForm.currentPassword) {
      toast({
        title: 'Current Password Required',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.patch('/user/change-password/self', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordLastChanged(new Date());
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Password Change Failed',
        description: error?.response?.data?.message || 'Could not change password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveNotifications = async (notificationsToSave?: typeof notifications) => {
    const prefsToSave = notificationsToSave || notifications;
    
    if (isSavingNotifications) return;
    setIsSavingNotifications(true);

    try {
      await axios.patch('/userprofile', prefsToSave);
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error?.response?.data?.message || 'Could not save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Upload file to backend which will proxy the upload to Cloudinary using server credentials
      const fd = new FormData();
      fd.append('file', file);

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const uploadResponse = await fetch(`${apiBase}/userprofile/upload-image`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: fd,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text().catch(() => null);
        throw new Error(errText || 'Failed to upload image to server');
      }

      const data = await uploadResponse.json();
      const imageUrl = data.profileImage || data.profile?.profileImage || data.secure_url || data.url;

      if (!imageUrl) {
        throw new Error('Upload succeeded but no image URL returned');
      }

      // Sync avatar into auth context/localStorage
      if (user) {
        updateUser({
          ...user,
          avatar: imageUrl,
        } as any);
      }

      toast({ title: 'Avatar Updated', description: 'Your profile picture has been updated successfully.' });

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpgradePlan = async (plan: BillingPlan) => {
    // Show referral modal first
    setSelectedUpgradePlan(plan);
    setSelectedPlanId(plan._id);
    setShowReferralModal(true);
  };

  const handleProceedWithUpgrade = async (referralCode?: string) => {
    if (!selectedUpgradePlan) return;

    try {
      setShowReferralModal(false);
      setIsStartingCheckout(true);
      const checkout = await billingService.createCheckoutSession(
        selectedUpgradePlan._id,
        selectedUpgradePlan.interval,
        selectedUpgradePlan.currency || 'USD',
        referralCode,
      );
      if (!checkout?.url) {
        throw new Error('Missing checkout URL');
      }
      window.location.href = checkout.url;
    } catch (error: any) {
      toast({
        title: 'Upgrade Failed',
        description: error?.response?.data?.message || error?.message || 'Could not start checkout.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingCheckout(false);
      setIsUpgradeDialogOpen(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    if (!limit || limit <= 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toString();
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await axios.get('/sessions/me');
      setSessions(res.data);
    } catch (e) {
      toast({ title: 'Failed to load sessions', variant: 'destructive' });
    } finally {
      setLoadingSessions(false);
    }
  };

  const summarizeUserAgent = (ua: string | undefined) => {
    if (!ua) return 'Unknown device';
    const u = ua;
    let browser = 'Browser';
    if (/Edg\//i.test(u)) browser = 'Edge';
    else if (/Chrome\//i.test(u) && !/Edg\//i.test(u)) browser = 'Chrome';
    else if (/Firefox\//i.test(u)) browser = 'Firefox';
    else if (/Safari\//i.test(u) && !/Chrome\//i.test(u)) browser = 'Safari';

    let os = 'Unknown OS';
    if (/Android/i.test(u)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(u)) os = 'iOS';
    else if (/Mac OS X|Macintosh/i.test(u)) os = 'macOS';
    else if (/Windows NT/i.test(u)) os = 'Windows';
    else if (/Linux/i.test(u)) os = 'Linux';

    return `${browser} · ${os}`;
  };

  const handleRevokeSession = async (id: string) => {
    setRevokeLoading(id);
    try {
      await axios.delete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast({ title: 'Session revoked' });
    } catch (e) {
      toast({ title: 'Failed to revoke session', variant: 'destructive' });
    } finally {
      setRevokeLoading(null);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Sync 2FA status from user object
    if (user?.id) {
      setIsTwoFAEnabled((user as any)?.twoFactorEnabled || false);
    }
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account and subscription</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:inline-grid" style={{ gridTemplateColumns: isSuperAdmin ? 'repeat(3, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))' }}>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:inline" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4 hidden sm:inline" />
              Security
            </TabsTrigger>
            {!isSuperAdmin && (
              <>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4 hidden sm:inline" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4 hidden sm:inline" />
                  Notifications
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and preferences</CardDescription>
                  </div>
                  <Button
                    variant={isEditingProfile ? 'default' : 'outline'}
                    onClick={() => isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true)}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditingProfile ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditingProfile && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={currentPlanBadgeStyle.color}>
                        <currentPlanBadgeStyle.icon className="h-3 w-3 mr-1" />
                        {currentPlanBadgeName} Plan
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Member since {format(new Date(user?.createdAt || Date.now()), 'MMMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: filterPhoneInput(e.target.value) })}
                      disabled={!isEditingProfile}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Company Name
                    </Label>
                    <Input
                      id="company"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      disabled={!isEditingProfile}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Business Address
                    </Label>
                    <Textarea
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      disabled={!isEditingProfile}
                      placeholder="Enter business address"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Timezone
                    </Label>
                    <Select
                      value={profileForm.timezone}
                      onValueChange={(value) => setProfileForm({ ...profileForm, timezone: value })}
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Plan: {currentPlanName}
                    </CardTitle>
                    <CardDescription>
                      {currentPlanStatus === 'active' && 'Your subscription is active'}
                      {currentPlanStatus === 'trial' && subscription?.trialEndsAt &&
                        `Trial ends ${format(new Date(subscription.trialEndsAt), 'MMMM d, yyyy')}`}
                      {currentPlanStatus === 'cancelled' && currentPeriodEnd &&
                        `Access until ${format(new Date(currentPeriodEnd), 'MMMM d, yyyy')}`}
                    </CardDescription>
                  </div>
                  <Badge variant={currentPlanStatus === 'active' ? 'default' : 'secondary'}>
                    {currentPlanStatus.charAt(0).toUpperCase() + currentPlanStatus.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Limits Grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Invoices per month</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.invoices === -1
                            ? 'Unlimited'
                            : currentPlanLimits?.invoices ?? formatLimit(fallbackLimits.invoicesPerMonth)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          invoicesUsed,
                          currentPlanLimits?.invoices ?? fallbackLimits.invoicesPerMonth,
                        )}
                        className="h-1.5"
                      />
                      <span className="text-xs text-muted-foreground">
                        {invoicesUsed} of{' '}
                        {currentPlanLimits?.invoices === -1
                          ? 'Unlimited'
                          : currentPlanLimits?.invoices ?? fallbackLimits.invoicesPerMonth}{' '}
                        used
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quotes per month</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.quotes === -1
                            ? 'Unlimited'
                            : currentPlanLimits?.quotes ?? formatLimit(fallbackLimits.quotesPerMonth)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          quotesUsed,
                          currentPlanLimits?.quotes ?? fallbackLimits.quotesPerMonth,
                        )}
                        className="h-1.5"
                      />
                      <span className="text-xs text-muted-foreground">
                        {quotesUsed} of{' '}
                        {currentPlanLimits?.quotes === -1
                          ? 'Unlimited'
                          : currentPlanLimits?.quotes ?? fallbackLimits.quotesPerMonth}{' '}
                        used
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/10">
                      <Receipt className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Receipts per month</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.receipts === -1
                            ? 'Unlimited'
                            : currentPlanLimits?.receipts ?? 'N/A'}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          receiptsUsed,
                          (currentPlanLimits?.receipts as number) ?? 0,
                        )}
                        className="h-1.5"
                      />
                      <span className="text-xs text-muted-foreground">
                        {receiptsUsed} of{' '}
                        {currentPlanLimits?.receipts === -1
                          ? 'Unlimited'
                          : currentPlanLimits?.receipts ?? 'N/A'}{' '}
                        used
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-orange-500/10">
                      <Users className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Clients</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.clients === -1
                            ? 'Unlimited'
                            : currentPlanLimits?.clients ?? formatLimit(fallbackLimits.clients)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          clientsUsed,
                          currentPlanLimits?.clients ?? fallbackLimits.clients,
                        )}
                        className="h-1.5"
                      />
                      <span className="text-xs text-muted-foreground">
                        {clientsUsed} of{' '}
                        {currentPlanLimits?.clients === -1
                          ? 'Unlimited'
                          : currentPlanLimits?.clients ?? fallbackLimits.clients}{' '}
                        used
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500/10">
                      <RefreshCw className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Recurring Subscription</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.recurringInvoices === -1
                            ? 'Unlimited'
                            : currentPlanLimits?.recurringInvoices ?? 'N/A'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-rose-500/10">
                      <Wallet className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expense Tracking</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.expenseTracking ? 'Included' : 'Not included'}
                        </span>
                      </div>
                      <Progress value={currentPlanLimits?.expenseTracking ? 100 : 0} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">
                        {currentPlanLimits?.expenseTracking ? 'Enabled for your plan' : 'Upgrade required'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 sm:col-span-2 lg:col-span-1">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-teal-500/10">
                      <Palette className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Custom Template</span>
                        <span className="text-sm font-semibold">
                          {currentPlanLimits?.invoiceTemplates || 'N/A'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {availableUpgradePlans.length > 0 && (
                    <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" disabled={isLoadingPlans}>
                          <Zap className="h-4 w-4" />
                          Upgrade Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Upgrade Your Plan</DialogTitle>
                          <DialogDescription>
                            Choose a plan from your active billing plans
                          </DialogDescription>
                        </DialogHeader>
                        <div
                          className={`grid gap-6 py-4 ${
                            isSingleUpgradePlan ? 'grid-cols-1 place-items-center' : 'sm:grid-cols-2'
                          }`}
                        >
                          {availableUpgradePlans.map((plan) => (
                            <div
                              key={plan._id}
                              className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                                selectedPlanId === plan._id
                                  ? 'border-primary shadow-lg shadow-primary/20'
                                  : 'border-border hover:border-primary/50'
                              } ${isSingleUpgradePlan ? 'w-full max-w-md' : ''}`}
                              onClick={() => setSelectedPlanId(plan._id)}
                            >
                              <Badge className="mb-4" variant={plan.isPopular ? 'default' : 'outline'}>
                                {plan.name}
                              </Badge>
                              <p className="text-sm text-muted-foreground mb-4">
                                {plan.features?.[0] || 'Upgrade your account with this plan.'}
                              </p>
                              <div className="mb-6">
                                <span className="text-4xl font-bold">
                                  {plan.currency} {plan.price}
                                </span>
                                <span className="text-muted-foreground">/{plan.interval}</span>
                              </div>
                              <ul className="space-y-3">
                                {(plan.features || []).slice(0, 8).map((feature, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              <Button
                                className="w-full mt-6"
                                variant={selectedPlanId === plan._id ? 'default' : 'outline'}
                                disabled={isStartingCheckout}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlanId(plan._id);
                                  handleUpgradePlan(plan);
                                }}
                              >
                                {isStartingCheckout && selectedPlanId === plan._id ? 'Redirecting...' : 'Upgrade'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {hasPaidPlan && currentPlanStatus !== 'cancelled' && (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBillingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                    <p>Loading billing history...</p>
                  </div>
                ) : billingHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No billing history available</p>
                    <p className="text-sm">Your payment history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billingHistory.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {item.plan} {item.billingCycle ? `(${item.billingCycle})` : ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.transactionDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {item.currency} {Number(item.amount || 0).toFixed(2)}
                          </p>
                          <Badge
                            variant={item.status === 'succeeded' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <CancelSubscriptionDialog
              isOpen={isCancelDialogOpen}
              onClose={() => setIsCancelDialogOpen(false)}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Password
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Last changed: {passwordLastChanged ? format(passwordLastChanged, 'MMM dd, yyyy \'at\' HH:mm') : 'Never'}
                    </p>
                  </div>
                  <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleChangePassword}>Update Password</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50/50 to-transparent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      {isTwoFAEnabled && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isTwoFAEnabled ? '✓ Your account is now protected with 2FA' : 'Add an extra layer of security to your account'}
                    </p>
                  </div>
                  <Button 
                    variant={isTwoFAEnabled ? 'ghost' : 'outline'}
                    onClick={async () => {
                      try {
                        const res = await axios.get('/auth/2fa/setup');
                        setTwoFASetup(res.data);
                        setIs2FASetupOpen(true);
                      } catch (e) {
                        toast({ title: 'Failed to initialize 2FA', variant: 'destructive' });
                      }
                    }}>
                    {isTwoFAEnabled ? '✓ Enabled' : 'Enable 2FA'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage devices where you're logged in
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => { setIsSessionsDialogOpen(true); fetchSessions(); }}>View Sessions</Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                const userId = (user as any)?.id || (user as any)?._id;
                                if (!userId) return;
                                const t = toast({ title: 'Deleting account...', description: 'This will permanently remove your account.' });
                                try {
                                  await axios.delete(`/user/${userId}`);
                                  t.update({ title: 'Account deleted', description: 'Your account has been removed.' });
                                  // clear local session and redirect home
                                  logout();
                                  // navigate to home
                                  navigate('/');
                                } catch (err: any) {
                                  console.error('Failed to delete account', err);
                                  t.update({ title: 'Failed to delete account', description: err?.response?.data?.message || err?.message || 'Please try again', variant: 'destructive' });
                                }
                              }}
                            >
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings Tab - Only for Regular Users */}
          {!isSuperAdmin && (
            <TabsContent value="email" className="space-y-6">
              <EmailSettingsForm />
              <SendersManagement />
            </TabsContent>
          )}

          {/* Notifications Tab - Only for Regular Users */}
          {!isSuperAdmin && (
            <TabsContent value="notifications" className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Configure which email notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoices Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Invoices</h4>
                  </div>
                  {[
                    { key: 'invoiceDueSoon', label: 'Invoice due soon', description: 'Get notified when payment is approaching' },
                    { key: 'invoiceOverdue', label: 'Invoice overdue', description: 'Alert when an invoice passes its due date' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        disabled={isSavingNotifications}
                        onCheckedChange={(checked) => {
                          const updated = { ...notifications, [item.key]: checked };
                          setNotifications(updated);
                          handleSaveNotifications(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Quotes Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Quotes</h4>
                  </div>
                  {[
                    { key: 'quoteViewed', label: 'Quote viewed', description: 'When a client opens your quote' },
                    { key: 'quoteAccepted', label: 'Quote accepted', description: 'When a client accepts your quote' },
                    { key: 'quoteRejected', label: 'Quote rejected', description: 'When a client rejects your quote' },
                    { key: 'quoteExpired', label: 'Quote expired', description: 'When a quote passes its expiry date' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        disabled={isSavingNotifications}
                        onCheckedChange={(checked) => {
                          const updated = { ...notifications, [item.key]: checked };
                          setNotifications(updated);
                          handleSaveNotifications(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Recurring Subscriptions Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Recurring Subscriptions</h4>
                  </div>
                  {[
                    { key: 'upcomingRenewal', label: 'Upcoming renewal', description: 'Reminder before subscription renews' },
                    { key: 'renewalSuccessful', label: 'Renewal successful', description: 'Confirmation when payment goes through' },
                    { key: 'renewalPaymentFailed', label: 'Renewal payment failed', description: 'Alert when renewal payment fails' },
                    { key: 'subscriptionChanged', label: 'Subscription upgraded/downgraded', description: 'When plan changes are made' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        disabled={isSavingNotifications}
                        onCheckedChange={(checked) => {
                          const updated = { ...notifications, [item.key]: checked };
                          setNotifications(updated);
                          handleSaveNotifications(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Priority Email Support Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Headphones className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Priority Email Support</h4>
                  </div>
                  {[
                    { key: 'supportAgentReplied', label: 'Support agent replied', description: 'When support responds to your ticket' },
                    { key: 'ticketResolved', label: 'Ticket resolved/closed', description: 'When your support ticket is closed' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        disabled={isSavingNotifications}
                        onCheckedChange={(checked) => {
                          const updated = { ...notifications, [item.key]: checked };
                          setNotifications(updated);
                          handleSaveNotifications(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>In-app and browser notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <h4 className="font-medium">Enable push notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    disabled={isSavingNotifications}
                    onCheckedChange={(checked) => {
                      const updated = { ...notifications, pushNotifications: checked };
                      setNotifications(updated);
                      handleSaveNotifications(updated);
                    }}
                  />
                </div>

                {notifications.pushNotifications && (
                  <div className="space-y-4">
                    {/* Invoices Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <FileText className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Invoices</h4>
                      </div>
                      {[
                        { key: 'invoiceDueSoon', label: 'Invoice due soon' },
                        { key: 'invoiceOverdue', label: 'Invoice overdue' },
                      ].map((item) => (
                        <div key={`push-${item.key}`} className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                          <span className="text-sm">{item.label}</span>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              setNotifications({ ...notifications, [item.key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Quotes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <FileText className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Quotes</h4>
                      </div>
                      {[
                        { key: 'quoteViewed', label: 'Quote viewed' },
                        { key: 'quoteAccepted', label: 'Quote accepted' },
                        { key: 'quoteRejected', label: 'Quote rejected' },
                        { key: 'quoteExpired', label: 'Quote expired' },
                      ].map((item) => (
                        <div key={`push-${item.key}`} className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                          <span className="text-sm">{item.label}</span>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              setNotifications({ ...notifications, [item.key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Recurring Subscriptions Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Recurring Subscriptions</h4>
                      </div>
                      {[
                        { key: 'upcomingRenewal', label: 'Upcoming renewal' },
                        { key: 'renewalSuccessful', label: 'Renewal successful' },
                        { key: 'renewalPaymentFailed', label: 'Renewal payment failed' },
                        { key: 'subscriptionChanged', label: 'Subscription upgraded/downgraded' },
                      ].map((item) => (
                        <div key={`push-${item.key}`} className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                          <span className="text-sm">{item.label}</span>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              setNotifications({ ...notifications, [item.key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Priority Email Support Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Headphones className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Priority Email Support</h4>
                      </div>
                      {[
                        { key: 'supportAgentReplied', label: 'Support agent replied' },
                        { key: 'ticketResolved', label: 'Ticket resolved/closed' },
                      ].map((item) => (
                        <div key={`push-${item.key}`} className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                          <span className="text-sm">{item.label}</span>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              setNotifications({ ...notifications, [item.key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Sessions Dialog */}
      <Dialog open={isSessionsDialogOpen} onOpenChange={setIsSessionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
            <DialogDescription>Devices and browsers where you are logged in.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No active sessions found.</div>
            ) : (
              <ul className="divide-y">
                {sessions.map((session) => {
                  const currentToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                  const isCurrent = currentToken && session.sessionToken === currentToken;
                  return (
                    <li key={session._id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{summarizeUserAgent(session.userAgent)}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(session.createdAt), "MMM d, yyyy, h:mm a")}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCurrent ? (
                          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">This device</span>
                        ) : null}
                        <Button size="sm" variant="destructive" disabled={revokeLoading === session._id || isCurrent} onClick={() => handleRevokeSession(session._id)}>
                          {revokeLoading === session._id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                          Revoke
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={is2FASetupOpen} onOpenChange={setIs2FASetupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Scan the QR with your authenticator app and enter the 6-digit code.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {showTwoFASuccess ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-green-700 mb-1">2FA Successfully Enabled! 🎉</h3>
                  <p className="text-sm text-muted-foreground">Your account is now protected with two-factor authentication.</p>
                </div>
              </div>
            ) : twoFASetup ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-semibold mb-1">Scan QR Code</h3>
                  <p className="text-xs text-muted-foreground">Use Google Authenticator, Authy, or Microsoft Authenticator</p>
                </div>
                <img src={twoFASetup.qr} alt="2FA QR" className="w-40 h-40 border border-gray-200 rounded-lg p-2" />
                <div className="w-full text-center">
                  <p className="text-xs text-muted-foreground mb-2">Can't scan? Enter manually:</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded text-center break-all">{twoFASetup.secret}</p>
                </div>
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code:</p>
                  <Input 
                    value={twoFACode} 
                    onChange={(e) => setTwoFACode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
                    placeholder="000000" 
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6 flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Initializing...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIs2FASetupOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!twoFACode || !twoFASetup) return toast({ title: 'Enter code', variant: 'destructive' });
              setIsEnabling2FA(true);
              try {
                await axios.post('/auth/2fa/enable', { secret: twoFASetup.secret, token: twoFACode });
                setIsTwoFAEnabled(true);
                setShowTwoFASuccess(true);
                setTwoFACode('');
                setTimeout(() => {
                  setIs2FASetupOpen(false);
                  setShowTwoFASuccess(false);
                }, 2000);
                toast({ 
                  title: '✅ Two-Factor Authentication Enabled!', 
                  description: 'Your account is now protected. You will be asked for a 6-digit code on next login.' 
                });
              } catch (e) {
                toast({ title: 'Failed to enable 2FA', variant: 'destructive' });
              } finally {
                setIsEnabling2FA(false);
              }
            }} disabled={isEnabling2FA}>{isEnabling2FA ? 'Enabling...' : 'Enable'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Code Modal */}
      <ReferralCodeModal
        open={showReferralModal}
        onOpenChange={setShowReferralModal}
        onContinue={handleProceedWithUpgrade}
        isLoading={isStartingCheckout}
      />

    </DashboardLayout>
  );
}
