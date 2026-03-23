import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Brain, HeartPulse, Sparkles, Activity, ClipboardCheck, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  { icon: Brain, title: "Individual Therapy", slug: "individual-therapy", desc: "One-on-one sessions tailored to your unique needs and personal growth journey." },
  { icon: HeartPulse, title: "Anxiety & Stress Management", slug: "anxiety-stress-management", desc: "Evidence-based techniques to manage anxiety, stress, and overwhelming emotions." },
  { icon: Sparkles, title: "Hypnotherapy Sessions", slug: "hypnotherapy-sessions", desc: "Guided hypnotherapy for deep relaxation, behavioral change, and inner healing." },
  { icon: Activity, title: "Behavioral Therapy", slug: "behavioral-therapy", desc: "Structured CBT approaches to reshape thought patterns and build healthier habits." },
  { icon: ClipboardCheck, title: "Psychological Assessments", slug: "psychological-assessments", desc: "Comprehensive psychological evaluations for accurate understanding and treatment planning." },
  { icon: Monitor, title: "Online Counseling", slug: "online-counseling", desc: "Convenient, confidential therapy sessions from the comfort of your home." },
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <Link
              key={s.title}
              to={`/services/${s.slug}`}
              className="glass-card flex flex-col items-start group hover:border-primary/30 transition-colors"
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
