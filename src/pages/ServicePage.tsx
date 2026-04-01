import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { lazy, Suspense, useEffect } from "react";
import SEO from "@/components/SEO";

const Footer = lazy(() => import("@/components/Footer"));

const THERAPY_ROOM_IMAGE_URL = "/images/about-therapy-room.jpg";
const ONLINE_COUNSELING_IMAGE_URL = "/images/online-counseling-session.jpg";
const MENTAL_WELLNESS_IMAGE_URL = "/images/services-mental-wellness.jpg";

const serviceImages: Record<string, { url: string; alt: string }> = {
  "individual-therapy": { url: THERAPY_ROOM_IMAGE_URL, alt: "Individual therapy session room for personalized mental health treatment in Islamabad" },
  "anxiety-stress-management": { url: MENTAL_WELLNESS_IMAGE_URL, alt: "Anxiety and stress management techniques with a Clinical Psychologist in Islamabad" },
  "hypnotherapy-sessions": { url: MENTAL_WELLNESS_IMAGE_URL, alt: "Hypnotherapy session for deep relaxation and behavioral change" },
  "behavioral-therapy": { url: THERAPY_ROOM_IMAGE_URL, alt: "Cognitive Behavioral Therapy CBT sessions in Islamabad Pakistan" },
  "psychological-assessments": { url: MENTAL_WELLNESS_IMAGE_URL, alt: "Comprehensive psychological assessment and diagnostic evaluation" },
  "online-counseling": { url: ONLINE_COUNSELING_IMAGE_URL, alt: "Online counseling and teletherapy video session from home in Pakistan" },
};

