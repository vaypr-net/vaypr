import { Star } from "lucide-react";
import { useLandingPage } from "@/hooks/useLandingPage";

const defaultTestimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    avatar: "SC",
    content: "VAYPR has completely transformed how I manage my freelance business. Invoicing used to take hours, now it takes minutes.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Small Business Owner",
    avatar: "MJ",
    content: "The expense tracking feature alone has saved me thousands in tax season. I can't imagine running my business without VAYPR.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Consultant",
    avatar: "ER",
    content: "Clean interface, powerful features, and incredible support. This is exactly what small businesses need.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const { data: landingPage } = useLandingPage();
  
  const section = landingPage?.testimonialsSection;
  const isEnabled = section?.enabled ?? true;
  const badge = section?.badge ?? "Testimonials";
  const headline = section?.headline ?? "Loved by businesses everywhere";
  const testimonials = section?.testimonials && section.testimonials.length > 0 
    ? section.testimonials 
    : defaultTestimonials;

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            {badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {headline}
            </span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
