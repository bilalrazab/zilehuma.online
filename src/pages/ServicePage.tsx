import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/Footer"));

const serviceData: Record<string, {
  title: string;
  subtitle: string;
  description: string[];
  benefits: string[];
  whoIsItFor: string[];
  relatedServices: { slug: string; title: string }[];
}> = {
  "individual-therapy": {
    title: "Individual Therapy",
    subtitle: "Personalized one-on-one therapy sessions tailored to your unique healing journey.",
    description: [
      "Embark on a personalized healing journey with Individual Therapy at Zil-e-Huma Suleman's practice. These one-on-one sessions are meticulously tailored to your unique needs, fostering deep self-understanding and personal growth.",
      "As a Clinical Psychologist in Islamabad, Zil-e-Huma provides a confidential space to explore emotional challenges, develop effective coping strategies, and cultivate resilience for lasting mental well-being. Each session is designed to honor your pace and your story.",
    ],
    benefits: [
      "Safe, confidential space for self-exploration",
      "Personalized treatment plans for your goals",
      "Evidence-based coping strategies",
      "Improved self-awareness and emotional regulation",
      "Support for anxiety, depression, trauma & more",
    ],
    whoIsItFor: [
      "Adults experiencing emotional distress",
      "Individuals navigating life transitions",
      "Those seeking personal growth and self-improvement",
      "Anyone wanting a safe space to talk",
    ],
    relatedServices: [
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy" },
      { slug: "online-counseling", title: "Online Counseling" },
    ],
  },
  "anxiety-stress-management": {
    title: "Anxiety & Stress Management",
    subtitle: "Navigate life's pressures with specialized evidence-based support.",
    description: [
      "Navigate life's pressures with specialized Anxiety & Stress Management support from Zil-e-Huma Suleman, an experienced Clinical Psychologist in Islamabad.",
      "Utilizing evidence-based techniques from Cognitive Behavioral Therapy (CBT) and mindfulness, you'll be equipped with practical tools to identify stress triggers, reframe negative thought patterns, and develop healthy coping mechanisms to reduce overwhelming emotions and enhance daily functioning.",
    ],
    benefits: [
      "Learn to identify and manage anxiety triggers",
      "Practical CBT-based coping techniques",
      "Mindfulness and relaxation strategies",
      "Reduced physical symptoms of stress",
      "Improved daily functioning and quality of life",
    ],
    whoIsItFor: [
      "People experiencing chronic anxiety or panic attacks",
      "Professionals dealing with workplace stress",
      "Students facing academic pressure",
      "Anyone feeling overwhelmed by daily life",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "hypnotherapy-sessions", title: "Hypnotherapy Sessions" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy" },
    ],
  },
  "hypnotherapy-sessions": {
    title: "Hypnotherapy Sessions",
    subtitle: "Discover profound inner healing and behavioral transformation.",
    description: [
      "Discover profound inner healing and behavioral transformation through Hypnotherapy Sessions. Under the expert guidance of Zil-e-Huma Suleman, a certified Clinical Psychologist specializing in this modality, you will enter a state of deep relaxation.",
      "This allows for direct access to the subconscious mind, facilitating lasting changes in habits, overcoming specific phobias, managing pain, and unlocking your innate potential for well-being. Hypnotherapy is a safe, evidence-based therapeutic approach when administered by a trained professional.",
    ],
    benefits: [
      "Deep relaxation and stress relief",
      "Overcome phobias and deep-rooted fears",
      "Break unwanted habits and patterns",
      "Pain management support",
      "Access subconscious resources for healing",
    ],
    whoIsItFor: [
      "Individuals struggling with phobias or irrational fears",
      "Those wanting to break habits like smoking or nail-biting",
      "People seeking deeper therapeutic breakthroughs",
      "Anyone curious about alternative evidence-based therapies",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "psychological-assessments", title: "Psychological Assessments" },
    ],
  },
  "behavioral-therapy": {
    title: "Behavioral Therapy",
    subtitle: "Reshape thought patterns and cultivate healthier habits with structured CBT.",
    description: [
      "Reshape thought patterns and cultivate healthier habits with targeted Behavioral Therapy. Drawing primarily from Cognitive Behavioral Therapy (CBT) principles, Zil-e-Huma Suleman helps you identify and modify maladaptive behaviors.",
      "This structured, evidence-based approach empowers you to develop new coping skills, improve interpersonal relationships, and achieve your therapeutic goals for a more fulfilling life. CBT is one of the most researched and effective forms of psychotherapy available.",
    ],
    benefits: [
      "Identify and change negative thought patterns",
      "Develop healthier behavioral responses",
      "Improve relationships and communication",
      "Structured, goal-oriented treatment",
      "Long-lasting skills you can use independently",
    ],
    whoIsItFor: [
      "Individuals with depression or mood disorders",
      "People experiencing relationship difficulties",
      "Those with OCD or compulsive behaviors",
      "Anyone wanting structured, practical therapy",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "anxiety-stress-management", title: "Anxiety & Stress Management" },
      { slug: "online-counseling", title: "Online Counseling" },
    ],
  },
  "psychological-assessments": {
    title: "Psychological Assessments",
    subtitle: "Gain deeper insights into your mental landscape with comprehensive evaluations.",
    description: [
      "Gain deeper insights into your mental landscape with comprehensive Psychological Assessments. As a Clinical Psychologist, Zil-e-Huma Suleman employs standardized, evidence-based tools to provide accurate diagnostic clarity.",
      "These assessments evaluate cognitive functioning, personality traits, and emotional well-being. The results inform highly personalized treatment plans, ensuring a precise and effective approach to your mental health care journey.",
    ],
    benefits: [
      "Accurate diagnostic clarity",
      "Comprehensive cognitive and emotional evaluation",
      "Personalized treatment recommendations",
      "Understanding strengths and areas for growth",
      "Evidence-based standardized tools",
    ],
    whoIsItFor: [
      "Individuals seeking clarity on mental health concerns",
      "Those referred for diagnostic evaluation",
      "People wanting a thorough psychological profile",
      "Families seeking assessment for a loved one",
    ],
    relatedServices: [
      { slug: "individual-therapy", title: "Individual Therapy" },
      { slug: "behavioral-therapy", title: "Behavioral Therapy" },
      { slug: "hypnotherapy-sessions", title: "Hypnotherapy Sessions" },
    ],
  },
  "online-counseling": {
    title: "Online Counseling",
    subtitle: "Access compassionate professional support from anywhere in Pakistan.",
    description: [
      "Access compassionate and professional mental health support from anywhere in Pakistan with Online Counseling. Zil-e-Huma Suleman offers secure and convenient virtual sessions via video call.",
      "This telehealth option ensures continuity of care, reduces geographical barriers, and provides the same high-quality, client-centered mental healthcare as in-person sessions, all within a confidential online environment. Perfect for busy professionals, students, or anyone preferring the comfort of home.",
    ],
    benefits: [
      "Convenience from anywhere in Pakistan or abroad",
      "Same quality as in-person sessions",
      "Secure and confidential video sessions",
      "Flexible scheduling options",
      "No commute or geographical limitations",
    ],
    whoIsItFor: [
      "People living outside Islamabad",
      "Busy professionals with limited time",
      "Individuals preferring home-based therapy",
      "Pakistanis living abroad seeking Urdu/English therapy",
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
  const service = slug ? serviceData[slug] : undefined;

  if (!service) return <Navigate to="/" replace />;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link to="/#services" className="hover:text-foreground transition-colors">Services</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">{service.title}</li>
            </ol>
          </nav>

          <Link to="/#services" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">{service.title}</h1>
          <p className="text-lg text-muted-foreground mb-8 font-body leading-relaxed">{service.subtitle}</p>

          {service.description.map((p, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed text-base mb-4 font-body">{p}</p>
          ))}

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
              <Button size="lg" asChild>
                <Link to="/#booking"><CalendarDays className="w-4 h-4" /> Book Online Session</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              </Button>
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
                >
                  <h3 className="font-heading font-semibold text-foreground text-sm">{rs.title}</h3>
                  <span className="text-xs text-primary mt-1 inline-block">Learn more →</span>
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
