import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Tag, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticket: TicketFormData) => void;
}

interface TicketFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  assignedTo: string;
  status: string;
}

const categories = [
  { value: "billing", label: "Billing", icon: "💳", description: "Payment & subscription issues" },
  { value: "technical", label: "Technical", icon: "🔧", description: "Bugs & technical problems" },
  { value: "account", label: "Account", icon: "👤", description: "Account access & settings" },
  { value: "feature", label: "Feature Request", icon: "✨", description: "Suggestions & improvements" },
  { value: "general", label: "General", icon: "📝", description: "Other inquiries" },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-600", description: "Can wait a few days" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-600", description: "Within 24 hours" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-600", description: "Within a few hours" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-600", description: "Immediate attention" },
];

const statuses = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-600", description: "Newly created" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-600", description: "Waiting for response" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-600", description: "Being worked on" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-600", description: "Issue resolved" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-600", description: "Ticket closed" },
];

const teams = [
  { value: "Support Team", label: "Support Team" },
  { value: "Billing Team", label: "Billing Team" },
  { value: "Tech Support", label: "Tech Support" },
  { value: "Admin", label: "Admin" },
];

const steps = [
  { id: 1, title: "Customer Info", icon: User },
  { id: 2, title: "Ticket Details", icon: Tag },
  { id: 3, title: "Description", icon: MessageSquare },
];

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d+\s\-()]*$/;
  return phoneRegex.test(phone);
};

const filterPhoneInput = (value: string): string => {
  return value.replace(/[^\d+\s\-()]/g, "");
};

export function CreateTicketDialog({ open, onOpenChange, onSubmit }: CreateTicketDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TicketFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    subject: "",
    category: "",
    priority: "medium",
    description: "",
    assignedTo: "Support Team",
    status: "open",
  });

  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const updateFormData = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate email and phone on change
    const newErrors = { ...errors };
    
    if (field === "customerEmail") {
      if (value && !validateEmail(value)) {
        newErrors.email = "Please enter a valid email address";
      } else {
        delete newErrors.email;
      }
    }

    if (field === "customerPhone") {
      const filteredValue = filterPhoneInput(value);
      setFormData(prev => ({ ...prev, [field]: filteredValue }));
      
      if (!validatePhone(filteredValue)) {
        newErrors.phone = "Phone can only contain numbers, +, spaces, hyphens, and parentheses";
      } else {
        delete newErrors.phone;
      }
    }

    setErrors(newErrors);
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    onSubmit(formData);
    // Reset form
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      subject: "",
      category: "",
      priority: "medium",
      description: "",
      assignedTo: "Support Team",
      status: "open",
    });
    setCurrentStep(1);
    setErrors({});
    onOpenChange(false);
  };

  const isStep1Valid = formData.customerName && formData.customerEmail && validateEmail(formData.customerEmail);
  const isStep2Valid = formData.subject && formData.category;
  const isStep3Valid = formData.description.length >= 10;

  const canProceed = 
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && isStep3Valid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Create New Ticket
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      currentStep > step.id 
                        ? "bg-primary text-primary-foreground" 
                        : currentStep === step.id 
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1.5 font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "w-16 h-0.5 mx-2 transition-all duration-300",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-4 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Customer Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => updateFormData("customerName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address *
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => updateFormData("customerEmail", e.target.value)}
                    className={cn(
                      "transition-colors",
                      errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    )}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="customerPhone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.customerPhone}
                    onChange={(e) => updateFormData("customerPhone", e.target.value)}
                    className={cn(
                      "transition-colors",
                      errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    )}
                  />
                  {errors.phone && (
                    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Ticket Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of the issue"
                    value={formData.subject}
                    onChange={(e) => updateFormData("subject", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => updateFormData("category", cat.value)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all duration-200 hover:border-primary/50",
                          formData.category === cat.value 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-medium text-sm">{cat.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => updateFormData("priority", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs", p.color)}>{p.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => updateFormData("status", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs", s.color)}>{s.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={formData.assignedTo} onValueChange={(v) => updateFormData("assignedTo", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Step 3: Description */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium">Ticket Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2">{formData.customerName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2 capitalize">{formData.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge className={cn("ml-2 text-xs", priorities.find(p => p.value === formData.priority)?.color)}>
                        {formData.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={cn("ml-2 text-xs", statuses.find(s => s.value === formData.status)?.color)}>
                        {statuses.find(s => s.value === formData.status)?.label}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned:</span>
                      <span className="ml-2">{formData.assignedTo}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Issue Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the customer's issue..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/10 characters minimum
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed}>
              <Check className="w-4 h-4 mr-1" />
              Create Ticket
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
