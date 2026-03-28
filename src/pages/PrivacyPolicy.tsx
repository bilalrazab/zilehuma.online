import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { lazy, Suspense, useEffect } from "react";
import {
  Shield, Lock, Eye, Cookie, UserCheck, Bell, Mail, Phone, MapPin,
  MessageCircle, Globe, BarChart3, FileText, CheckCircle2, AlertTriangle,
  Clock, Database, Server, Fingerprint, Scale, Heart, ExternalLink,
  Instagram, Linkedin, Facebook
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Footer = lazy(() => import("@/components/Footer"));

const TikTokIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const SectionCard = ({ icon: Icon, title, children, id }: { icon: any; title: string; children: React.ReactNode; id?: string }) => (
  <section id={id} className="glass-card p-6 sm:p-8 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground m-0">{title}</h2>
    </div>
    <div className="text-muted-foreground leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5">
    <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
    <span>{children}</span>
  </li>
);

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const tocItems = [
    { id: "introduction", label: "Introduction", icon: FileText },
    { id: "information-collected", label: "Information We Collect", icon: Database },
    { id: "how-we-use", label: "How We Use Your Data", icon: BarChart3 },
    { id: "legal-basis", label: "Legal Basis", icon: Scale },
    { id: "data-protection", label: "Data Protection", icon: Shield },
    { id: "confidentiality", label: "Session Confidentiality", icon: Lock },
    { id: "third-party", label: "Third-Party Services", icon: Globe },
    { id: "cookies", label: "Cookies & Tracking", icon: Cookie },
    { id: "data-retention", label: "Data Retention", icon: Clock },
    { id: "your-rights", label: "Your Rights", icon: UserCheck },
    { id: "children", label: "Children's Privacy", icon: Heart },
    { id: "international", label: "International Transfers", icon: Server },
    { id: "breach", label: "Data Breach Protocol", icon: AlertTriangle },
    { id: "changes", label: "Policy Changes", icon: Bell },
    { id: "contact", label: "Contact Us", icon: Mail },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Privacy Policy</li>
            </ol>
          </nav>

          {/* Hero Header */}
          <div className="glass-card p-8 sm:p-12 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground text-lg mt-2">Your privacy matters. Here's how we protect it.</p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Last updated: March 28, 2026</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> ~8 min read</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> zilehuma.online</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "100% Confidential", desc: "All therapy sessions and personal data are kept strictly private" },
              { icon: Fingerprint, title: "No Data Selling", desc: "We never sell, trade, or rent your personal information" },
              { icon: UserCheck, title: "Full Control", desc: "You can access, update, or delete your data at any time" },
            ].map((item) => (
              <Card key={item.title} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6 text-center space-y-2">
                  <item.icon className="w-8 h-8 text-primary mx-auto" />
                  <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table of Contents */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" /> Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tocItems.map((item, i) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>{i + 1}. {item.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 1. Introduction */}
          <SectionCard icon={FileText} title="1. Introduction" id="introduction">
            <p>
              Zil-e-Huma Suleman operates the website <a href="https://zilehuma.online" className="text-primary hover:underline">zilehuma.online</a>. This comprehensive Privacy Policy explains in detail how we collect, use, store, protect, and disclose your personal information when you visit our website, use our online or in-person therapy services, communicate with us through any channel, or interact with our digital platforms.
            </p>
            <p>
              As a Clinical Psychologist based in Islamabad, Pakistan, maintaining the privacy and confidentiality of our clients is not just a legal obligation — it is a core ethical responsibility that guides every aspect of our practice. We adhere to the professional ethics guidelines set forth by the Pakistan Psychological Association, international standards of clinical psychology, and all applicable Pakistani data protection regulations.
            </p>
            <p>
              This policy applies to all individuals who visit our website, inquire about our services, book appointments, attend therapy sessions, submit testimonials, subscribe to our communications, or interact with us through social media, email, WhatsApp, or phone calls. By using our services or website, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <p>
              We strongly believe in transparency, and this document is designed to give you a clear understanding of your data and how it is handled. If anything in this policy is unclear, we encourage you to reach out to us directly for clarification.
            </p>
          </SectionCard>

          {/* 2. Information We Collect */}
          <SectionCard icon={Database} title="2. Information We Collect" id="information-collected">
            <p>We collect different categories of information depending on how you interact with us. Below is a detailed breakdown:</p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Data Types</TableHead>
                    <TableHead className="font-semibold">How Collected</TableHead>
                    <TableHead className="font-semibold">Required?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Personal Identity</TableCell>
                    <TableCell>Full name, age, gender, marital status</TableCell>
                    <TableCell>Intake forms, booking</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contact Details</TableCell>
                    <TableCell>Email, phone number, WhatsApp number, city/location</TableCell>
                    <TableCell>Contact form, WhatsApp, email</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Clinical Information</TableCell>
                    <TableCell>Session notes, psychological assessments, treatment plans, progress records</TableCell>
                    <TableCell>During therapy sessions</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Health History</TableCell>
                    <TableCell>Medical history, medication, previous therapy records, family health background</TableCell>
                    <TableCell>Intake assessment</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Payment Information</TableCell>
                    <TableCell>Payment method, transaction IDs, billing records</TableCell>
                    <TableCell>Payment processing</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Testimonials</TableCell>
                    <TableCell>Name, role/title, written feedback, optional photo</TableCell>
                    <TableCell>Voluntary submission</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Optional</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Website Analytics</TableCell>
                    <TableCell>Pages visited, session duration, device type, browser, OS, screen resolution, referral source</TableCell>
                    <TableCell>Automated (cookies & analytics)</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Automatic</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Communication Logs</TableCell>
                    <TableCell>Email threads, WhatsApp messages, call records related to appointments</TableCell>
                    <TableCell>Direct communication</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Varies</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-sm">
              <strong>Note:</strong> We only collect information that is necessary for providing our services effectively. We follow the principle of data minimization — we do not request or store data beyond what is required for clinical care, appointment management, and website improvement.
            </p>
          </SectionCard>

          {/* 3. How We Use Your Data */}
          <SectionCard icon={BarChart3} title="3. How We Use Your Information" id="how-we-use">
            <p>Your information is used strictly for legitimate purposes related to our clinical practice and website operations:</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Clinical Services", items: ["Conduct psychological assessments and evaluations", "Develop personalized treatment plans", "Track therapeutic progress over sessions", "Provide evidence-based interventions (CBT, Hypnotherapy, etc.)", "Coordinate care with other healthcare providers when authorized", "Maintain accurate clinical records as professionally required"] },
                { title: "Communication", items: ["Respond to inquiries via email, phone, or WhatsApp", "Send appointment confirmations and reminders", "Follow up on missed or rescheduled sessions", "Share relevant mental health resources with consent", "Provide session summaries when requested"] },
                { title: "Website & Experience", items: ["Display approved testimonials on our website", "Analyze website traffic patterns to improve user experience", "Optimize content for relevance and accessibility", "Ensure website security and prevent misuse", "Improve page load speed and navigation"] },
                { title: "Legal & Professional", items: ["Comply with Pakistani legal and regulatory requirements", "Maintain professional licensing and ethical standards", "Generate anonymized statistical data for research purposes", "Respond to lawful requests from authorities when required", "Protect the rights and safety of our clients and practice"] },
              ].map((group) => (
                <div key={group.title} className="rounded-2xl border border-border/50 p-4 space-y-2">
                  <h4 className="font-heading font-semibold text-foreground text-sm">{group.title}</h4>
                  <ul className="space-y-1.5 text-sm">
                    {group.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 4. Legal Basis */}
          <SectionCard icon={Scale} title="4. Legal Basis for Processing" id="legal-basis">
            <p>We process your personal data based on the following legal grounds:</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Legal Basis</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Examples</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Consent</TableCell>
                    <TableCell>You have given explicit consent for data processing</TableCell>
                    <TableCell>Testimonials, marketing communications, optional surveys</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contractual Necessity</TableCell>
                    <TableCell>Processing is necessary to fulfill our service agreement</TableCell>
                    <TableCell>Therapy sessions, appointment scheduling, treatment plans</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Legal Obligation</TableCell>
                    <TableCell>Processing is required by law or professional regulation</TableCell>
                    <TableCell>Mandatory reporting, tax/billing records, court orders</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Vital Interest</TableCell>
                    <TableCell>Processing is necessary to protect someone's life or safety</TableCell>
                    <TableCell>Imminent risk of self-harm or harm to others</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Legitimate Interest</TableCell>
                    <TableCell>Processing serves our reasonable business interests without overriding your rights</TableCell>
                    <TableCell>Website analytics, service improvement, security monitoring</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          {/* 5. Data Protection */}
          <SectionCard icon={Shield} title="5. Data Protection & Security" id="data-protection">
            <p>
              We implement comprehensive security measures to protect your personal and clinical data from unauthorized access, alteration, disclosure, or destruction. Data security is a top priority, and we continuously review and improve our security practices.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 p-4 space-y-2">
                <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Technical Safeguards</h4>
                <ul className="space-y-1.5 text-sm">
                  <CheckItem>SSL/TLS encryption for all website data transmission</CheckItem>
                  <CheckItem>Encrypted storage for clinical records and personal data</CheckItem>
                  <CheckItem>Secure, password-protected access to all digital systems</CheckItem>
                  <CheckItem>Regular software updates and security patches</CheckItem>
                  <CheckItem>Automated backup systems for data recovery</CheckItem>
                  <CheckItem>Firewall and intrusion detection systems</CheckItem>
                </ul>
              </div>
              <div className="rounded-2xl border border-border/50 p-4 space-y-2">
                <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Organizational Safeguards</h4>
                <ul className="space-y-1.5 text-sm">
                  <CheckItem>Strict access control — only authorized personnel access data</CheckItem>
                  <CheckItem>Professional confidentiality agreements and ethical obligations</CheckItem>
                  <CheckItem>Regular review of data handling procedures</CheckItem>
                  <CheckItem>Secure disposal of physical documents (shredding)</CheckItem>
                  <CheckItem>Staff training on data protection best practices</CheckItem>
                  <CheckItem>Incident response protocols for potential breaches</CheckItem>
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* 6. Confidentiality */}
          <SectionCard icon={Lock} title="6. Confidentiality of Therapy Sessions" id="confidentiality">
            <p>
              All therapy sessions — whether conducted in-person at our Islamabad office or online — are strictly confidential. This is a cornerstone of our professional ethics and is essential to building trust in the therapeutic relationship.
            </p>
            <p>
              Information shared during therapy will <strong>never</strong> be disclosed to any third party — including family members, employers, or institutions — without your explicit, written, informed consent. This applies to all forms of therapy including individual therapy, CBT, hypnotherapy, and psychological counseling.
            </p>

            <div className="rounded-2xl border border-border/50 p-5 space-y-3 bg-destructive/5">
              <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Exceptions to Confidentiality
              </h4>
              <p className="text-sm">
                In very rare circumstances, confidentiality may need to be broken as required by Pakistani law or professional ethical standards:
              </p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-start gap-2.5"><AlertTriangle className="w-4 h-4 text-destructive mt-1 shrink-0" /><span><strong>Imminent danger:</strong> If there is a credible, immediate risk of harm to yourself or others</span></li>
                <li className="flex items-start gap-2.5"><AlertTriangle className="w-4 h-4 text-destructive mt-1 shrink-0" /><span><strong>Child abuse or neglect:</strong> If there is reasonable suspicion of abuse or neglect of a minor</span></li>
                <li className="flex items-start gap-2.5"><AlertTriangle className="w-4 h-4 text-destructive mt-1 shrink-0" /><span><strong>Court order:</strong> If a valid court order compels disclosure of specific records</span></li>
                <li className="flex items-start gap-2.5"><AlertTriangle className="w-4 h-4 text-destructive mt-1 shrink-0" /><span><strong>Legal obligations:</strong> Where Pakistani law requires mandatory reporting</span></li>
              </ul>
              <p className="text-sm">In any such case, only the minimum necessary information will be disclosed, and you will be informed whenever legally possible.</p>
            </div>

            <div className="rounded-2xl border border-border/50 p-5 space-y-3">
              <h4 className="font-heading font-semibold text-foreground text-sm">Online Session Security</h4>
              <ul className="space-y-1.5 text-sm">
                <CheckItem>All online sessions conducted via encrypted, HIPAA-aligned video platforms</CheckItem>
                <CheckItem>Sessions are never recorded without your explicit written consent</CheckItem>
                <CheckItem>Clients are encouraged to attend from a private, quiet location</CheckItem>
                <CheckItem>No screenshots or screen recordings are permitted during sessions</CheckItem>
                <CheckItem>Session links are single-use and expire after the appointment</CheckItem>
              </ul>
            </div>
          </SectionCard>

          {/* 7. Third-Party Services */}
          <SectionCard icon={Globe} title="7. Third-Party Services & Tools" id="third-party">
            <p>Our website and practice may utilize the following third-party services. Each service has its own privacy policy governing data collection:</p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Service</TableHead>
                    <TableHead className="font-semibold">Purpose</TableHead>
                    <TableHead className="font-semibold">Data Collected</TableHead>
                    <TableHead className="font-semibold">Data Shared?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { service: "Google Analytics", icon: BarChart3, purpose: "Website traffic analysis", data: "Anonymous page views, session duration, device info", shared: "Anonymized only" },
                    { service: "Microsoft Clarity", icon: Eye, purpose: "Heatmaps & session recordings", data: "Click patterns, scroll behavior, device info", shared: "Anonymized only" },
                    { service: "WhatsApp", icon: MessageCircle, purpose: "Client communication", data: "Messages, phone number", shared: "End-to-end encrypted" },
                    { service: "Google Maps", icon: MapPin, purpose: "Location display", data: "IP address (by Google)", shared: "Google's policy applies" },
                    { service: "Vercel", icon: Server, purpose: "Website hosting", data: "Server logs, IP address", shared: "Minimal, anonymized" },
                    { service: "Oladoc", icon: ExternalLink, purpose: "Appointment booking", data: "Name, contact info, appointment details", shared: "Oladoc's policy applies" },
                  ].map((s) => (
                    <TableRow key={s.service}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2"><s.icon className="w-4 h-4 text-primary" />{s.service}</span>
                      </TableCell>
                      <TableCell>{s.purpose}</TableCell>
                      <TableCell className="text-sm">{s.data}</TableCell>
                      <TableCell className="text-sm">{s.shared}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-sm">
              <strong>Important:</strong> We do <strong>not</strong> sell, rent, trade, or share your personal data with any third party for advertising or marketing purposes. Third-party services are used solely for functional and analytical purposes.
            </p>
          </SectionCard>

          {/* 8. Cookies */}
          <SectionCard icon={Cookie} title="8. Cookies & Tracking Technologies" id="cookies">
            <p>
              Our website uses cookies and similar technologies to enhance your browsing experience, analyze usage patterns, and improve our content. Here is a detailed overview of the cookies we use:
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Cookie Type</TableHead>
                    <TableHead className="font-semibold">Purpose</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold">Essential?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Strictly Necessary</TableCell>
                    <TableCell>Core website functionality, security, theme preference</TableCell>
                    <TableCell>Session / 1 year</TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-primary" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Analytics</TableCell>
                    <TableCell>Understanding visitor behavior, page views, traffic sources</TableCell>
                    <TableCell>Up to 2 years</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Optional</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Performance</TableCell>
                    <TableCell>Page load speed monitoring, error tracking</TableCell>
                    <TableCell>Session</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Optional</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Functional</TableCell>
                    <TableCell>Remembering your preferences (language, dark mode, etc.)</TableCell>
                    <TableCell>1 year</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Optional</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-sm">
              You can manage cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. Please note that disabling essential cookies may affect the functionality of our website, including theme preferences and navigation features.
            </p>
          </SectionCard>

          {/* 9. Data Retention */}
          <SectionCard icon={Clock} title="9. Data Retention Policy" id="data-retention">
            <p>We retain your data only for as long as necessary to fulfill the purposes outlined in this policy. Specific retention periods are as follows:</p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Data Type</TableHead>
                    <TableHead className="font-semibold">Retention Period</TableHead>
                    <TableHead className="font-semibold">After Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Clinical/Therapy Records</TableCell>
                    <TableCell>7 years after last session (per professional guidelines)</TableCell>
                    <TableCell>Securely destroyed</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contact Information</TableCell>
                    <TableCell>Until you request deletion or 3 years of inactivity</TableCell>
                    <TableCell>Permanently deleted</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Payment Records</TableCell>
                    <TableCell>5 years (tax/legal requirements)</TableCell>
                    <TableCell>Securely destroyed</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Website Analytics</TableCell>
                    <TableCell>26 months (Google Analytics default)</TableCell>
                    <TableCell>Automatically purged</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Testimonials</TableCell>
                    <TableCell>Until you withdraw consent</TableCell>
                    <TableCell>Removed from website</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Communication Logs</TableCell>
                    <TableCell>2 years from last contact</TableCell>
                    <TableCell>Permanently deleted</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          {/* 10. Your Rights */}
          <SectionCard icon={UserCheck} title="10. Your Rights" id="your-rights">
            <p>As a client or website visitor, you have the following rights regarding your personal data. You may exercise these rights at any time by contacting us:</p>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "Right to Access", desc: "Request a complete copy of all personal data we hold about you, including clinical records where applicable." },
                { title: "Right to Rectification", desc: "Request correction of any inaccurate, incomplete, or outdated personal information in our records." },
                { title: "Right to Erasure", desc: "Request deletion of your personal data, subject to legal retention requirements for clinical records." },
                { title: "Right to Restrict Processing", desc: "Request that we limit how we process your data in certain circumstances while we verify accuracy." },
                { title: "Right to Data Portability", desc: "Receive your personal data in a structured, commonly used format and transfer it to another provider." },
                { title: "Right to Withdraw Consent", desc: "Withdraw any previously given consent at any time. This does not affect lawfulness of prior processing." },
                { title: "Right to Object", desc: "Object to the processing of your data for specific purposes, including direct marketing and profiling." },
                { title: "Right to Complain", desc: "Lodge a complaint with a relevant data protection authority if you believe your rights have been violated." },
              ].map((right) => (
                <div key={right.title} className="rounded-2xl border border-border/50 p-4 space-y-1">
                  <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {right.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{right.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-sm">
              To exercise any of these rights, please contact us via email at <a href="mailto:zilehumaconsultant@gmail.com" className="text-primary hover:underline">zilehumaconsultant@gmail.com</a> or via <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WhatsApp</a>. We will respond to your request within 30 days.
            </p>
          </SectionCard>

          {/* 11. Children's Privacy */}
          <SectionCard icon={Heart} title="11. Children's Privacy" id="children">
            <p>
              We take the privacy of minors very seriously. Our website is not directed at children under the age of 13, and we do not knowingly collect personal information from children without verified parental or guardian consent.
            </p>
            <p>
              For therapy services involving minors (ages 13–17), we require written consent from a parent or legal guardian before commencing treatment. All clinical information about minors is handled with an additional layer of care and confidentiality, in compliance with child protection laws and professional ethical guidelines.
            </p>
            <p>
              If you are a parent or guardian and believe that we may have inadvertently collected information from your child without proper consent, please contact us immediately and we will take prompt steps to delete such information.
            </p>
          </SectionCard>

          {/* 12. International Transfers */}
          <SectionCard icon={Server} title="12. International Data Transfers" id="international">
            <p>
              Our primary operations are based in Islamabad, Pakistan, and your data is primarily stored and processed within Pakistan. However, some of the third-party services we use (such as Google Analytics, Vercel hosting) may process data on servers located outside Pakistan, including in the United States and European Union.
            </p>
            <p>
              Where data is transferred internationally, we ensure that appropriate safeguards are in place, including relying on the service provider's privacy commitments, standard contractual clauses, or other legally recognized transfer mechanisms. We only partner with providers who demonstrate adequate levels of data protection.
            </p>
          </SectionCard>

          {/* 13. Data Breach Protocol */}
          <SectionCard icon={AlertTriangle} title="13. Data Breach Protocol" id="breach">
            <p>
              In the unlikely event of a data breach that may compromise your personal data, we are committed to taking immediate and comprehensive action:
            </p>
            <ul className="space-y-1.5">
              <CheckItem><strong>Detection & Containment:</strong> We will identify and contain the breach as quickly as possible to minimize impact</CheckItem>
              <CheckItem><strong>Assessment:</strong> We will assess the severity and scope of the breach, including what data was affected</CheckItem>
              <CheckItem><strong>Notification:</strong> We will notify affected individuals within 72 hours of becoming aware of the breach</CheckItem>
              <CheckItem><strong>Reporting:</strong> We will report the breach to relevant authorities as required by Pakistani law</CheckItem>
              <CheckItem><strong>Remediation:</strong> We will take corrective actions to prevent future occurrences and strengthen security measures</CheckItem>
              <CheckItem><strong>Documentation:</strong> We will maintain detailed records of the breach and our response for accountability</CheckItem>
            </ul>
          </SectionCard>

          {/* 14. Policy Changes */}
          <SectionCard icon={Bell} title="14. Changes to This Policy" id="changes">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make significant changes:
            </p>
            <ul className="space-y-1.5">
              <CheckItem>The updated policy will be posted on this page with a new "Last Updated" date</CheckItem>
              <CheckItem>For material changes, we may notify active clients via email or WhatsApp</CheckItem>
              <CheckItem>We encourage you to review this page periodically to stay informed about our data practices</CheckItem>
              <CheckItem>Continued use of our website or services after changes constitutes acceptance of the updated policy</CheckItem>
            </ul>
          </SectionCard>

          {/* 15. Contact */}
          <SectionCard icon={Mail} title="15. Contact Us" id="contact">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, your personal data, or our data protection practices, please do not hesitate to contact us:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 p-5 space-y-4">
                <h4 className="font-heading font-semibold text-foreground text-sm">Contact Information</h4>
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: "Email", value: "zilehumaconsultant@gmail.com", href: "mailto:zilehumaconsultant@gmail.com" },
                    { icon: Phone, label: "Phone / WhatsApp", value: "+92 328 1022334", href: "tel:+923281022334" },
                    { icon: MapPin, label: "Location", value: "The Plazzo, Gulberg Greens, Islamabad", href: "https://maps.app.goo.gl/eWJniqQqGSQQ16im9" },
                    { icon: Globe, label: "Website", value: "zilehuma.online", href: "https://zilehuma.online" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-sm text-foreground hover:text-primary transition-colors" target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-foreground">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-5 space-y-4">
                <h4 className="font-heading font-semibold text-foreground text-sm">Connect With Us</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/923281022334" },
                    { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/mindframe_mentality/" },
                    { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/zile-huma-a85724235" },
                    { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/share/1ZofHY43Gq/" },
                    { icon: TikTokIcon, label: "TikTok", href: "https://www.tiktok.com/@zile_humaa" },
                    { icon: ExternalLink, label: "Oladoc", href: "https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <social.icon className="w-4 h-4" />
                      {social.label}
                    </a>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  We aim to respond to all privacy-related inquiries within <strong>48 hours</strong> during business days. For urgent matters, WhatsApp is the fastest channel.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* FAQ */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {[
                  { q: "Is my therapy session information shared with anyone?", a: "Absolutely not. All therapy sessions are strictly confidential. Your information is never shared with family members, employers, institutions, or any third party without your explicit written consent, except in the rare legal exceptions described above." },
                  { q: "Can I request deletion of all my data?", a: "Yes. You have the right to request erasure of your personal data. However, please note that certain clinical records must be retained for a minimum period as required by professional guidelines and Pakistani law. We will delete all non-essential data upon request." },
                  { q: "Do you use my data for advertising?", a: "No, never. We do not sell, rent, or share your personal information for marketing or advertising purposes. Analytics data collected is anonymized and used solely to improve our website experience." },
                  { q: "How secure are online therapy sessions?", a: "We use encrypted, secure video conferencing platforms for all online sessions. Sessions are never recorded without your explicit consent. We recommend attending from a private, quiet space for maximum confidentiality." },
                  { q: "How long do you keep my therapy records?", a: "Clinical therapy records are retained for 7 years after your last session, as recommended by professional guidelines. After this period, they are securely destroyed. You can request details about your records at any time." },
                  { q: "What happens to my testimonial if I want it removed?", a: "If you submitted a testimonial and wish to have it removed, simply contact us via email or WhatsApp and we will remove it from our website promptly, usually within 24-48 hours." },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Closing note */}
          <div className="glass-card p-6 text-center space-y-2">
            <p className="text-muted-foreground text-sm">
              Thank you for trusting Zil-e-Huma Suleman with your mental health journey. Your privacy and trust are the foundation of our therapeutic relationship.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Zil-e-Huma Suleman · Clinical Psychologist · Islamabad, Pakistan · <a href="https://zilehuma.online" className="text-primary hover:underline">zilehuma.online</a>
            </p>
          </div>
        </div>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
};

export default PrivacyPolicy;
