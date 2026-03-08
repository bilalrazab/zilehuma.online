import { Instagram, Linkedin, MessageCircle, ExternalLink } from "lucide-react";

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/mindframe_mentality/", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/Zilehuma-Suleman", icon: Linkedin },
  { label: "WhatsApp", href: "https://wa.me/923281022334", icon: MessageCircle },
  { label: "Oladoc", href: "https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455", icon: ExternalLink },
];

const Footer = () => (
  <footer className="border-t border-border py-8 text-center">
    <div className="max-w-6xl mx-auto px-4">
      <p className="font-heading text-foreground font-semibold mb-1">Zil-e-Huma Suleman</p>
      <p className="text-sm text-muted-foreground">Clinical Psychologist · Islamabad, Pakistan</p>

      <div className="flex items-center justify-center gap-3 mt-4">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={s.label}
          >
            <s.icon className="w-4 h-4" />
          </a>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
