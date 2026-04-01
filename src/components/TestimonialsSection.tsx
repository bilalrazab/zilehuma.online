import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getTestimonials, type Testimonial } from "@/lib/testimonialStorage";
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, ShieldCheck, PenLine } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const AvatarInitials = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-primary font-heading font-bold text-lg shrink-0">
      {initials}
    </div>
  );
};

const TestimonialCard = ({ testimonial, isActive }: { testimonial: Testimonial; isActive: boolean }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div
      className={`glass-card !p-8 transition-all duration-500 ${
        isActive ? "scale-100 opacity-100" : "scale-95 opacity-40 pointer-events-none"
      }`}
    >
      <div className="flex items-start gap-4 mb-5">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
          />
        ) : (
          <AvatarInitials name={testimonial.name} />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-heading font-semibold text-foreground">{testimonial.name}</h4>
            {testimonial.verified && (
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
          <p className="text-sm text-primary font-medium">{testimonial.role}</p>
          <div className="flex items-center gap-3 mt-1">
            <StarRating rating={testimonial.rating} />
            {testimonial.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {testimonial.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <Quote className="w-8 h-8 text-primary/10 absolute -top-1 -left-1" />
        <p className="text-muted-foreground leading-relaxed pl-5 italic">
          "{testimonial.text}"
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-right">{formatDate(testimonial.created_at)}</p>
    </div>
  );
};

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const ref = useScrollReveal();

  useEffect(() => {
    getTestimonials().then(setTestimonials);
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next, testimonials.length]);

  if (testimonials.length === 0) return null;

  const avgRating = (
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
  ).toFixed(1);

  return (
    <section id="testimonials" className="relative overflow-hidden">
      <div className="section-container" ref={ref} style={{ opacity: 1 }}>
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-medium tracking-widest uppercase">
            Testimonials
          </span>
          <h2 className="section-title mt-2">What Clients Say</h2>
          <p className="section-subtitle mx-auto">
            Real experiences from people who found support, clarity, and healing.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i <= Math.round(Number(avgRating))
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="font-heading font-bold text-foreground text-lg">
              {avgRating}
            </span>
            <span className="text-muted-foreground text-sm">
              · {testimonials.length} reviews
            </span>
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 mb-8">
          {testimonials.slice(0, 4).map((t) => (
            <TestimonialCard key={t.id} testimonial={t} isActive={true} />
          ))}
        </div>

        {/* Mobile: Carousel with swipe */}
        <div
          className="md:hidden relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._touchStartX = touch.clientX;
            (e.currentTarget as any)._touchStartY = touch.clientY;
            setIsAutoPlaying(false);
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX;
            const startY = (e.currentTarget as any)._touchStartY;
            if (startX == null) return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = Math.abs(startY - endY);
            if (Math.abs(diffX) > 50 && diffY < 100) {
              if (diffX > 0) next();
              else prev();
            }
            setIsAutoPlaying(true);
          }}
        >
          <div className="overflow-hidden">
            <TestimonialCard
              testimonial={testimonials[current]}
              isActive={true}
            />
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Show more if > 4 on desktop */}
        {testimonials.length > 4 && (
          <div className="hidden md:grid md:grid-cols-2 gap-6 mt-6">
            {testimonials.slice(4).map((t) => (
              <TestimonialCard key={t.id} testimonial={t} isActive={true} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/testimonial/new">
            <Button variant="outline" className="gap-2">
              <PenLine className="w-4 h-4" /> Share Your Experience
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
