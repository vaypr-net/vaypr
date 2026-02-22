import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const scrollToSection = () => {
        const target = document.getElementById(id);
        if (!target) {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          return;
        }

        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: y, left: 0, behavior: "smooth" });
      };

      window.requestAnimationFrame(scrollToSection);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
