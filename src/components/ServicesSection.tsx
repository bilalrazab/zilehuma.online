import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Brain, HeartPulse, Sparkles, Activity, ClipboardCheck, Monitor } from "lucide-react";

const services = [
  { icon: Brain, title: "Individual Therapy", desc: "One-on-one sessions tailored to your unique needs and personal growth journey." },
  { icon: HeartPulse, title: "Anxiety & Stress Management", desc: "Evidence-based techniques to manage anxiety, stress, and overwhelming emotions." },
  { icon: Sparkles, title: "Hypnotherapy Sessions", desc: "Guided hypnotherapy for deep relaxation, behavioral change, and inner healing." },
  { icon: Activity, title: "Behavioral Therapy", desc: "Structured CBT approaches to reshape thought patterns and build healthier habits." },
  { icon: ClipboardCheck, title: "Psychological Assessments", desc: "Comprehensive psychological evaluations for accurate understanding and treatment planning." },
  { icon: Monitor, title: "Online Counseling", desc: "Convenient, confidential therapy sessions from the comfort of your home." },
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
            <div key={s.title} className="glass-card flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