const serviceData: Record<string, {
  title: string;
  subtitle: string;
  description: string[];
  benefits: string[];
  whoIsItFor: string[];
  approach: string[];
  relatedServices: { slug: string; title: string }[];
}> = {
  "individual-therapy": {
    title: "Individual Therapy in Islamabad",
    subtitle: "Personalized one-on-one therapy sessions tailored to your unique healing journey with a qualified Clinical Psychologist.",
    description: [
      "Individual therapy is the cornerstone of effective mental health treatment. At Zil-e-Huma Suleman's practice in Islamabad, these confidential one-on-one sessions provide a safe, non-judgmental space to explore your thoughts, emotions, and behaviors.",
      "Whether you're struggling with anxiety, depression, grief, relationship challenges, self-esteem issues, or navigating a major life transition, individual therapy offers the personalized support you need. Each session is carefully designed around your specific goals and concerns.",
      "As an experienced Clinical Psychologist, Zil-e-Huma integrates multiple evidence-based approaches — including Cognitive Behavioral Therapy (CBT), person-centered therapy, and psychodynamic techniques — to create a treatment plan that resonates with your unique situation.",
    ],
    approach: [
      "Initial assessment to understand your history, concerns, and goals",
      "Collaborative treatment planning tailored to your needs",
      "Regular 45–60 minute sessions with progress tracking",
      "Integration of CBT, mindfulness, and other evidence-based methods",
      "Ongoing adjustment of techniques based on your progress",
    ],
    benefits: [
      "Safe, confidential space for deep self-exploration",
      "Personalized treatment plans aligned with your goals",
      "Evidence-based coping strategies for daily challenges",
      "Improved self-awareness and emotional regulation",
      "Support for anxiety, depression, trauma, grief & more",
      "Skills that last beyond the therapy room",
    ],
    whoIsItFor: [
      "Adults experiencing emotional distress or mental health symptoms",
      "Individuals navigating life transitions (career, relationships, loss)",
      "Those seeking personal growth, self-improvement, and clarity",
      "Anyone wanting a safe, professional space to process emotions",
      "People dealing with low self-esteem or identity concerns",
    ],
    relatedServices: [
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy (CBT)" },
      { slug: "online-counseling", title: "Online Counseling" },
    ],
  },
  "anxiety-stress-management": {
    title: "Anxiety & Stress Management in Islamabad",
    subtitle: "Overcome anxiety, panic attacks, and chronic stress with proven evidence-based techniques.",
    description: [
      "Anxiety disorders are among the most common mental health conditions in Pakistan, yet they remain widely misunderstood. At Zil-e-Huma's practice, anxiety and stress management goes beyond simple relaxation — it's about understanding the root causes of your anxiety and building lasting resilience.",
      "Using Cognitive Behavioral Therapy (CBT), exposure techniques, and mindfulness-based strategies, you'll learn to identify your specific anxiety triggers, challenge catastrophic thinking patterns, and develop practical tools to manage stress before it becomes overwhelming.",
      "Whether you experience generalized anxiety, social anxiety, panic attacks, workplace burnout, or academic pressure, specialized treatment helps you regain control and live more freely.",
    ],
    approach: [
      "Thorough anxiety assessment and trigger identification",
      "CBT-based cognitive restructuring of anxious thoughts",
      "Graded exposure therapy for specific phobias and avoidance",
      "Breathing techniques, progressive muscle relaxation, and mindfulness",
      "Stress inoculation training for real-world resilience",
    ],
    benefits: [
      "Identify and manage specific anxiety triggers effectively",
      "Practical CBT-based coping techniques you can use daily",
      "Mindfulness and grounding strategies for panic episodes",
      "Reduced physical symptoms (tension, insomnia, fatigue)",
      "Improved daily functioning, productivity, and quality of life",
      "Long-term resilience against future stressors",
    ],
    whoIsItFor: [
      "People experiencing chronic anxiety, worry, or panic attacks",
      "Professionals dealing with workplace stress and burnout",
      "Students facing academic pressure and exam anxiety",
      "Individuals with social anxiety affecting relationships",
      "Anyone feeling overwhelmed, restless, or constantly on edge",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "hypnotherapy-sessions", title: "Hypnotherapy Sessions" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy (CBT)" },
    ],
  },
  "hypnotherapy-sessions": {
    title: "Clinical Hypnotherapy Sessions in Islamabad",
    subtitle: "Evidence-based hypnotherapy for deep healing, habit change, and emotional transformation.",
    description: [
      "Clinical hypnotherapy is a scientifically validated therapeutic technique that accesses the subconscious mind to facilitate profound behavioral and emotional change. Under the expert guidance of Zil-e-Huma Suleman, you'll experience deep relaxation while remaining fully in control.",
      "Unlike popular misconceptions, clinical hypnotherapy is not about losing control — it's about gaining it. In this focused, relaxed state, your mind becomes more receptive to positive suggestions, making it easier to overcome phobias, break unwanted habits, manage chronic pain, and resolve deep-seated emotional patterns.",
      "Hypnotherapy is particularly effective when combined with traditional therapeutic approaches like CBT, creating a comprehensive treatment plan that addresses both conscious and subconscious aspects of your challenges.",
    ],
    approach: [
      "Pre-session consultation to establish goals and address concerns",
      "Progressive relaxation induction tailored to your comfort level",
      "Targeted therapeutic suggestions for your specific challenges",
      "Post-hypnotic strategies for maintaining positive changes",
      "Integration with CBT and other therapeutic methods",
    ],
    benefits: [
      "Deep relaxation and significant stress relief",
      "Overcome phobias, fears, and deep-rooted anxieties",
      "Break unwanted habits (smoking, nail-biting, emotional eating)",
      "Support for chronic pain management",
      "Access subconscious resources for emotional healing",
      "Accelerate progress in ongoing therapy",
    ],
    whoIsItFor: [
      "Individuals struggling with phobias or irrational fears",
      "Those wanting to break persistent habits or addictions",
      "People seeking deeper therapeutic breakthroughs",
      "Individuals with chronic pain seeking complementary support",
      "Anyone curious about evidence-based alternative therapies",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "psychological-assessments", title: "Psychological Assessments" },
    ],
  },
  "behavioral-therapy": {
    title: "Cognitive Behavioral Therapy (CBT) in Islamabad",
    subtitle: "Reshape negative thought patterns and build healthier behaviors with structured, goal-oriented CBT.",
    description: [
      "Cognitive Behavioral Therapy (CBT) is one of the most extensively researched and effective forms of psychotherapy worldwide. At Zil-e-Huma's practice, CBT is used to help you understand the connection between your thoughts, feelings, and behaviors — and how changing one can transform the others.",
      "CBT is a practical, structured approach that focuses on current problems rather than past events. You'll learn to identify automatic negative thoughts, test them against reality, and replace them with more balanced, helpful perspectives. This isn't about 'positive thinking' — it's about accurate thinking.",
      "Research consistently shows CBT is highly effective for depression, anxiety disorders, OCD, PTSD, eating disorders, insomnia, anger management, and relationship difficulties. The skills you learn in CBT stay with you long after therapy ends.",
    ],
    approach: [
      "Collaborative case formulation linking thoughts, feelings, and behaviors",
      "Identification of cognitive distortions and automatic negative thoughts",
      "Behavioral experiments to test and challenge unhelpful beliefs",
      "Homework assignments to practice skills between sessions",
      "Relapse prevention planning for long-term success",
    ],
    benefits: [
      "Identify and change negative thought patterns and cognitive distortions",
      "Develop healthier behavioral responses to difficult situations",
      "Improve interpersonal relationships and communication skills",
      "Structured, goal-oriented treatment with measurable progress",
      "Long-lasting skills for independent emotional management",
      "Evidence-based approach with strong scientific backing",
    ],
    whoIsItFor: [
      "Individuals with depression or persistent low mood",
      "People experiencing relationship difficulties or communication problems",
      "Those with OCD, compulsive behaviors, or intrusive thoughts",
      "Individuals with PTSD or trauma-related difficulties",
      "Anyone wanting practical, structured, and goal-oriented therapy",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "online-counseling", title: "Online Counseling" },
    ],
  },
  "psychological-assessments": {
    title: "Psychological Assessments in Islamabad",
    subtitle: "Comprehensive psychological evaluations for accurate diagnosis and personalized treatment planning.",
    description: [
      "A thorough psychological assessment is the foundation of effective mental health treatment. Using standardized, internationally recognized tools, Zil-e-Huma provides comprehensive evaluations that offer clear diagnostic insights into your cognitive functioning, personality traits, and emotional well-being.",
      "Psychological assessments go beyond a simple conversation — they use validated questionnaires, structured interviews, and clinical observation to build a complete picture of your mental health. This precision ensures that any subsequent treatment is accurately targeted to your specific needs.",
      "Assessment results are explained in clear, jargon-free language, empowering you to understand your strengths, challenges, and the most effective path forward. Whether you need clarity on a specific concern or a comprehensive psychological profile, professional assessment provides the answers.",
    ],
    approach: [
      "Initial clinical interview to understand presenting concerns",
      "Administration of standardized psychometric instruments",
      "Cognitive and personality assessment where indicated",
      "Comprehensive report with clear, understandable findings",
      "Personalized treatment recommendations based on results",
    ],
    benefits: [
      "Accurate diagnostic clarity using validated instruments",
      "Comprehensive evaluation of cognitive and emotional functioning",
      "Personalized, evidence-based treatment recommendations",
      "Understanding of personal strengths and growth areas",
      "Clear, jargon-free explanation of assessment results",
      "Foundation for effective, targeted treatment planning",
    ],
    whoIsItFor: [
      "Individuals seeking clarity on mental health concerns or symptoms",
      "Those referred by other professionals for diagnostic evaluation",
      "People wanting a thorough psychological profile for self-understanding",
      "Families seeking assessment and guidance for a loved one",
      "Professionals needing psychological evaluation for career purposes",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy (CBT)" },
      { slug: "hypnotherapy-sessions", title: "Hypnotherapy Sessions" },
    ],
  },
  "online-counseling": {
    title: "Online Counseling & Teletherapy in Pakistan",
    subtitle: "Professional mental health support from anywhere — secure, convenient, and just as effective as in-person therapy.",
    description: [
      "Online counseling removes geographical barriers to quality mental healthcare. Whether you're in Lahore, Karachi, Peshawar, or living abroad, you can access the same professional, evidence-based therapy from Zil-e-Huma Suleman through secure video sessions.",
      "Research consistently shows that online therapy is equally effective as face-to-face sessions for most mental health conditions, including anxiety, depression, stress, and relationship issues. Sessions are conducted on secure, encrypted platforms that protect your privacy completely.",
      "Online counseling is ideal for busy professionals, students, parents, or anyone who prefers the comfort and privacy of their own space. Sessions are available in both Urdu and English, ensuring comfortable communication for all clients across Pakistan and the diaspora.",
    ],
    approach: [
      "Simple booking via email or WhatsApp for flexible scheduling",
      "Secure, encrypted video platform for complete privacy",
      "Same structured, evidence-based approach as in-person sessions",
      "Available in both Urdu and English languages",
      "Flexible timing to accommodate different time zones",
    ],
    benefits: [
      "Access quality therapy from anywhere in Pakistan or abroad",
      "Same clinical quality and effectiveness as in-person sessions",
      "Secure, encrypted, and fully confidential video sessions",
      "Flexible scheduling including evenings and weekends",
      "No commute, travel costs, or geographical limitations",
      "Comfortable and private — attend from your own space",
    ],
    whoIsItFor: [
      "People living outside Islamabad who need quality therapy",
      "Busy professionals with demanding schedules",
      "Students facing academic or personal challenges",
      "Parents who can't easily leave home for appointments",
      "Pakistanis living abroad seeking Urdu/English therapy",
      "Anyone preferring the privacy and comfort of home-based sessions",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "psychological-assessments", title: "Psychological Assessments" },
    ],
  },
};

const ServicePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);
  const service = slug ? serviceData[slug] : undefined;
  const image = slug ? serviceImages[slug] : undefined;

  if (!service) return <Navigate to="/" replace />;

  const handleBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 400);
  };

  return (
    <>
      <SEO
        title={service.title}
        description={service.subtitle}
        canonical={`https://zilehuma.online/services/${slug}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": service.title,
          "description": service.subtitle,
          "provider": { "@type": "Person", "name": "Zil-e-Huma Suleman" },
          "areaServed": "Pakistan",
          "url": `https://zilehuma.online/services/${slug}`,
        }}
      />
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li>/</li>
              <li><button onClick={(e) => { e.preventDefault(); navigate("/"); setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }), 400); }} className="hover:text-foreground transition-colors">Services</button></li>
              <li>/</li>
              <li className="text-foreground font-medium">{service.title}</li>
            </ol>
          </nav>

          <Link to="/" onClick={(e) => { e.preventDefault(); navigate("/"); setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }), 400); }} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">{service.title}</h1>
          <p className="text-lg text-muted-foreground mb-8 font-body leading-relaxed">{service.subtitle}</p>

          {/* Hero image */}
          {image && (
            <img
              src={image.url}
              alt={image.alt}
              width={1280}
              height={720}
              loading="lazy"
              className="w-full rounded-2xl mb-8 object-cover aspect-video"
            />
          )}

          {service.description.map((p, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed text-base mb-4 font-body">{p}</p>
          ))}

          {/* Therapeutic Approach */}
          <div className="glass-card p-6 sm:p-8 my-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Our Therapeutic Approach</h2>
            <ol className="space-y-3">
              {service.approach.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="text-foreground/90 font-body">{a}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Benefits */}
          <div className="glass-card p-6 sm:p-8 my-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Key Benefits</h2>
            <ul className="space-y-3">
              {service.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-body">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who is it for */}
          <div className="glass-card p-6 sm:p-8 my-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Who Is This For?</h2>
            <ul className="space-y-3">
              {service.whoIsItFor.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-body">{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="glass-card p-6 sm:p-8 my-8 text-center">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">Ready to Begin Your Healing Journey?</h2>
            <p className="text-muted-foreground mb-5 font-body">Book a session with Zil-e-Huma Suleman today.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleBookingClick}>
                <CalendarDays className="w-4 h-4" /> Book Online Session
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Internal links to other sections */}
          <div className="glass-card p-6 sm:p-8 my-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-3">Explore More</h2>
            <p className="text-muted-foreground text-sm mb-4 font-body">
              Learn more about our practice and read insights on mental health:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="text-sm text-primary hover:underline">About Zil-e-Huma →</Link>
              <Link to="/blog" className="text-sm text-primary hover:underline">Read Our Blog →</Link>
              <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Contact via WhatsApp →</a>
            </div>
          </div>

          {/* Related Services (Internal Links) */}
          <div className="my-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Related Services</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {service.relatedServices.map((rs) => (
                <Link
                  key={rs.slug}
                  to={`/services/${rs.slug}`}
                  className="glass-card p-4 hover:border-primary/30 transition-colors text-center"
                  aria-label={`Learn more about ${rs.title}`}
                >
                  <h3 className="font-heading font-semibold text-foreground text-sm">{rs.title}</h3>
                  <span className="text-xs text-primary mt-1 inline-block">Explore this service →</span>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
};

export default ServicePage;
