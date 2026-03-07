import { motion } from "framer-motion";
import { 
  Users, 
  UserCheck, 
  UserX, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Repeat,
  Ticket,
  Clock,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { KPICard } from "@/components/super-admin/KPICard";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetSubscribers } from "@/hooks/api/useSubscribers";
import { useGetActivities } from "@/hooks/api/useActivities";
import { useSuperAdminOverviewStats } from "@/hooks/api/useSuperAdminOverview";

const activityIcons: Record<string, React.ReactNode> = {
  new_subscriber: <Users className="w-4 h-4 text-blue-500" />,
  upgrade: <TrendingUp className="w-4 h-4 text-green-500" />,
  payment: <DollarSign className="w-4 h-4 text-green-500" />,
  canceled: <UserX className="w-4 h-4 text-red-500" />,
  ticket: <Ticket className="w-4 h-4 text-yellow-500" />,
  ticket_resolved: <UserCheck className="w-4 h-4 text-green-500" />,
  affiliate: <Users className="w-4 h-4 text-purple-500" />,
  referral: <TrendingUp className="w-4 h-4 text-purple-500" />,
  invoice_sent: <DollarSign className="w-4 h-4 text-blue-500" />,
  domain_verified: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  downgrade: <TrendingUp className="w-4 h-4 text-yellow-500" style={{ transform: 'rotate(180deg)' }} />,
  payment_failed: <DollarSign className="w-4 h-4 text-red-500" />,
  reactivated: <UserCheck className="w-4 h-4 text-green-500" />,
};

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function Overview() {
  // Fetch real subscriber data
  const { data: subscribersData } = useGetSubscribers(undefined, undefined, undefined, 5, 0);
  const { data: activitiesData, isLoading: activitiesLoading } = useGetActivities(6, 0);
  const { data: overviewStats } = useSuperAdminOverviewStats();

  const recentSubscribers = subscribersData?.items || [];
  const activities = activitiesData?.data || [];
  const supportTicketsData = overviewStats?.supportTicketsData || [];
  const revenueByPlanData = overviewStats?.revenueByPlanData || [];
  const planDistributionData = overviewStats?.planDistributionData || [];
  const ticketStats = overviewStats?.ticketsByStatus;
  const kpis = overviewStats?.kpis;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Monitor your platform's key metrics and activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Registered" 
          value={(kpis?.totalRegistered || 0).toLocaleString()} 
          change="All registered users"
          changeType="positive"
          icon={Users}
        />
        <KPICard 
          title="Canceled This Month" 
          value={`${kpis?.canceledThisMonth || 0}`} 
          change="Current month cancellations"
          changeType="negative"
          icon={UserX}
          iconColor="bg-red-100 text-red-600"
        />
        <KPICard 
          title="Total Revenue" 
          value={formatCurrency(kpis?.totalRevenue || 0, { decimals: 2 })} 
          change="Succeeded subscription payments"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard 
          title="Open Tickets" 
          value={`${kpis?.openTickets || 0}`} 
          change="Open + pending + in progress"
          changeType="positive"
          icon={Ticket}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Tickets Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-admin"
        >
          <h3 className="text-lg font-semibold mb-4">Support Tickets</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={supportTicketsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {supportTicketsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Open</span>
                </div>
                <Badge className="bg-blue-600">{ticketStats?.open || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Pending</span>
                </div>
                <Badge className="bg-yellow-600">{ticketStats?.pending || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">In Progress</span>
                </div>
                <Badge className="bg-purple-600">{ticketStats?.inProgress || 0}</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue by Plan Type */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-admin"
        >
          <h3 className="text-lg font-semibold mb-4">Revenue by Plan Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueByPlanData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${(v/1000)}k`} />
              <YAxis type="category" dataKey="plan" stroke="#94A3B8" fontSize={12} width={80} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value, { decimals: 2 }) : value.toLocaleString(),
                  name === "revenue" ? "Revenue" : "Subscribers"
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} name="Revenue (KD)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Plan Distribution, Recent Subscribers & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-admin"
        >
          <h3 className="text-lg font-semibold mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={planDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {planDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {planDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Subscribers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-admin"
        >
          <h3 className="text-lg font-semibold mb-4">Recent Subscribers</h3>
          <div className="space-y-3">
            {recentSubscribers.map((subscriber) => (
              <div key={subscriber._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {subscriber.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{subscriber.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{subscriber.email}</p>
                </div>
                <Badge variant={subscriber.plan === "Free" ? "secondary" : "default"} className="text-xs">
                  {subscriber.plan}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-admin"
        >
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4 max-h-[280px] overflow-y-auto scrollbar-hide">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {activityIcons[activity.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No activities yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
