import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Heart, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const THERAPY_ROOM_IMAGE_WEBP = "/images/about-therapy-room.webp";
const THERAPY_ROOM_IMAGE_JPG = "/images/about-therapy-room.jpg";

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
          <picture>
            <source srcSet={THERAPY_ROOM_IMAGE_WEBP} type="image/webp" />
            <img
              src={THERAPY_ROOM_IMAGE_JPG}
              alt="Calming therapy room for clinical psychology sessions in Islamabad"
              width={800}
              height={450}
              loading="lazy"
              decoding="async"
              className="w-full rounded-2xl mb-8 object-cover aspect-video"
            />
          </picture>

          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 font-body">
            I'm Zil-e-Huma Suleman, a Clinical Psychologist practicing from The Plazzo, Gulberg Greens, Islamabad. I hold an
            MS in Clinical Psychology and have gained hands-on experience across
            hospital, rehabilitation, and therapeutic settings — including Military Hospital Rawalpindi and specialized rehabilitation centers.
          </p>
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 font-body">
            My practice is rooted in evidence-based therapy, including{" "}
            <Link to="/services/behavioral-therapy" className="text-primary underline underline-offset-2 hover:text-primary/80">Cognitive Behavioral Therapy (CBT)</Link>,{" "}
            <Link to="/services/hypnotherapy-sessions" className="text-primary underline underline-offset-2 hover:text-primary/80">hypnotherapy</Link>, and client-centered mental healthcare. I believe in creating a space where
            emotional safety, confidentiality, and ethical practice come first — because healing begins
            when you feel truly heard.
          </p>
          <p className="text-foreground/90 leading-relaxed text-base sm:text-lg mb-8 font-body">
            Whether you're dealing with anxiety, depression, trauma, or simply seeking personal growth,
            I offer both{" "}
            <Link to="/services/individual-therapy" className="text-primary underline underline-offset-2 hover:text-primary/80">in-person sessions</Link> and{" "}
            <Link to="/services/online-counseling" className="text-primary underline underline-offset-2 hover:text-primary/80">online counseling</Link> to meet you where you are.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
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

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <h3 className="font-heading font-semibold text-foreground mb-3 text-center">What Sets This Practice Apart</h3>
            <ul className="space-y-2 text-sm text-foreground/85 font-body">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span> Bilingual sessions in both Urdu and English for comfortable, natural communication</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span> Rare combination of clinical hypnotherapy and CBT under one practitioner</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span> Hospital-trained clinical experience (Military Hospital Rawalpindi) — not just theoretical knowledge</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span> Flexible online and in-person sessions from Gulberg Greens, Islamabad</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
