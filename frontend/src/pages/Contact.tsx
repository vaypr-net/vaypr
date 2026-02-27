import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useSupportPageBySlug } from "@/hooks/useSupportPages";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const defaultContent = {
  title: "Get in Touch",
  description: "Have questions? We're here to help and will respond as soon as possible.",
  contactInfoTitle: "Contact Information",
  contactInfoDescription: "Reach out through any of these channels and we'll get back to you promptly.",
  emailHeading: "Email",
  emails: ["support@vaypr.net", "sales@vaypr.net"],
  phoneHeading: "Phone",
  phone: "(+965) 2246-4030",
  phoneHours: "Sun-Thr 9am-6pm GMT +3",
  officeHeading: "Office",
  officeLine1: "Salhiya, Mohammad Thunayan",
  officeLine2: "Alghanim Street, Kuwait City",
  responseTimeHeading: "Response Time",
  responseTime: "Usually within 3 hours",
  formTitle: "Send us a Message",
  subjectOptions: [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing Question" },
    { value: "enterprise", label: "Enterprise Sales" },
    { value: "partnership", label: "Partnership Opportunity" },
    { value: "feedback", label: "Feedback" }
  ]
};

export default function Contact() {
  const { data: apiContent, isLoading } = useSupportPageBySlug("contact");
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }
  const content = (apiContent as any)?.content ?? defaultContent;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email to support
      const response = await axios.post(`${API_BASE_URL}/contact/submit`, {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        subject: formData.subject,
        message: formData.message
      });

      if (response.data) {
        toast({
          title: "Message sent!",
          description: "We'll get back to you within 24 hours at " + formData.email
        });
        setFormData({
          name: "",
          email: "",
          mobile: "",
          subject: "",
          message: ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {content?.title || defaultContent.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content?.description || defaultContent.description}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                  {content?.contactInfoTitle || defaultContent.contactInfoTitle}
                </h2>
                <p className="text-muted-foreground">
                  {content?.contactInfoDescription || defaultContent.contactInfoDescription}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{content?.emailHeading || defaultContent.emailHeading}</h3>
                    {(content?.emails || defaultContent.emails).map((email: string, index: number) => (
                      <p key={index} className="text-muted-foreground">{email}</p>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{content?.phoneHeading || defaultContent.phoneHeading}</h3>
                    <p className="text-muted-foreground">{content?.phone || defaultContent.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{content?.officeHeading || defaultContent.officeHeading}</h3>
                    <p className="text-muted-foreground">{content?.officeLine1 || defaultContent.officeLine1}</p>
                    <p className="text-muted-foreground">{content?.officeLine2 || defaultContent.officeLine2}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{content?.responseTimeHeading || defaultContent.responseTimeHeading}</h3>
                    <p className="text-muted-foreground">{content?.responseTime || defaultContent.responseTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                  {content?.formTitle || defaultContent.formTitle}
                </h2>

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" type="tel" name="mobile" placeholder="+965 1234 5678" value={formData.mobile} onChange={handleChange} />
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {(content?.subjectOptions || defaultContent.subjectOptions).map((option: { value: string; label: string }) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" placeholder="How can we help you?" rows={6} value={formData.message} onChange={handleChange} required />
                </div>

                <Button type="submit" className="w-full sm:w-auto gap-2" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
