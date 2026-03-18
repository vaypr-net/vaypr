import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Lightbulb,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAiChat } from "@/hooks/api/useSuperadminSettings";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  insights?: {
    type: "positive" | "negative" | "neutral";
    metric?: string;
  };
  error?: boolean;
}

interface AIReportsChatProps {
  analytics?: any;
}

const suggestedQuestions = [
  "What is the total revenue of the platform?",
  "How many refunds have been issued?",
  "How many active vs free subscribers do we have?",
  "What is the status of our support tickets?",
];

type AnalyticsTopic = 'subscribers' | 'revenue' | 'transactions' | 'refunds' | 'tickets' | 'affiliates' | 'plans' | 'overview';

function detectTopics(question: string): AnalyticsTopic[] {
  const q = question.toLowerCase();
  const topics = new Set<AnalyticsTopic>();

  // Always include overview/metrics as base context
  topics.add('overview');

  // If the question is a vague follow-up asking for names, lists, or details
  // (e.g. "what are their names", "list them", "show me", "who are they"),
  // include ALL topics so the AI has full context to answer.
  if (/\bname(s)?\b|\bwho\b|list (them|all|me|the)|show (me|all|them)|give me|tell me|detail|their \w+|all of them|full list/.test(q)) {
    (['subscribers', 'revenue', 'transactions', 'refunds', 'tickets', 'affiliates', 'plans'] as AnalyticsTopic[]).forEach(t => topics.add(t));
    return Array.from(topics);
  }

  if (/subscriber|user|client|customer|member|signup|register|cancel|churn|active|free plan/.test(q))
    topics.add('subscribers');

  if (/revenue|mrr|earn|income|money|paid|payment|billing|how much|total.*kd|kd.*total/.test(q))
    topics.add('revenue');

  if (/refund|refunded|return|chargeback/.test(q))
    topics.add('refunds');

  if (/transaction|invoice|charge|receipt|purchase|order|failed|success|pending/.test(q))
    topics.add('transactions');

  if (/ticket|support|issue|complaint|open|pending.*ticket|help request/.test(q))
    topics.add('tickets');

  if (/affiliate|referral|commission|coupon|discount|payout|partner/.test(q))
    topics.add('affiliates');

  if (/plan|pricing|subscription plan|tier|feature|limit|pro|free|enterprise/.test(q))
    topics.add('plans');

  return Array.from(topics);
}

