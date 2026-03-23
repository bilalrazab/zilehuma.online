import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/Footer"));

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <nav aria-label="Breadcrumb" className="mb-6 not-prose">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Privacy Policy</li>
            </ol>
          </nav>

          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 23, 2026</p>

          <h2>Introduction</h2>
          <p>
            Zil-e-Huma Suleman ("we", "our", or "us") operates the website{" "}
            <a href="https://zilehuma.online">zilehuma.online</a>. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website or use our services.
          </p>

          <h2>Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Contact Information:</strong> Name, email address, phone number when you reach out via contact form, WhatsApp, or email.</li>
            <li><strong>Session Information:</strong> Information you share during therapy sessions, which is kept strictly confidential.</li>
            <li><strong>Website Usage Data:</strong> Anonymous browsing data including pages visited, time spent, and device information through analytics tools.</li>
            <li><strong>Testimonials:</strong> Name, role, and feedback you voluntarily submit.</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and improve our psychological services</li>
            <li>To respond to your inquiries and schedule appointments</li>
            <li>To improve our website and user experience</li>
            <li>To display testimonials with your consent</li>
          </ul>

          <h2>Data Protection</h2>
          <p>
            We are committed to protecting your personal data. All therapy session information is kept strictly confidential in accordance with the professional ethics and privacy standards of clinical psychology in Pakistan. We use secure methods to store and transmit data.
          </p>

          <h2>Confidentiality of Therapy Sessions</h2>
          <p>
            All therapy sessions — whether in-person or online — are strictly confidential. Information shared during sessions will not be disclosed to any third party without your explicit written consent, except where required by law or where there is an immediate risk of harm.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our website may use third-party services such as Google Analytics and Microsoft Clarity for understanding visitor behavior. These services may collect anonymous usage data. We do not sell or share your personal information with third parties for marketing purposes.
          </p>

          <h2>Cookies</h2>
          <p>
            Our website may use cookies to improve your browsing experience. You can control cookie preferences through your browser settings.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Request access to your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Withdraw consent for data processing</li>
            <li>Request details about how your data is used</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:zilehumaconsultant@gmail.com">zilehumaconsultant@gmail.com</a> or via{" "}
            <a href="https://wa.me/923281022334" target="_blank" rel="noopener noreferrer">WhatsApp</a>.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
          </p>
        </article>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
};

export default PrivacyPolicy;
