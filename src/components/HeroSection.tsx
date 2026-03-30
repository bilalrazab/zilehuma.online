import { lazy, Suspense, useEffect, useState, useCallback } from "react";
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

const TAGLINE_WORDS = ["Your", "Path", "to", "Mental", "Wellness"];

const HighlightTagline = () => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const cycle = useCallback(() => {
    let i = 0;
    setActiveIndex(0);
    const interval = setInterval(() => {
      i++;
      if (i >= TAGLINE_WORDS.length) {
        clearInterval(interval);
        setTimeout(() => setActiveIndex(-1), 600);
      } else {
        setActiveIndex(i);
      }
    }, 320);
    return interval;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      cycle();
      const loop = setInterval(() => cycle(), TAGLINE_WORDS.length * 320 + 2500);
      return () => clearInterval(loop);
    }, 800);
    return () => clearTimeout(timeout);
  }, [cycle]);

  return (
    <span className="block text-2xl sm:text-3xl lg:text-5xl">
      {TAGLINE_WORDS.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-300 ease-out mr-[0.3em] last:mr-0"
          style={{
            color: activeIndex === i
              ? 'hsl(var(--primary))'
              : 'white',
            textShadow: activeIndex === i
              ? '0 0 20px hsl(var(--primary) / 0.5)'
              : '0 2px 8px rgba(0,0,0,0.4)',
            transform: activeIndex === i ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
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
    <section id="home" className="relative min-h-[100svh] pt-28 sm:pt-32 lg:pt-36 pb-16 flex items-center justify-center overflow-hidden">
      <img
        src="/images/hero-bg.jpg"
        alt="Calming therapy office of Clinical Psychologist Zil-e-Huma Suleman in Islamabad"
        width={1920}
        height={1080}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55 dark:bg-black/65" />

      <Suspense fallback={null}>
        <PetalCanvas />
      </Suspense>

      <div className="relative z-10 text-center px-6 sm:px-8 w-full max-w-2xl lg:max-w-4xl mx-auto">
        <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-white/80 mb-3 font-body drop-shadow-md">
          Zil-e-Huma Suleman
        </p>
        <h1 className="font-heading font-bold mb-4 text-white leading-tight drop-shadow-lg">
          <span className="block text-xl sm:text-2xl lg:text-4xl mb-1">Clinical Psychologist Islamabad</span>
          <HighlightTagline />
        </h1>
        <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-8 max-w-md mx-auto font-body leading-relaxed drop-shadow-md">
          Creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
          <Button size="lg" className="w-full sm:w-auto" onClick={(e) => handleCTA(e, "booking")}>
            <CalendarDays className="w-4 h-4" />
            Book Online Session
          </Button>
          <Button variant="glass" size="lg" className="w-full sm:w-auto text-white border-white/30" onClick={(e) => handleCTA(e, "services")}>
            <Sparkles className="w-4 h-4" />
            View Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
