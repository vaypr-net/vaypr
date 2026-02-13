import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
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
    invoicesThisMonth: 3,
    quotesThisMonth: 2,
    currentClients: 5,
    currentTeamMembers: 1,
    storageUsedGB: 0.15,
  },
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLastChanged, setPasswordLastChanged] = useState<Date | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
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

  const subscription = user?.subscription || DEFAULT_SUBSCRIPTION;
  const currentPlanInfo = SUBSCRIPTION_PLANS[subscription.plan];

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

        updateUser({
          ...user,
          fullName: profile?.fullName || user.fullName,
          name: profile?.fullName || user.name || user.fullName,
          email: profile?.email || user.email,
          avatar: user.avatar || profile?.profileImage,
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
      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'vayper_avatar'); // You may need to adjust this

      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        'https://api.cloudinary.com/v1_1/da378hbeu/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const imageUrl = cloudinaryData.secure_url;

      // Update user avatar in database via API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/user/${user?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ avatar: imageUrl }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Sync avatar into auth context/localStorage
      if (user) {
        updateUser({
          ...user,
          avatar: imageUrl,
        } as any);
      }

      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully.',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpgradePlan = () => {
    toast({
      title: 'Upgrade Initiated',
      description: `Upgrading to ${SUBSCRIPTION_PLANS[selectedPlan].name} plan. You'll be redirected to checkout.`,
    });
    setIsUpgradeDialogOpen(false);
  };

  const handleCancelSubscription = () => {
    toast({
      title: 'Subscription Cancelled',
      description: 'Your subscription will remain active until the end of the billing period.',
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toString();
  };

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
          <TabsList className="grid w-full lg:w-auto lg:inline-grid" style={{ gridTemplateColumns: isSuperAdmin ? 'repeat(3, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' }}>
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
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4 hidden sm:inline" />
                Notifications
              </TabsTrigger>
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
                      <Badge className={currentPlanInfo.color}>
                        <currentPlanInfo.icon className="h-3 w-3 mr-1" />
                        {currentPlanInfo.name} Plan
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
                      <currentPlanInfo.icon className="h-5 w-5" />
                      Current Plan: {currentPlanInfo.name}
                    </CardTitle>
                    <CardDescription>
                      {subscription.status === 'active' && 'Your subscription is active'}
                      {subscription.status === 'trial' && subscription.trialEndsAt && 
                        `Trial ends ${format(new Date(subscription.trialEndsAt), 'MMMM d, yyyy')}`}
                      {subscription.status === 'cancelled' && subscription.endDate && 
                        `Access until ${format(new Date(subscription.endDate), 'MMMM d, yyyy')}`}
                    </CardDescription>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Limits Grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Invoices per month */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Invoices per month</span>
                        <span className="text-sm font-semibold">3</span>
                      </div>
                      <Progress value={66} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">2 of 3 used</span>
                    </div>
                  </div>

                  {/* Quotes per month */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quotes per month</span>
                        <span className="text-sm font-semibold">Up to 2</span>
                      </div>
                      <Progress value={50} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">1 of 2 used</span>
                    </div>
                  </div>

                  {/* Receipts per month */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/10">
                      <Receipt className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Receipts per month</span>
                        <span className="text-sm font-semibold">Up to 3</span>
                      </div>
                      <Progress value={33} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">1 of 3 used</span>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-orange-500/10">
                      <Users className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Clients</span>
                        <span className="text-sm font-semibold">10</span>
                      </div>
                      <Progress value={50} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">5 of 10 used</span>
                    </div>
                  </div>

                  {/* Recurring Subscription */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500/10">
                      <RefreshCw className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Recurring Subscription</span>
                        <span className="text-sm font-semibold">1 included</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Expense Tracking */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-rose-500/10">
                      <Wallet className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expense Tracking</span>
                        <span className="text-sm font-semibold">Up to 5</span>
                      </div>
                      <Progress value={40} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">2 of 5 used</span>
                    </div>
                  </div>

                  {/* Custom Template */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 sm:col-span-2 lg:col-span-1">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-teal-500/10">
                      <Palette className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Custom Template</span>
                        <span className="text-sm font-semibold">1 included</span>
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
                  {subscription.plan !== 'business' && (
                    <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Zap className="h-4 w-4" />
                          Upgrade Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Upgrade Your Plan</DialogTitle>
                          <DialogDescription>
                            Choose a plan that fits your needs
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4 sm:grid-cols-2">
                          {/* Business Plan */}
                          <div 
                            className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                              selectedPlan === 'pro' ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedPlan('pro')}
                          >
                            <Badge className="bg-primary text-primary-foreground mb-4">
                              Business
                            </Badge>
                            <p className="text-sm text-muted-foreground mb-4">
                              Ideal for growing businesses that need full access to invoicing, quotes, and expense tracking.
                            </p>
                            <div className="mb-6">
                              <span className="text-4xl font-bold">KD15</span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            <ul className="space-y-3">
                              {[
                                'Unlimited Invoices',
                                'Unlimited Quotes',
                                'Unlimited Receipts',
                                'Unlimited Clients',
                                'Recurring Subscriptions',
                                'Expense Tracking',
                                'Custom Templates',
                                'Priority Email Support',
                              ].map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Button 
                              className="w-full mt-6"
                              variant={selectedPlan === 'pro' ? 'default' : 'outline'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan('pro');
                                handleUpgradePlan();
                              }}
                            >
                              Get Started
                            </Button>
                          </div>

                          {/* Enterprise Plan */}
                          <div 
                            className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                              selectedPlan === 'business' ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedPlan('business')}
                          >
                            <Badge variant="outline" className="mb-4">
                              Enterprise
                            </Badge>
                            <p className="text-sm text-muted-foreground mb-4">
                              For larger organizations needing custom solutions, dedicated support, and advanced features.
                            </p>
                            <div className="mb-6">
                              <span className="text-4xl font-bold">Let's Talk!</span>
                            </div>
                            <ul className="space-y-3">
                              {[
                                'Everything in Business',
                                'Graphic Designer For Templates',
                                'Ai Integration System',
                                'API Access',
                                'Dedicated Account Manager',
                                'Smart Financial Analytics',
                                'Advanced Expense Tracking',
                                'White-label Options',
                              ].map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Button 
                              className="w-full mt-6 bg-foreground text-background hover:bg-foreground/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan('business');
                                toast({
                                  title: 'Contact Request Sent',
                                  description: 'Our team will reach out to schedule a call.',
                                });
                                setIsUpgradeDialogOpen(false);
                              }}
                            >
                              Book a Call
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {subscription.plan !== 'free' && subscription.status !== 'cancelled' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-destructive">
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your subscription will remain active until the end of your current billing period. 
                            After that, you'll be moved to the Free plan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancelSubscription}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel Subscription
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No billing history available</p>
                  <p className="text-sm">Your payment history will appear here</p>
                </div>
              </CardContent>
            </Card>
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

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage devices where you're logged in
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
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
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
    </DashboardLayout>
  );
}
