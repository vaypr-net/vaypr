import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionNavigation = (sectionId: string) => {
    setMobileMenuOpen(false);

    if (location.pathname === "/") {
      const target = document.getElementById(sectionId);
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        window.location.hash = sectionId;
      }
      return;
    }

    navigate(`/#${sectionId}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg font-display">V</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">VAYPR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleSectionNavigation("features")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => handleSectionNavigation("how-it-works")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              How it Works
            </button>
            <button
              type="button"
              onClick={() => handleSectionNavigation("pricing")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Pricing
            </button>
            <Link
              to="/user-manual"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              User Manual
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="font-medium">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-glow">
              <Link to="/signup">Start Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleSectionNavigation("features")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => handleSectionNavigation("how-it-works")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                How it Works
              </button>
              <button
                type="button"
                onClick={() => handleSectionNavigation("pricing")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Pricing
              </button>
              <Link
                to="/user-manual"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                User Manual
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to="/signup">Start Free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
