import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useManagedSupportPage } from "@/hooks/useManagedSupportPage";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const normalize = (value: string) => value.trim().toLowerCase();

const toLines = (value?: string) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function Contact() {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "",
    message: ""
  });
  const managedPage = useManagedSupportPage("contact");
  const sections = managedPage?.sections || [];

  const usedSectionIndexes = new Set<number>();

  const findSection = (keywords: string[], excludeKeywords: string[] = []) => {
    const index = sections.findIndex((section, idx) => {
      if (usedSectionIndexes.has(idx)) return false;
      const title = normalize(section.title || "");

      if (excludeKeywords.some((keyword) => title.includes(keyword))) {
        return false;
      }

      return keywords.some((keyword) => title.includes(keyword));
    });

    if (index === -1) return undefined;
    usedSectionIndexes.add(index);
    return sections[index];
  };

  const introSection = findSection(["contact", "touch", "help"]);
  const emailSection = findSection(["email", "mail"]);
  const phoneSection = findSection(["phone", "mobile", "call"]);
  const hoursSection = findSection(["office hour", "hours", "hour", "response time", "response"]);
  const officeSection = findSection(["address", "location", "map", "office location"], ["hour", "time"]);

  const emailLines = toLines(emailSection?.content);
  const phoneLines = toLines(phoneSection?.content);
  const officeLines = toLines(officeSection?.content);
  const hoursLines = toLines(hoursSection?.content);

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
  return <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            {managedPage?.title || "Get in Touch"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {managedPage?.metaDescription || "Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
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
                  {introSection?.title || "Contact Information"}
                </h2>
                <p className="text-muted-foreground">
                  {introSection?.content || "Reach out through any of these channels and we'll get back to you promptly."}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{emailSection?.title || "Email"}</h3>
                    {emailLines.length > 0 ? (
                      emailLines.map((line, idx) => (
                        <p key={idx} className="text-muted-foreground">{line}</p>
                      ))
                    ) : (
                      <>
                        <p className="text-muted-foreground">support@vaypr.net</p>
                        <p className="text-muted-foreground">sales@vaypr.net</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{phoneSection?.title || "Phone"}</h3>
                    <p className="text-muted-foreground">{phoneLines[0] || "(+965) 2246-4030"}</p>
                    <p className="text-sm text-muted-foreground">{phoneLines[1] || "Sun-Thr 9am-6pm GMT +3"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{officeSection?.title || "Office"}</h3>
                    <p className="text-muted-foreground">{officeLines[0] || "Salhiya, Mohammad Thunayan"}</p>
                    <p className="text-muted-foreground">{officeLines[1] || "Alghanim Street, Kuwait City"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{hoursSection?.title || "Response Time"}</h3>
                    <p className="text-muted-foreground">{hoursLines[0] || "Usually within 3 hours"}</p>
                    {hoursLines[1] && <p className="text-sm text-muted-foreground">{hoursLines[1]}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                  Send us a Message
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
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="enterprise">Enterprise Sales</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
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
    </div>;
}
