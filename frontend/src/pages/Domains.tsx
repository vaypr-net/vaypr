import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DomainManagement } from '@/components/dashboard/DomainManagement';

export default function Domains() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Domains</h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom email domains for professional email addresses.
          </p>
        </div>
        <DomainManagement />
      </div>
    </DashboardLayout>
  );
}
