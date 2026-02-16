import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Clock, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BrevoDomainsPage } from "@/components/super-admin/brevo/BrevoDomainsPage";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChangeSuperadminPassword,
  useGetAuditLogs,
  useGetSuperadminSettings,
  useUpsertSuperadminSettings,
} from "@/hooks/api/useSuperadminSettings";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { data: settingsData } = useGetSuperadminSettings();
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogs(50, 0);
  const upsertSettingsMutation = useUpsertSuperadminSettings();
  const changePasswordMutation = useChangeSuperadminPassword();

  const defaultName = useMemo(() => {
    const fullName = user?.fullName || "";
    const [first = "", ...rest] = fullName.split(" ");
    return { firstName: first, lastName: rest.join(" ") };
  }, [user?.fullName]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifyNewSubscribers, setNotifyNewSubscribers] = useState(true);
  const [notifyPaymentAlerts, setNotifyPaymentAlerts] = useState(true);
  const [notifySupportTickets, setNotifySupportTickets] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setFirstName(settingsData.firstName || "");
      setLastName(settingsData.lastName || "");
      setEmail(settingsData.email || user?.email || "");
      setSupportEmail(settingsData.supportEmail || "");
      setNotifyNewSubscribers(settingsData.notifyNewSubscribers ?? true);
      setNotifyPaymentAlerts(settingsData.notifyPaymentAlerts ?? true);
      setNotifySupportTickets(settingsData.notifySupportTickets ?? true);
      setTwoFactorEnabled(settingsData.twoFactorEnabled ?? false);
      return;
    }

    setFirstName(defaultName.firstName);
    setLastName(defaultName.lastName);
    setEmail(user?.email || "");
  }, [settingsData, defaultName.firstName, defaultName.lastName, user?.email]);

  const persistSettings = async (overrides?: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    supportEmail: string;
    notifyNewSubscribers: boolean;
    notifyPaymentAlerts: boolean;
    notifySupportTickets: boolean;
    twoFactorEnabled: boolean;
  }>) => {
    const payload = {
      firstName,
      lastName,
      email,
      supportEmail,
      notifyNewSubscribers,
      notifyPaymentAlerts,
      notifySupportTickets,
      twoFactorEnabled,
      ...overrides,
    };

    await upsertSettingsMutation.mutateAsync(payload);
    return payload;
  };

  const handleSaveProfile = async () => {
    try {
      const payload = await persistSettings();
      if (user) {
        updateUser({
          ...user,
          fullName: `${payload.firstName} ${payload.lastName}`.trim(),
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          email: payload.email,
        } as any);
      }
    } catch {
      // Handled by mutation-level toast
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // Handled by mutation-level toast
    }
  };

  const handleToggleSetting = async (
    key: "notifyNewSubscribers" | "notifyPaymentAlerts" | "notifySupportTickets" | "twoFactorEnabled",
    value: boolean,
  ) => {
    if (key === "notifyNewSubscribers") setNotifyNewSubscribers(value);
    if (key === "notifyPaymentAlerts") setNotifyPaymentAlerts(value);
    if (key === "notifySupportTickets") setNotifySupportTickets(value);
    if (key === "twoFactorEnabled") setTwoFactorEnabled(value);

    try {
      await persistSettings({ [key]: value });
    } catch {
      // Handled by mutation-level toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and platform settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="email"><Globe className="w-4 h-4 mr-2" /> Domain</TabsTrigger>
          <TabsTrigger value="audit"><Clock className="w-4 h-4 mr-2" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input 
                  type="email"
                  value={supportEmail} 
                  onChange={(e) => setSupportEmail(e.target.value)} 
                  className="mt-1" 
                  placeholder="support@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Email address where contact form submissions will be sent</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={upsertSettingsMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" className="mt-1" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" className="mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" className="mt-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                Update Password
              </Button>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">Add extra security to your account</p></div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => handleToggleSetting("twoFactorEnabled", checked)}
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span>New subscriber notifications</span>
                <Switch
                  checked={notifyNewSubscribers}
                  onCheckedChange={(checked) => handleToggleSetting("notifyNewSubscribers", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Payment alerts</span>
                <Switch
                  checked={notifyPaymentAlerts}
                  onCheckedChange={(checked) => handleToggleSetting("notifyPaymentAlerts", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Support ticket updates</span>
                <Switch
                  checked={notifySupportTickets}
                  onCheckedChange={(checked) => handleToggleSetting("notifySupportTickets", checked)}
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <BrevoDomainsPage />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
            <h3 className="text-lg font-semibold mb-4">Audit Log</h3>
            <div className="space-y-3">
              {auditLoading ? (
                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
              ) : (auditData?.items || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit logs found.</p>
              ) : (
                (auditData?.items || []).map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 border border-border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{log.userName} <span className="font-normal text-muted-foreground">performed</span> {log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(log.timestamp)} • {log.ipAddress}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
