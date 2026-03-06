const Footer = () => (
  <footer className="border-t border-border py-8 text-center">
    <div className="max-w-6xl mx-auto px-4">
      <p className="font-heading text-foreground font-semibold mb-1">Zil-e-Huma Suleman</p>
      <p className="text-sm text-muted-foreground">Clinical Psychologist · Islamabad, Pakistan</p>
      <p className="text-xs text-muted-foreground mt-3">© {new Date().getFullYear()} All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
