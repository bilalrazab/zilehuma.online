import { lazy } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ScrollProgress from "@/components/ScrollProgress";
import SEO from "@/components/SEO";
import LazyVisible from "@/components/LazyVisible";

const AboutSection = lazy(() => import("@/components/AboutSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const ExperienceSection = lazy(() => import("@/components/ExperienceSection"));
const BlogSection = lazy(() => import("@/components/BlogSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const BookingSection = lazy(() => import("@/components/BookingSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  return (
    <>
      <SEO
        title="Clinical Psychologist Islamabad & Online Therapy Pakistan"
        description="Zil-e-Huma Suleman is a certified Clinical Psychologist in Islamabad offering therapy for anxiety, depression, trauma, and hypnotherapy sessions online across Pakistan."
        canonical="https://zilehuma.online/"
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Zil-e-Huma Suleman",
          "jobTitle": "Clinical Psychologist",
          "url": "https://zilehuma.online",
          "image": "https://zilehuma.online/og-image.png",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "The Plazzo, Gulberg Greens",
            "addressLocality": "Islamabad",
            "addressRegion": "Islamabad Capital Territory",
            "addressCountry": "PK"
          },
          "knowsAbout": ["Clinical Psychology", "Hypnotherapy", "Online Therapy", "Mental Health", "Anxiety", "Depression", "Trauma Therapy"]
        }}
      />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <LazyVisible>
          <AboutSection />
        </LazyVisible>
        <LazyVisible>
          <ServicesSection />
        </LazyVisible>
        <LazyVisible>
          <ExperienceSection />
        </LazyVisible>
        <LazyVisible>
          <BlogSection />
        </LazyVisible>
        <LazyVisible>
          <TestimonialsSection />
        </LazyVisible>
        <LazyVisible>
          <FAQSection />
        </LazyVisible>
        <LazyVisible>
          <BookingSection />
        </LazyVisible>
        <LazyVisible>
          <ContactSection />
        </LazyVisible>
      </main>
      <LazyVisible>
        <Footer />
      </LazyVisible>
    </>
  );
};

export default Index;
