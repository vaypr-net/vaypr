import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Zap,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Save,
  Loader2,
  Eye,
  EyeOff
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
import { formatCurrency } from "@/lib/currency";
import { useReportsAnalytics } from "@/hooks/api/useReports";
import { useGetSuperadminSettings, useUpsertSuperadminSettings } from "@/hooks/api/useSuperadminSettings";
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
  const [testingConnection, setTestingConnection] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const { data: analytics } = useReportsAnalytics();
  const { data: settings } = useGetSuperadminSettings();
  const upsertSettings = useUpsertSuperadminSettings();

  const DEFAULT_SYSTEM_PROMPT =
    "You are a financial analyst assistant for VAYPR. Analyze subscription metrics with focus on MRR growth, churn reduction, and customer lifetime value. Provide actionable insights and flag any concerning trends.";

  useEffect(() => {
    if (settings) {
      setApiKey(settings.openaiApiKey || "");
      setSystemPrompt(settings.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    }
  }, [settings]);

  const handleSaveApiKey = () => {
    upsertSettings.mutate({ openaiApiKey: apiKey } as any);
  };

  const handleSavePrompt = () => {
    upsertSettings.mutate({ systemPrompt } as any);
  };

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;
    setTestingConnection(true);
    setTestStatus("idle");
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setTestStatus(res.ok ? "success" : "error");
    } catch {
      setTestStatus("error");
    } finally {
      setTestingConnection(false);
    }
  };

  const metrics = analytics?.metrics || [
    { label: "Affiliate Referrals", value: 0, changePercent: 0, positive: true },
    { label: "Monthly Subscribers", value: 0, changePercent: 0, positive: true },
    { label: "Yearly Subscribers", value: 0, changePercent: 0, positive: true },
    { label: "Paid Subscribers", value: 0, changePercent: 0, positive: true },
  ];
  const secondaryMetrics = analytics?.secondaryMetrics || [
    { label: "Free Subscribers", value: 0, changePercent: 0, positive: true },
    { label: "Enterprise Subscribers", value: 0, changePercent: 0, positive: true },
    { label: "Canceled Subscribers", value: 0, changePercent: 0, positive: false },
  ];
  const mrrChartData = analytics?.revenueByMonth || [];
  const conversionByMonth = analytics?.conversionByMonth || [];
  const planDistributionData = analytics?.planDistributionData || [];
  const affiliatePerformance = analytics?.affiliatePerformance || [];

  const exportRevenueCSV = () => {
    const rows = (mrrChartData || []).map((r) => ({ month: r.month, mrr: r.mrr }));
    const header = ['Month', 'MRR', 'MRRFormatted'];
    const lines = rows.map((row) =>
      [row.month, String(row.mrr), formatCurrency(row.mrr, { decimals: 2 })]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-by-month.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="kpi-card"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-semibold mt-1">{metric.value.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${metric.positive ? "text-success" : "text-destructive"}`}>
                  {metric.positive ? "+" : ""}{metric.changePercent}% from last month
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {secondaryMetrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="kpi-card"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-semibold mt-1">{metric.value.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${metric.positive ? "text-success" : "text-destructive"}`}>
                  {metric.positive ? "+" : ""}{metric.changePercent}% from last month
                </p>
              </motion.div>
            ))}
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
                <Button variant="outline" size="sm" onClick={exportRevenueCSV}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mrrChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${(v/1000)}k KD`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, { decimals: 2 }), "Revenue"]}
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
                <AreaChart data={conversionByMonth}>
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
                <BarChart data={affiliatePerformance}>
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
          <AIReportsChat analytics={analytics} />

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
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={handleSaveApiKey}
                      disabled={upsertSettings.isPending || !apiKey.trim()}
                      className="shrink-0"
                    >
                      {upsertSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={!apiKey.trim() || testingConnection}
                  >
                    {testingConnection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Test Connection
                  </Button>
                </div>
                {testStatus === "success" && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Connection successful — API key is valid.
                  </div>
                )}
                {testStatus === "error" && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" /> Connection failed — check your API key.
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
                  placeholder="You are a financial analyst assistant..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetPrompt}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset to Default
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePrompt}
                    disabled={upsertSettings.isPending || !systemPrompt.trim()}
                  >
                    {upsertSettings.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save Prompt
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
