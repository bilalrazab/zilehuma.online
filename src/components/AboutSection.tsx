import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Heart, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const THERAPY_ROOM_IMAGE_URL = "/images/about-therapy-room.jpg";

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
          <img
            src={THERAPY_ROOM_IMAGE_URL}
            alt="Calming therapy room for clinical psychology sessions in Islamabad"
            width={1280}
            height={720}
            loading="lazy"
            className="w-full rounded-2xl mb-8 object-cover aspect-video"
          />

          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 font-body">
            I'm Zil-e-Huma Suleman, a Clinical Psychologist practicing from The Plazzo, Gulberg Greens, Islamabad. I hold an
            MS in Clinical Psychology and have gained hands-on experience across
            hospital, rehabilitation, and therapeutic settings — including Military Hospital Rawalpindi and specialized rehabilitation centers.
          </p>
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 font-body">
            My practice is rooted in evidence-based therapy, including{" "}
            <Link to="/services/behavioral-therapy" className="text-primary hover:underline">Cognitive Behavioral Therapy (CBT)</Link>,{" "}
            <Link to="/services/hypnotherapy-sessions" className="text-primary hover:underline">hypnotherapy</Link>, and client-centered mental healthcare. I believe in creating a space where
            emotional safety, confidentiality, and ethical practice come first — because healing begins
            when you feel truly heard.
          </p>
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-8 font-body">
            Whether you're dealing with anxiety, depression, trauma, or simply seeking personal growth,
            I offer both{" "}
            <Link to="/services/individual-therapy" className="text-primary hover:underline">in-person sessions</Link> and{" "}
            <Link to="/services/online-counseling" className="text-primary hover:underline">online counseling</Link> to meet you where you are.
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
