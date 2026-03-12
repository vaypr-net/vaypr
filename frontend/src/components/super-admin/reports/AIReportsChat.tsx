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
  "What's driving our MRR growth?",
  "How's the trial conversion rate trending?",
  "Which plan generates the most revenue?",
  "What's our affiliate performance like?",
];

function buildAnalyticsContext(analytics: any): string {
  if (!analytics) return "";
  const lines: string[] = [];

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

  if (analytics.revenueByMonth?.length) {
    lines.push("Revenue by Month (last 6 entries):");
    analytics.revenueByMonth.slice(-6).forEach((r: any) => {
      lines.push(`  ${r.month}: ${r.mrr} KD`);
    });
  }

  if (analytics.planDistributionData?.length) {
    lines.push("Plan Distribution:");
    analytics.planDistributionData.forEach((p: any) => {
      lines.push(`  ${p.name}: ${p.value}%`);
    });
  }

  if (analytics.affiliatePerformance?.length) {
    lines.push("Affiliate Performance (last 3 months):");
    analytics.affiliatePerformance.slice(-3).forEach((a: any) => {
      lines.push(`  ${a.month}: ${a.referrals} referrals, ${a.conversions} conversions`);
    });
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

    const analyticsContext = buildAnalyticsContext(analytics);

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
        "Failed to get AI response. Please add your OpenAI API key in the AI Provider Settings below.";

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