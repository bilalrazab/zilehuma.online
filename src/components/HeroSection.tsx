import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

const PetalCanvas = lazy(() => import("./PetalCanvas"));

const DelayedPetalCanvas = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(id);
  }, []);
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <PetalCanvas />
    </Suspense>
  );
};

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const TAGLINE = "Your Path to Mental Wellness";
const SWEEP_COLORS = ['#E8B84B', '#E89D3E', '#D4783A', '#C75B8F', '#B04A9B'];

const getCharColor = (charIndex: number, cursorPos: number, totalChars: number): string => {
  const dist = charIndex - cursorPos;
  if (dist < -2 || dist > 2) {
    const t = totalChars > 1 ? charIndex / (totalChars - 1) : 0;
    const h = 152 + t * (260 - 152);
    const s = 30 + t * (40 - 30);
    const l = 62 + t * (72 - 62);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  const idx = dist + 2;
  return SWEEP_COLORS[idx];
};

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
  </svg>
);

const HighlightTagline = () => {
  const [cursor, setCursor] = useState(-3);
  const chars = TAGLINE.split('');

  useEffect(() => {
    let animFrame: number;
    let start: number | null = null;
    const totalChars = chars.length;
    const speed = 120;
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
        setCursor(-10);
      }
      animFrame = requestAnimationFrame(animate);
    };

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
        <source srcSet="/images/hero-bg-mobile.webp" type="image/webp" media="(max-width: 768px)" />
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

      <DelayedPetalCanvas />

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
            <CalendarIcon />
            Book Online Session
          </Button>
          <Button variant="glass" size="lg" className="w-full sm:w-auto text-white border-white/30" onClick={(e) => handleCTA(e, "services")}>
            <SparklesIcon />
            View Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
