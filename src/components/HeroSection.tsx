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

const TAGLINE = "Your Path to Mental Wellness";
const SWEEP_COLORS = ['#E8B84B', '#E89D3E', '#D4783A', '#C75B8F', '#B04A9B'];

const getCharColor = (charIndex: number, cursorPos: number, totalChars: number): string => {
  const dist = charIndex - cursorPos;
  if (dist < -2 || dist > 2) {
    // Sage-to-lavender gradient based on position in text
    const t = totalChars > 1 ? charIndex / (totalChars - 1) : 0;
    // Interpolate from sage (hsl 152,30%,62%) to lavender (hsl 260,40%,72%)
    const h = 152 + t * (260 - 152);
    const s = 30 + t * (40 - 30);
    const l = 62 + t * (72 - 62);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  const idx = dist + 2;
  return SWEEP_COLORS[idx];
};

const HighlightTagline = () => {
  const [cursor, setCursor] = useState(-3);
  const chars = TAGLINE.split('');

  useEffect(() => {
    let animFrame: number;
    let start: number | null = null;
    const totalChars = chars.length;
    const speed = 120; // ms per character (halved speed)
    const pauseMs = 3000;
    const sweepDuration = (totalChars + 6) * speed;
    const cycleDuration = sweepDuration + pauseMs;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % cycleDuration;
      
      if (elapsed < sweepDuration) {
        const pos = Math.floor(elapsed / speed) - 3;
        setCursor(pos);
      } else {
        setCursor(-10); // off screen — all white
      }
      animFrame = requestAnimationFrame(animate);
    };

    // Small initial delay
    const timeout = setTimeout(() => {
      animFrame = requestAnimationFrame(animate);
    }, 600);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animFrame);
    };
  }, [chars.length]);

  return (
    <span className="block text-2xl sm:text-3xl lg:text-5xl text-white">
      {chars.map((ch, i) => (
        <span
          key={i}
          style={{
            color: getCharColor(i, cursor, chars.length),
            transition: 'color 0.15s ease',
          }}
        >
          {ch}
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
      <picture>
        <source srcSet="/images/hero-bg.webp" type="image/webp" />
        <img
          src="/images/hero-bg.jpg"
          alt="Calming therapy office of Clinical Psychologist Zil-e-Huma Suleman in Islamabad"
          width={1200}
          height={675}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </picture>
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
