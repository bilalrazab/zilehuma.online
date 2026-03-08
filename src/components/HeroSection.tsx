import { lazy, Suspense } from "react";
import { Button } from "./ui/button";
import { CalendarDays, Sparkles } from "lucide-react";

const PetalCanvas = lazy(() => import("./PetalCanvas"));

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      <PetalCanvas />

      {/* Floating decorative orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-sage/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-lavender/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 text-center px-4 max-w-2xl" style={{ perspective: "1000px" }}>
        <div
          className="glass-card p-8 sm:p-12 mx-auto"
          style={{ transform: "rotateX(2deg) rotateY(-1deg)", transformStyle: "preserve-3d" }}
        >
          <p className="text-sm tracking-widest uppercase text-muted-foreground mb-3 font-body">
            Clinical Psychologist · Islamabad
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-4 text-foreground leading-tight">
            Zil-e-Huma<br />
            <span className="text-gradient">Suleman</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto font-body leading-relaxed">
            Creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <a href="#booking">
                <CalendarDays className="w-4 h-4" />
                Book Online Session
              </a>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <a href="#services">
                <Sparkles className="w-4 h-4" />
                View Services
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
