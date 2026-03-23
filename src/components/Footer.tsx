import { useNavigate, useLocation } from "react-router-dom";
import { Instagram, Linkedin, MessageCircle, ExternalLink, Facebook, Twitter } from "lucide-react";

const TikTokIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/mindframe_mentality/", icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@zile_humaa", icon: TikTokIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zile-huma-a85724235?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/share/1ZofHY43Gq/", icon: Facebook },
  { label: "X (Twitter)", href: "https://x.com/", icon: Twitter },
  { label: "WhatsApp", href: "https://wa.me/923281022334", icon: MessageCircle },
  { label: "Oladoc", href: "https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455", icon: ExternalLink },
];

const siteLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Blog", href: "/blog", isRoute: true },
  { label: "FAQ", href: "#faq" },
  { label: "Booking", href: "#booking" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleClick = (e: React.MouseEvent, link: typeof siteLinks[0]) => {
    e.preventDefault();
    if ((link as any).isRoute) {
      navigate(link.href);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (link.href === "/") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToHash(link.href), 400);
    } else {
      scrollToHash(link.href);
    }
  };

  return (
  <footer className="border-t border-border py-10 text-center">
    <div className="max-w-6xl mx-auto px-4">
      <p className="font-heading text-foreground font-semibold mb-1">Zil-e-Huma Suleman</p>
      <p className="text-sm text-muted-foreground">Clinical Psychologist · Islamabad, Pakistan</p>

      <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 mt-5">
        {siteLinks.map((link) => (
          <a
            key={link.href}
            href={link.isRoute ? link.href : link.href === "/" ? "/" : "/" + link.href}
            onClick={(e) => handleClick(e, link)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center justify-center gap-3 mt-5">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={s.label}
            aria-label={`Visit ${s.label}`}
          >
            <s.icon className="w-4 h-4" />
          </a>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
        <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate("/privacy-policy"); }} className="hover:text-foreground transition-colors">Privacy Policy</a>
      </div>

      <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} All rights reserved.</p>
      <p className="text-xs text-muted-foreground mt-2">
        Developed by{" "}
        <a href="https://bilal-razab.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Bilal Razab
        </a>
      </p>
    </div>
  </footer>
  );
};

export default Footer;
