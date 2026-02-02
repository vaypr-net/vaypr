import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Zap,
  CheckCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Save
} from "lucide-react";
import AIReportsChat from "@/components/super-admin/reports/AIReportsChat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  mrrChartData, 
  planDistributionData 
} from "@/data/mockData";
import { formatCurrency } from "@/lib/currency";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Reports() {
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Generate reports and analyze platform performance</p>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="api-config">API Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Affiliate Referrals", value: "1,284", change: "+18.5%", positive: true },
              { label: "Monthly Subscribers", value: "2,847", change: "+8.3%", positive: true },
              { label: "Yearly Subscribers", value: "1,156", change: "+15.2%", positive: true },
              { label: "Paid Subscribers", value: "3,421", change: "+11.4%", positive: true },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="kpi-card"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-semibold mt-1">{metric.value}</p>
                <p className={`text-xs mt-1 ${metric.positive ? "text-success" : "text-destructive"}`}>
                  {metric.change} from last month
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="kpi-card"
            >
              <p className="text-sm text-muted-foreground">Free Subscribers</p>
              <p className="text-2xl font-semibold mt-1">582</p>
              <p className="text-xs mt-1 text-success">+6.7% from last month</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="kpi-card"
            >
              <p className="text-sm text-muted-foreground">Enterprise Subscribers</p>
              <p className="text-2xl font-semibold mt-1">238</p>
              <p className="text-xs mt-1 text-success">+22.4% from last month</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="kpi-card"
            >
              <p className="text-sm text-muted-foreground">Canceled Subscribers</p>
              <p className="text-2xl font-semibold mt-1">147</p>
              <p className="text-xs mt-1 text-destructive">+3.2% from last month</p>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-admin"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue by Month</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mrrChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${(v/1000)}k KD`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="mrr" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-admin"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Trial → Paid Conversion</h3>
                <Badge variant="outline">Last 6 months</Badge>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={[
                  { month: "Aug", rate: 24 },
                  { month: "Sep", rate: 28 },
                  { month: "Oct", rate: 32 },
                  { month: "Nov", rate: 29 },
                  { month: "Dec", rate: 35 },
                  { month: "Jan", rate: 38 },
                ]}>
                  <defs>
                    <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, "Conversion Rate"]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    fill="url(#conversionGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* More Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-admin"
            >
              <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
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
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {planDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card-admin lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Affiliate Performance</h3>
                <Badge variant="outline">Last 6 months</Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { month: "Aug", referrals: 156, conversions: 42 },
                  { month: "Sep", referrals: 189, conversions: 58 },
                  { month: "Oct", referrals: 234, conversions: 71 },
                  { month: "Nov", referrals: 198, conversions: 65 },
                  { month: "Dec", referrals: 267, conversions: 89 },
                  { month: "Jan", referrals: 312, conversions: 102 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="referrals" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} name="Referrals" />
                  <Bar dataKey="conversions" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(262, 83%, 58%)" }} />
                  <span className="text-xs text-muted-foreground">Referrals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
                  <span className="text-xs text-muted-foreground">Conversions</span>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="api-config" className="mt-6 space-y-6">
          {/* AI Chat Section */}
          <AIReportsChat />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-admin">
              <h3 className="text-lg font-semibold mb-4">AI Provider Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Select defaultValue="openai">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="azure">Azure OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input type="password" defaultValue="sk-••••••••••••••••••••" className="mt-1" />
                </div>
                <div>
                  <Label>Organization ID (optional)</Label>
                  <Input placeholder="org-..." className="mt-1" />
                </div>
                <div>
                  <Label>Default Model</Label>
                  <Select defaultValue="gpt-4">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => setTestStatus("success")}>
                    <Zap className="w-4 h-4 mr-2" /> Test Connection
                  </Button>
                  <Button variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Rotate Key</Button>
                </div>
                {testStatus === "success" && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Connection successful
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-admin">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">System Prompt</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Instructions
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Define how the AI should analyze and interpret your reports.
              </p>
              <div className="space-y-4">
                <textarea
                  className="w-full h-40 p-3 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="You are a financial analyst assistant for VAYPR. When analyzing reports:

• Focus on revenue trends, churn patterns, and subscriber growth
• Highlight anomalies and potential concerns
• Provide actionable recommendations
• Use clear, concise language suitable for executive summaries
• Compare metrics against industry benchmarks when relevant"
                  defaultValue="You are a financial analyst assistant for VAYPR. Analyze subscription metrics with focus on MRR growth, churn reduction, and customer lifetime value. Provide actionable insights and flag any concerning trends."
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Last saved 2 hours ago
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset to Default
                    </Button>
                    <Button size="sm">
                      <Save className="w-4 h-4 mr-1" /> Save Prompt
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
