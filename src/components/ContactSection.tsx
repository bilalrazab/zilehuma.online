import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

const ContactSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="contact" className="section-container">
      <div ref={ref} className="opacity-0 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Get in Touch</h2>
          <p className="section-subtitle mx-auto">I'm here to help. Reach out anytime.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card p-8 flex flex-col gap-6">
            {[
              { icon: Mail, label: "Email", value: "zilehumaconsultant@gmail.com", href: "mailto:zilehumaconsultant@gmail.com" },
              { icon: Phone, label: "Phone", value: "+92 328 1022334", href: "tel:+923281022334" },
              { icon: MapPin, label: "Location", value: "The Plazzo, Gulberg Greens, Islamabad", href: "https://maps.app.goo.gl/eWJniqQqGSQQ16im9" },
            ].map((c) => (
              <a key={c.label} href={c.href} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-foreground font-body">{c.value}</p>
                </div>
              </a>
            ))}

            <Button size="lg" className="mt-2" asChild>
              <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </Button>

            <div className="flex gap-3 mt-2">
              <a href="https://www.instagram.com/mindframe_mentality/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Instagram</a>
              <a href="https://www.linkedin.com/in/zile-huma-a85724235?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
              <a href="https://www.tiktok.com/@zile_humaa" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">TikTok</a>
              <a href="https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Oladoc</a>
            </div>
          </div>

          <div className="glass-card p-2 overflow-hidden">
            <iframe
              title="Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d212645.48222442044!2d72.92988904999999!3d33.6162595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfbfd07891722f%3A0x6059515c3b55e7e8!2sIslamabad%2C%20Islamabad%20Capital%20Territory%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000"
              className="w-full h-full min-h-[280px] rounded-2xl"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
