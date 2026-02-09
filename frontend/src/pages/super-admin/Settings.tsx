import { motion } from "framer-motion";
import { User, Shield, Bell, Clock, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mockAuditLogs } from "@/data/mockData";
import { BrevoDomainsPage } from "@/components/super-admin/brevo/BrevoDomainsPage";
import { useAuth } from "@/contexts/AuthContext";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Settings() {
  const { user } = useAuth();

  // Split fullName into first and last name
  const [firstName, lastName] = user?.fullName
    ? user.fullName.split(' ')
    : ['', ''];

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
          <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" /> Email</TabsTrigger>
          <TabsTrigger value="audit"><Clock className="w-4 h-4 mr-2" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input defaultValue={firstName || ""} className="mt-1" /></div>
                <div><Label>Last Name</Label><Input defaultValue={lastName || ""} className="mt-1" /></div>
              </div>
              <div><Label>Email</Label><Input defaultValue={user?.email || ""} className="mt-1" /></div>
              <Button>Save Changes</Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>New Password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>Confirm New Password</Label><Input type="password" className="mt-1" /></div>
              <Button>Update Password</Button>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">Add extra security to your account</p></div>
                <Switch />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {["New subscriber notifications", "Payment alerts", "Support ticket updates"].map((item) => (
                <div key={item} className="flex items-center justify-between py-2">
                  <span>{item}</span><Switch defaultChecked />
                </div>
              ))}
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
              {mockAuditLogs.map((log) => (
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
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