function buildAnalyticsContext(analytics: any, question?: string): string {
  if (!analytics) return "";
  const lines: string[] = [];

  const topics = question ? detectTopics(question) : (['overview', 'subscribers', 'revenue', 'transactions', 'refunds', 'tickets', 'affiliates', 'plans'] as AnalyticsTopic[]);
  const has = (t: AnalyticsTopic) => topics.includes(t);

  // ── Always included: key metrics summary (small, text only) ──────────────
  if (analytics.metrics?.length) {
    lines.push("Key Metrics:");
    analytics.metrics.forEach((m: any) => {
      lines.push(`  ${m.label}: ${m.value} (${m.positive ? "+" : ""}${m.changePercent}% MoM)`);
    });
  }

  if (analytics.secondaryMetrics?.length) {
    lines.push("Secondary Metrics:");
    analytics.secondaryMetrics.forEach((m: any) => {
      lines.push(`  ${m.label}: ${m.value} (${m.positive ? "+" : ""}${m.changePercent}% MoM)`);
    });
  }

  // ── Overview / users ─────────────────────────────────────────────────────
  if (has('overview') || has('subscribers') || has('revenue')) {
    const ov = analytics.overviewStats;
    if (ov) {
      lines.push("Platform Overview:");
      lines.push(`  Total Registered Users: ${ov.totalRegistered}`);
      lines.push(`  New Users This Month: ${ov.newUsersThisMonth}`);
      lines.push(`  Cancellations This Month: ${ov.canceledThisMonth}`);
      if ((has('revenue') || has('plans')) && ov.revenueByPlan?.length) {
        lines.push("  Revenue by Plan:");
        ov.revenueByPlan.forEach((p: any) => {
          lines.push(`    ${p.plan}: ${p.revenue} KD (${p.transactionCount} transactions)`);
        });
      }
    }
  }

  // ── Revenue / MRR ────────────────────────────────────────────────────────
  if (has('revenue')) {
    if (analytics.revenueByMonth?.length) {
      lines.push("Revenue by Month (last 6):");
      analytics.revenueByMonth.slice(-6).forEach((r: any) => {
        lines.push(`  ${r.month}: ${r.mrr} KD`);
      });
    }
    if (analytics.planDistributionData?.length) {
      lines.push("Revenue by Plan Distribution:");
      analytics.planDistributionData.forEach((p: any) => {
        lines.push(`  ${p.name}: ${p.value} KD`);
      });
    }
  }

  // ── Subscribers ──────────────────────────────────────────────────────────
  if (has('subscribers')) {
    const ss = analytics.subscriberStats;
    if (ss) {
      lines.push("Subscriber Breakdown:");
      lines.push(`  Total Subscribers: ${ss.total}`);
      lines.push(`  Active (paid): ${ss.active}`);
      lines.push(`  Free Plan: ${ss.free}`);
      lines.push(`  Canceled: ${ss.canceled}`);
      lines.push(`  Inactive/Incomplete: ${ss.inactive}`);
      lines.push(`  Monthly Billing: ${ss.monthlyBillingSubscribers}`);
      lines.push(`  Yearly Billing: ${ss.yearlyBillingSubscribers}`);
      lines.push(`  All-Time Revenue: ${ss.totalRevenue} KD`);
      lines.push(`  This Month Revenue: ${ss.monthlyRevenue} KD`);

      if (ss.subscribers?.length) {
        lines.push(`  Subscriber List (${ss.subscribers.length} total):`);
        ss.subscribers.forEach((s: any) => {
          lines.push(`    - ${s.name} (${s.email}) | Plan: ${s.plan} | Status: ${s.status} | Billing: ${s.billingCycle} | Amount: ${s.amount} KD | Joined: ${s.joinedAt}${s.canceledAt ? ` | Canceled: ${s.canceledAt}` : ` | Renews: ${s.renewsAt}`}`);
        });
      }
    }
  }

  // ── Transactions & Refunds ───────────────────────────────────────────────
  if (has('transactions') || has('refunds') || has('revenue')) {
    const ts = analytics.transactionStats;
    if (ts) {
      lines.push("Transaction Overview:");
      lines.push(`  Total Successful: ${ts.successfulCount}`);
      lines.push(`  Total Failed: ${ts.failedCount}`);
      lines.push(`  Total Revenue (all time): ${ts.totalRevenue} KD`);
      lines.push(`  Total Refunds Issued: ${ts.refundCount}`);
      lines.push(`  Total Refund Amount: ${ts.refundTotal} KD`);

      if (has('transactions') || has('refunds')) {
        const formatTxList = (list: any[], label: string) => {
          if (!list?.length) return;
          lines.push(`  ${label} Transactions (${list.length} total):`);
          list.forEach((t: any) => {
            lines.push(`    - ${t.subscriberName} (${t.subscriberEmail}) | ${t.amount} ${t.currency} | Plan: ${t.plan} | ${t.billingCycle} | Provider: ${t.provider} | Date: ${t.date}`);
          });
        };

        if (ts.transactions) {
          if (has('transactions')) {
            formatTxList(ts.transactions.succeeded, 'Succeeded');
            formatTxList(ts.transactions.failed, 'Failed');
            formatTxList(ts.transactions.pending, 'Pending');
          }
          if (has('refunds') || has('transactions')) {
            formatTxList(ts.transactions.refunded, 'Refunded');
          }
        }
      }
    }
  }

  // ── Support Tickets ──────────────────────────────────────────────────────
  if (has('tickets')) {
    const tk = analytics.ticketStats;
    if (tk) {
      lines.push("Support Tickets Summary:");
      lines.push(`  Total: ${tk.total} | Open: ${tk.open} | Pending: ${tk.pending} | In Progress: ${tk.inProgress} | Resolved: ${tk.resolved} | Closed: ${tk.closed}`);

      const formatTickets = (list: any[], label: string) => {
        if (!list?.length) return;
        lines.push(`  ${label} Tickets (${list.length} total):`);
        list.forEach((t: any) => {
          lines.push(`    - "${t.subject}" | Customer: ${t.customerName} (${t.customerEmail}) | Category: ${t.category} | Priority: ${t.priority} | Assigned: ${t.assignedTo} | Created: ${t.createdAt}${t.resolvedAt ? ` | Resolved: ${t.resolvedAt}` : ''}`);
        });
      };

      if (tk.tickets) {
        formatTickets(tk.tickets.open, 'Open');
        formatTickets(tk.tickets.pending, 'Pending');
        formatTickets(tk.tickets.inProgress, 'In Progress');
        formatTickets(tk.tickets.resolved, 'Resolved');
        formatTickets(tk.tickets.closed, 'Closed');
      }
    }
  }

  // ── Affiliates ───────────────────────────────────────────────────────────
  if (has('affiliates')) {
    const af = analytics.affiliateStats;
    if (af) {
      lines.push("Affiliate Program:");
      lines.push(`  Total Affiliates: ${af.totalAffiliates}`);
      lines.push(`  Total Referrals: ${af.totalReferrals}`);
      lines.push(`  Approved Referrals: ${af.approvedReferrals}`);
      lines.push(`  Total Commissions Earned: ${af.totalCommissions} KD`);
      lines.push(`  Pending Payouts: ${af.pendingPayouts} KD`);

      if (analytics.affiliatePerformance?.length) {
        lines.push("  Performance (last 3 months):");
        analytics.affiliatePerformance.slice(-3).forEach((a: any) => {
          lines.push(`    ${a.month}: ${a.referrals} referrals, ${a.conversions} conversions`);
        });
      }

      if (af.affiliates?.length) {
        lines.push(`  Affiliates (${af.affiliates.length} total):`);
        af.affiliates.forEach((a: any) => {
          lines.push(`    - ${a.name} (${a.email}) | Code: ${a.code} | Tier: ${a.tier} | Status: ${a.status} | Referrals: ${a.referrals} | Earnings: ${a.earnings} KD | Pending: ${a.pending} KD | Joined: ${a.joinDate}`);
        });
      }

      if (af.referrals?.length) {
        lines.push(`  Referrals (${af.referrals.length} total):`);
        af.referrals.forEach((r: any) => {
          lines.push(`    - Affiliate: ${r.affiliateName} → Subscriber: ${r.subscriberName} | Plan: ${r.plan} | Amount: ${r.amount} KD | Commission: ${r.commission} KD | Status: ${r.status} | Date: ${r.date}`);
        });
      }

      if (af.coupons?.length) {
        lines.push(`  Discount Coupons (${af.coupons.length}):`);
        af.coupons.forEach((c: any) => {
          const discount = c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue} KD`;
          lines.push(`    - Code: ${c.code} | Discount: ${discount} | Usage: ${c.usage} | Valid: ${c.validFrom} → ${c.validUntil} | Status: ${c.status}`);
        });
      }

      if ((af as any).commissionPlans?.length) {
        lines.push(`  Commission Plans:`);
        (af as any).commissionPlans.forEach((cp: any) => {
          const comm = cp.commissionType === 'percentage' ? `${cp.commissionValue}%` : `${cp.commissionValue} KD`;
          lines.push(`    - ${cp.name} | Plan: ${cp.subscriptionPlan} | Commission: ${comm} | Cookie: ${cp.cookieWindow}d | Min Payout: ${cp.minPayout} KD | Active: ${cp.isActive}${cp.couponCode ? ` | Coupon: ${cp.couponCode} (${cp.couponDiscount} KD off)` : ''}`);
        });
      }
    }
  }

  // ── Billing Plans ────────────────────────────────────────────────────────
  if (has('plans')) {
    const bp = analytics.billingPlanStats;
    if (bp) {
      lines.push("Billing Plans:");
      lines.push(`  Total Plans: ${bp.totalPlans} (Active: ${bp.activePlans}, Hidden: ${bp.hiddenPlans}, Archived: ${bp.archivedPlans})`);
      lines.push(`  Total Subscribers Across Plans: ${bp.totalSubscribers}`);
      if (bp.plans?.length) {
        bp.plans.forEach((p: any) => {
          lines.push(`  Plan: ${p.name} [${p.status}${p.isPopular ? ', Popular' : ''}]`);
          lines.push(`    Price: ${p.price} KD / ${p.interval} | Subscribers: ${p.subscribers}`);
          if (p.features?.length) lines.push(`    Features: ${p.features.join(', ')}`);
          if (p.limits && Object.keys(p.limits).length) {
            const lims = Object.entries(p.limits).map(([k, v]) => `${k}: ${v === -1 ? 'unlimited' : v}`).join(', ');
            lines.push(`    Limits: ${lims}`);
          }
        });
      }
    }
  }

  return lines.join("\n");
}

export default function AIReportsChat({ analytics }: AIReportsChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiChat = useAiChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || aiChat.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const analyticsContext = buildAnalyticsContext(analytics, messageText);

    try {
      const result = await aiChat.mutateAsync({ message: messageText, analyticsContext });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errText =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to get AI response. Check your OpenAI API key in the AI Provider Settings below.";

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errText,
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-admin flex flex-col h-[500px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Analytics AI Assistant
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">Ask questions about your reports</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 py-4 pr-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-2">How can I help you today?</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              I can analyze your reports and provide insights on revenue, subscribers, affiliates, and more.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted/50 hover:border-primary/50 transition-colors"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.error ? "bg-destructive/20" : "bg-gradient-to-br from-primary to-primary/60"}`}>
                      {message.error ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : message.error
                        ? "bg-destructive/10 border border-destructive/20 rounded-bl-md"
                        : "bg-muted/50 rounded-bl-md"
                    }`}
                  >
                    {message.insights && (
                      <div className="flex items-center gap-2 mb-2">
                        {message.insights.type === "positive" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : message.insights.type === "negative" ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          message.insights.type === "positive" ? "text-green-600" :
                          message.insights.type === "negative" ? "text-red-600" : "text-amber-600"
                        }`}>
                          {message.insights.metric}
                        </span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">
                          {line.split("**").map((part, j) => 
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {aiChat.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your analytics..."
            className="flex-1"
            disabled={aiChat.isPending}
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || aiChat.isPending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses are based on your current dashboard data
        </p>
      </div>
    </motion.div>
  );
}