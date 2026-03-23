import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Brain, HeartPulse, Sparkles, Activity, ClipboardCheck, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import mentalWellnessAsset from "@/assets/mental-wellness.jpg.asset.json";

const services = [
  { icon: Brain, title: "Individual Therapy", slug: "individual-therapy", desc: "One-on-one sessions for anxiety, depression, trauma, and personal growth — tailored to your unique needs and healing journey." },
  { icon: HeartPulse, title: "Anxiety & Stress Management", slug: "anxiety-stress-management", desc: "Practical CBT techniques and mindfulness strategies to manage anxiety triggers, panic attacks, and overwhelming stress." },
  { icon: Sparkles, title: "Hypnotherapy Sessions", slug: "hypnotherapy-sessions", desc: "Clinical hypnotherapy for phobias, habit change, emotional blocks, and deep relaxation through guided subconscious work." },
  { icon: Activity, title: "Behavioral Therapy (CBT)", slug: "behavioral-therapy", desc: "Structured Cognitive Behavioral Therapy to reshape negative thought patterns, improve relationships, and build lasting habits." },
  { icon: ClipboardCheck, title: "Psychological Assessments", slug: "psychological-assessments", desc: "Comprehensive diagnostic evaluations using standardized tools for accurate understanding and personalized treatment planning." },
  { icon: Monitor, title: "Online Counseling", slug: "online-counseling", desc: "Secure, convenient video therapy sessions from anywhere in Pakistan — same quality care from the comfort of your home." },
];

const ServicesSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="services" className="section-container bg-muted/30">
      <div ref={ref} className="opacity-0">
        <div className="text-center mb-12">
          <h2 className="section-title">Services</h2>
          <p className="section-subtitle mx-auto">Comprehensive mental health support tailored to you.</p>
        </div>

        <div className="max-w-5xl mx-auto mb-10">
          <img
            src={mentalWellnessAsset.url}
            alt="Mental wellness illustration representing therapy services by Clinical Psychologist in Islamabad"
            width={1280}
            height={720}
            loading="lazy"
            className="w-full max-w-md mx-auto rounded-2xl object-contain"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <Link
              key={s.title}
              to={`/services/${s.slug}`}
              className="glass-card flex flex-col items-start group hover:border-primary/30 transition-colors"
              aria-label={`Learn more about ${s.title} services in Islamabad`}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
              <span className="text-xs text-primary mt-3 group-hover:underline">Learn more →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
