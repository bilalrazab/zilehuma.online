import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Experience", href: "#experience" },
  { label: "Blog", href: "/blog", isRoute: true },
  { label: "Booking", href: "#booking" },
  { label: "Contact", href: "#contact" },
  { label: "Dashboard", href: "/dashboard", isRoute: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavClick = (e: React.MouseEvent, l: typeof navLinks[0]) => {
    e.preventDefault();
    setOpen(false);

    if ((l as any).isRoute) {
      navigate(l.href);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (l.href === "#home") {
      if (location.pathname !== "/") {
        navigate("/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToHash(l.href), 400);
    } else {
      scrollToHash(l.href);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-3" : "py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="font-heading text-lg font-bold text-foreground">
          Zil-e-Huma
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={(l as any).isRoute ? l.href : "/" + l.href}
              onClick={(e) => handleNavClick(e, l)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="p-2 text-foreground" aria-label="Menu">
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass mt-2 mx-4 rounded-2xl p-4 flex flex-col gap-3 animate-fade-up">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={(l as any).isRoute ? l.href : "/" + l.href}
              onClick={(e) => handleNavClick(e, l)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
