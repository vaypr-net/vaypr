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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  insights?: {
    type: "positive" | "negative" | "neutral";
    metric?: string;
  };
}

const suggestedQuestions = [
  "What's driving our MRR growth?",
  "How's the trial conversion rate trending?",
  "Which plan generates the most revenue?",
  "What's our affiliate performance like?",
];

const mockResponses: Record<string, { content: string; insights?: Message["insights"] }> = {
  "mrr": {
    content: "Your MRR has grown by 12.4% this month, reaching 45,000 KD. The primary drivers are:\n\n• **Enterprise plan upgrades**: 23 customers upgraded from Pro\n• **New acquisitions**: 156 new paid subscribers\n• **Reduced churn**: Down 2.1% from last month\n\nRecommendation: Focus on enterprise onboarding to maintain this momentum.",
    insights: { type: "positive", metric: "+12.4% MRR" }
  },
  "conversion": {
    content: "Trial-to-paid conversion is at **38%** this month, up from 35% last month.\n\n📈 **Key factors**:\n• Improved onboarding emails (+5% open rate)\n• New feature demos during trial\n• Proactive support outreach on day 7\n\n💡 **Opportunity**: Users who engage with 3+ features convert at 52%. Consider guided feature discovery.",
    insights: { type: "positive", metric: "38% conversion" }
  },
  "plan": {
    content: "Revenue distribution by plan:\n\n• **Enterprise**: 42% (18,900 KD) - Highest LTV\n• **Pro**: 35% (15,750 KD) - Best volume\n• **Basic**: 18% (8,100 KD) - Entry point\n• **Starter**: 5% (2,250 KD) - Trial conversions\n\n🎯 **Insight**: Enterprise customers have 3x lower churn. Consider incentivizing Pro→Enterprise upgrades.",
    insights: { type: "neutral", metric: "Enterprise leads at 42%" }
  },
  "affiliate": {
    content: "Affiliate program performance this month:\n\n• **Total referrals**: 312 (+17% vs last month)\n• **Conversions**: 102 (32.7% rate)\n• **Top performer**: affiliate_jane with 45 conversions\n• **Commission paid**: 4,580 KD\n\n⚠️ **Note**: Bottom 20% of affiliates generated only 3% of referrals. Consider a tiered incentive structure.",
    insights: { type: "positive", metric: "312 referrals" }
  },
  "default": {
    content: "Based on your current analytics:\n\n• **Total revenue**: 45,000 KD (+11.4% MoM)\n• **Active subscribers**: 4,003 (+8.7%)\n• **Churn rate**: 3.2% (industry avg: 5-7%)\n• **NRR**: 108% (strong expansion)\n\nYour platform is performing above industry benchmarks. Key focus areas should be enterprise expansion and reducing trial drop-off.",
    insights: { type: "positive", metric: "108% NRR" }
  }
};

function getResponse(question: string): { content: string; insights?: Message["insights"] } {
  const q = question.toLowerCase();
  if (q.includes("mrr") || q.includes("revenue growth") || q.includes("driving")) {
    return mockResponses.mrr;
  }
  if (q.includes("conversion") || q.includes("trial") || q.includes("trending")) {
    return mockResponses.conversion;
  }
  if (q.includes("plan") || q.includes("generates") || q.includes("distribution")) {
    return mockResponses.plan;
  }
  if (q.includes("affiliate") || q.includes("referral") || q.includes("partner")) {
    return mockResponses.affiliate;
  }
  return mockResponses.default;
}

export default function AIReportsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const response = getResponse(messageText);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      timestamp: new Date(),
      insights: response.insights,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
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
            
            {isTyping && (
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
            disabled={isTyping}
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || isTyping}
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
