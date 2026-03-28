import { lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { CalendarDays, Sparkles } from "lucide-react";

const PetalCanvas = lazy(() => import("./PetalCanvas"));

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

const HeroSection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCTA = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(sectionId), 400);
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <section id="home" className="relative min-h-screen pt-24 sm:pt-28 lg:pt-32 flex items-center justify-center overflow-hidden">
      {/* Hero background image */}
      <img
        src="/images/hero-bg.jpg"
        alt="Calming therapy office of Clinical Psychologist Zil-e-Huma Suleman in Islamabad"
        width={1920}
        height={1080}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-foreground/50 dark:bg-foreground/65" />

      <Suspense fallback={null}>
        <PetalCanvas />
      </Suspense>

      <div className="relative z-10 text-center px-4 max-w-4xl">
        <p className="text-sm sm:text-base tracking-[0.2em] uppercase text-white/80 mb-4 font-body drop-shadow-md">
          Zil-e-Huma Suleman
        </p>
        <h1 className="font-heading font-bold mb-5 text-white leading-tight drop-shadow-lg">
          <span className="block text-2xl sm:text-3xl lg:text-4xl mb-2">Clinical Psychologist Islamabad</span>
          <span className="block text-3xl sm:text-4xl lg:text-5xl text-gradient whitespace-nowrap">Your Path to Mental Wellness</span>
        </h1>
        <p className="text-white/90 text-base sm:text-lg mb-10 max-w-lg mx-auto font-body leading-relaxed drop-shadow-md">
          Creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={(e) => handleCTA(e, "booking")}>
            <CalendarDays className="w-4 h-4" />
            Book Online Session
          </Button>
          <Button variant="glass" size="lg" className="text-white border-white/30" onClick={(e) => handleCTA(e, "services")}>
            <Sparkles className="w-4 h-4" />
            View Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
