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
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-foreground/40 dark:bg-foreground/60" />

      <Suspense fallback={null}>
        <PetalCanvas />
      </Suspense>

      <div className="relative z-10 text-center px-4 max-w-2xl" style={{ perspective: "1000px" }}>
        <div
          className="glass-card p-8 sm:p-12 mx-auto"
          style={{ transform: "rotateX(2deg) rotateY(-1deg)", transformStyle: "preserve-3d" }}
        >
          <p className="text-sm tracking-widest uppercase text-muted-foreground mb-3 font-body">
            Zil-e-Huma Suleman
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-4 text-foreground leading-tight">
            Clinical Psychologist Islamabad:<br />
            <span className="text-gradient">Your Path to Mental Wellness</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto font-body leading-relaxed">
            Creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={(e) => handleCTA(e, "booking")}>
              <CalendarDays className="w-4 h-4" />
              Book Online Session
            </Button>
            <Button variant="glass" size="lg" onClick={(e) => handleCTA(e, "services")}>
              <Sparkles className="w-4 h-4" />
              View Services
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
