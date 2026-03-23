import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Heart, Shield, BookOpen } from "lucide-react";

const AboutSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="about" className="section-container">
      <div ref={ref} className="opacity-0 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">About Me</h2>
          <p className="section-subtitle mx-auto">Compassionate care rooted in evidence-based practice.</p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 font-body">
            I'm Zil-e-Huma Suleman, a Clinical Psychologist based in Islamabad, Pakistan. I completed my
            MS in Clinical Psychology from SZABIST (2024–2026) and have gained hands-on experience across
            hospital, rehabilitation, and therapeutic settings.
          </p>
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-8 font-body">
            My practice is rooted in evidence-based therapy, including Cognitive Behavioral Therapy (CBT),
            hypnotherapy, and client-centered mental healthcare. I believe in creating a space where
            emotional safety, confidentiality, and ethical practice come first — because healing begins
            when you feel truly heard.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "Empathetic Care", desc: "Warm, judgment-free therapeutic relationship" },
              { icon: Shield, title: "Confidential", desc: "Complete privacy and ethical practice" },
              { icon: BookOpen, title: "Evidence-Based", desc: "Modern, research-backed techniques" },
            ].map((item) => (
              <div key={item.title} className="bg-muted rounded-2xl p-5 text-center">
                <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-heading font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
