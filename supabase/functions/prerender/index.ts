import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://zilehuma.online";

/* ─── Bot detection ─── */
const BOT_AGENTS = [
  "googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider",
  "slurp", "sogou", "exabot", "facebot", "facebookexternalhit",
  "ia_archiver", "linkedinbot", "twitterbot", "whatsapp", "telegrambot",
  "pinterestbot", "redditbot", "discordbot", "slackbot",
  "gptbot", "chatgpt-user", "claudebot", "perplexitybot",
  "applebot", "cohere-ai", "google-extended", "amazonbot",
  "anthropic-ai", "bytespider", "semrushbot", "ahrefsbot",
  "mj12bot", "dotbot", "petalbot", "rogerbot",
  "screaming frog", "sitebulb", "deepcrawl",
  "prerender", "headlesschrome",
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_AGENTS.some((b) => lower.includes(b));
}

/* ─── Supabase ─── */
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/* ─── Shared HTML pieces ─── */
const HEAD_META = `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="Zil-e-Huma Suleman">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/">
<link rel="alternate" type="text/plain" href="${SITE}/llms.txt" title="LLM-readable summary">
<link rel="alternate" type="text/plain" href="${SITE}/llms-full.txt" title="LLM-readable full content">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.png">
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  body { font-family: 'DM Sans', sans-serif; color: #1a1a2e; max-width: 960px; margin: 0 auto; padding: 20px; line-height: 1.7; }
  h1, h2, h3 { font-family: 'Playfair Display', serif; }
  h1 { font-size: 2.2rem; color: #5a9a7a; }
  h2 { font-size: 1.6rem; color: #1a1a2e; border-bottom: 2px solid #e8e0d4; padding-bottom: 8px; margin-top: 2rem; }
  a { color: #5a9a7a; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
  .service-card { border: 1px solid #e8e0d4; border-radius: 12px; padding: 20px; }
  .service-card h3 { color: #5a9a7a; margin-top: 0; }
  .faq details { border-bottom: 1px solid #e8e0d4; padding: 12px 0; }
  .faq summary { cursor: pointer; font-weight: 600; font-size: 1rem; }
  .blog-card { border: 1px solid #e8e0d4; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #e8e0d4; padding: 10px; text-align: left; }
  th { background: #f5f8f5; }
  .experience-item { border-left: 3px solid #5a9a7a; padding-left: 16px; margin-bottom: 20px; }
  .testimonial { background: #f5f8f5; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  nav { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 0; border-bottom: 1px solid #e8e0d4; margin-bottom: 24px; }
  nav a { font-weight: 500; }
  footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8e0d4; color: #6b7280; font-size: 0.875rem; }
</style>
`;

const JSONLD_PSYCHOLOGIST = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Psychologist",
  name: "Zil-e-Huma Suleman",
  description: "Zil-e-Huma Suleman is a Clinical Psychologist based in Islamabad, Pakistan, specializing in creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.",
  url: SITE,
  telephone: "+923281022334",
  email: "zilehumaconsultant@gmail.com",
  image: `${SITE}/og-image.png`,
  priceRange: "$$",
  address: { "@type": "PostalAddress", streetAddress: "The Plazzo, Gulberg Greens", addressLocality: "Islamabad", addressRegion: "Islamabad Capital Territory", addressCountry: "PK" },
  geo: { "@type": "GeoCoordinates", latitude: 33.6844, longitude: 73.0479 },
  areaServed: { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: 33.6844, longitude: 73.0479 }, geoRadius: "50000" },
  hasOfferCatalog: {
    "@type": "OfferCatalog", name: "Psychology Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Individual Therapy", url: `${SITE}/services/individual-therapy` } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Anxiety & Stress Management", url: `${SITE}/services/anxiety-stress-management` } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hypnotherapy Sessions", url: `${SITE}/services/hypnotherapy-sessions` } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Behavioral Therapy", url: `${SITE}/services/behavioral-therapy` } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Psychological Assessments", url: `${SITE}/services/psychological-assessments` } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Online Counseling", url: `${SITE}/services/online-counseling` } },
    ],
  },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "4" },
  sameAs: [
    "https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455",
    "https://www.instagram.com/mindframe_mentality/",
    "https://www.tiktok.com/@zile_humaa",
    "https://www.linkedin.com/in/Zilehuma-Suleman",
    "https://www.facebook.com/share/1ZofHY43Gq/",
  ],
});

const SERVICES = [
  { title: "Individual Therapy", slug: "individual-therapy", desc: "Personalized one-on-one therapy sessions tailored to your unique needs, fostering deep self-understanding and personal growth with a Clinical Psychologist in Islamabad.", cta: "Start your healing journey" },
  { title: "Anxiety & Stress Management", slug: "anxiety-stress-management", desc: "Evidence-based techniques from CBT and mindfulness to manage anxiety, reduce stress, and build healthy coping mechanisms.", cta: "Take control of your anxiety" },
  { title: "Hypnotherapy Sessions", slug: "hypnotherapy-sessions", desc: "Guided hypnotherapy for deep relaxation, behavioral change, overcoming phobias, and unlocking your innate potential for well-being.", cta: "Explore hypnotherapy" },
  { title: "Behavioral Therapy (CBT)", slug: "behavioral-therapy", desc: "Structured CBT approaches to reshape thought patterns, modify maladaptive behaviors, and build healthier habits for a more fulfilling life.", cta: "Reshape your thinking" },
  { title: "Psychological Assessments", slug: "psychological-assessments", desc: "Comprehensive psychological evaluations using standardized, evidence-based tools for accurate diagnostic clarity and personalized treatment planning.", cta: "Get diagnostic clarity" },
  { title: "Online Counseling", slug: "online-counseling", desc: "Secure, convenient virtual therapy sessions accessible from anywhere in Pakistan, providing the same high-quality care as in-person sessions.", cta: "Book a virtual session" },
];

const FAQS = [
  { q: "Who is Zil-e-Huma Suleman?", a: "Zil-e-Huma Suleman is a qualified Clinical Psychologist based in Islamabad, Pakistan. She specializes in creating safe, compassionate spaces for healing using evidence-based therapy and genuine human connection." },
  { q: "What services does Zil-e-Huma Suleman offer?", a: "She offers evidence-based therapy, Cognitive Behavioral Therapy (CBT), hypnotherapy, and professional counseling. Sessions are available both online and in-person in Islamabad." },
  { q: "Does Zil-e-Huma Suleman provide online therapy in Pakistan?", a: "Yes. She offers convenient online counseling sessions that you can attend from anywhere in Pakistan or abroad via video call." },
  { q: "What is CBT therapy and how can it help?", a: "CBT (Cognitive Behavioral Therapy) is a proven, practical approach that helps you identify and change negative thought patterns. It is highly effective for anxiety, depression, stress, and many other mental health challenges." },
  { q: "Is hypnotherapy available with Zil-e-Huma Suleman?", a: "Yes. Hypnotherapy is one of her specialized services and is used to address deep-rooted habits, anxiety, phobias, and certain emotional blocks in a relaxed, focused state." },
  { q: "How do I book an appointment with Zil-e-Huma Suleman?", a: "Simply email zilehumaconsultant@gmail.com or send a message via WhatsApp. She will reply quickly and help you choose an online or in-person slot that suits you." },
  { q: "Where is Zil-e-Huma Suleman's clinic in Islamabad?", a: "Her in-person practice is located at The Plazzo, Gulberg Greens, Islamabad. Exact room details and directions are provided once you book your session." },
  { q: "What are Zil-e-Huma Suleman's qualifications and experience?", a: "She holds an MS in Clinical Psychology and has gained hands-on clinical experience in hospitals, rehabilitation centers, and therapeutic settings." },
  { q: "Are therapy sessions confidential?", a: "Absolutely. All sessions are strictly confidential and follow the highest professional ethics and privacy standards of clinical psychology in Pakistan." },
  { q: "Who can benefit from sessions with a clinical psychologist like Zil-e-Huma?", a: "Anyone struggling with anxiety, depression, stress, trauma, relationship issues, self-esteem, or simply wanting personal growth can benefit. Sessions are suitable for adults and young adults." },
  { q: "How long is a typical therapy session?", a: "Most sessions last 45–60 minutes. The exact duration is discussed and customized when you book." },
  { q: "What should I expect in my first session?", a: "In the first session you will discuss what brings you to therapy in a safe, non-judgmental space. Zil-e-Huma will understand your goals and create a personalized plan. There is no pressure — it's simply a gentle conversation." },
];

const EXPERIENCE = [
  { period: "June 2025 – Jan 2026", role: "Hypnotherapist", org: "Mind Power Artists – Gulberg, Islamabad", desc: "Conducted clinical hypnotherapy sessions for phobias, habit change, emotional blocks, and deep relaxation using guided subconscious techniques." },
  { period: "Sep 2023 – Jan 2025", role: "Clinical Internship", org: "Military Hospital Rawalpindi", desc: "Completed 16-month clinical training in psychiatry and psychology wards — conducted intake assessments, administered psychometric tests, and co-facilitated CBT group sessions." },
  { period: "2023 – 2024", role: "Clinical Psychology Observer", org: "Military Hospital Rawalpindi", desc: "Observed senior psychologists in diagnostic evaluations, neuropsychological testing, and trauma-focused interventions across diverse patient populations." },
  { period: "Mar 2023 – May 2023", role: "Clinical Intern", org: "Aeman Rehabilitation Center", desc: "Worked with individuals recovering from substance use disorders — provided motivational interviewing, psychoeducation, and relapse prevention counseling." },
  { period: "2021 – 2023", role: "Special Education Teacher", org: "Learn-A-Lacious School", desc: "Designed individualized learning plans and behavioral interventions for children with developmental and learning disabilities." },
];

const NAV = `
<nav aria-label="Main navigation">
  <a href="${SITE}/">Home</a>
  <a href="${SITE}/#about">About</a>
  <a href="${SITE}/#services">Services</a>
  <a href="${SITE}/#experience">Experience</a>
  <a href="${SITE}/blog">Blog</a>
  <a href="${SITE}/#faq">FAQ</a>
  <a href="${SITE}/#booking">Book a Session</a>
  <a href="${SITE}/#contact">Contact</a>
</nav>
`;

const FOOTER = `
<footer>
  <p>&copy; ${new Date().getFullYear()} Zil-e-Huma Suleman — Clinical Psychologist, Islamabad, Pakistan</p>
  <p>
    <a href="mailto:zilehumaconsultant@gmail.com">zilehumaconsultant@gmail.com</a> |
    <a href="tel:+923281022334">+92 328 1022334</a> |
    <a href="https://wa.me/923281022334">WhatsApp</a>
  </p>
  <p>
    <a href="https://www.instagram.com/mindframe_mentality/">Instagram</a> |
    <a href="https://www.linkedin.com/in/Zilehuma-Suleman">LinkedIn</a> |
    <a href="https://www.tiktok.com/@zile_humaa">TikTok</a> |
    <a href="https://oladoc.com/pakistan/islamabad/dr/psychologist/zile-huma-suleman/2856455">Oladoc</a>
  </p>
  <p>The Plazzo, Gulberg Greens, Islamabad</p>
  <p><a href="${SITE}/privacy-policy">Privacy Policy</a></p>
</footer>
`;

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/* ─────────────────────── Page renderers ─────────────────────── */

async function renderHomepage(): Promise<string> {
  const sb = getSupabase();

  const [blogRes, testimonialsRes] = await Promise.all([
    sb.from("blog_posts").select("*").order("created_at", { ascending: false }).limit(3),
    sb.from("testimonials").select("*").eq("approved", true).order("created_at", { ascending: false }).limit(5),
  ]);

  const posts = blogRes.data ?? [];
  const testimonials = testimonialsRes.data ?? [];

  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  const servicesJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services Offered by Zil-e-Huma Suleman",
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.desc,
        provider: { "@type": "Person", name: "Zil-e-Huma Suleman" },
        areaServed: "Islamabad, Pakistan",
        url: `${SITE}/services/${s.slug}`,
      },
    })),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${HEAD_META}
  <title>Clinical Psychologist Islamabad | Zil-e-Huma Suleman</title>
  <meta name="description" content="Zil-e-Huma Suleman, a Clinical Psychologist in Islamabad, offers evidence-based therapy for anxiety, stress, and well-being. Find your safe space for healing. Book your session today!">
  <meta property="og:title" content="Clinical Psychologist Islamabad | Zil-e-Huma Suleman">
  <meta property="og:description" content="Zil-e-Huma Suleman, a Clinical Psychologist in Islamabad, offers evidence-based therapy for anxiety, stress, and well-being. Find your safe space for healing. Book your session today!">
  <meta name="twitter:title" content="Clinical Psychologist Islamabad | Zil-e-Huma Suleman">
  <meta name="twitter:description" content="Zil-e-Huma Suleman, a Clinical Psychologist in Islamabad, offers evidence-based therapy for anxiety, stress, and well-being. Find your safe space for healing. Book your session today!">
  <script type="application/ld+json">${JSONLD_PSYCHOLOGIST}</script>
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${servicesJsonLd}</script>
</head>
<body>
  ${NAV}

  <header id="hero">
    <p>Zil-e-Huma Suleman</p>
    <h1>Clinical Psychologist Islamabad — Your Path to Mental Wellness</h1>
    <p>Creating safe spaces for healing through evidence-based therapy, compassion, and genuine human connection.</p>
    <p><a href="${SITE}/#booking">Book Online Session</a> | <a href="${SITE}/#services">View Services</a></p>
  </header>

  <section id="about">
    <h2>About Me</h2>
    <p>Compassionate care rooted in evidence-based practice.</p>
    <p>I'm Zil-e-Huma Suleman, a Clinical Psychologist practicing from The Plazzo, Gulberg Greens, Islamabad. I hold an MS in Clinical Psychology and have gained hands-on experience across hospital, rehabilitation, and therapeutic settings — including Military Hospital Rawalpindi and specialized rehabilitation centers.</p>
    <p>My practice is rooted in evidence-based therapy, including <a href="${SITE}/services/behavioral-therapy">Cognitive Behavioral Therapy (CBT)</a>, <a href="${SITE}/services/hypnotherapy-sessions">hypnotherapy</a>, and client-centered mental healthcare. I believe in creating a space where emotional safety, confidentiality, and ethical practice come first — because healing begins when you feel truly heard.</p>
    <p>Whether you're dealing with anxiety, depression, trauma, or simply seeking personal growth, I offer both <a href="${SITE}/services/individual-therapy">in-person sessions</a> and <a href="${SITE}/services/online-counseling">online counseling</a> to meet you where you are.</p>
    <h3>What Sets This Practice Apart</h3>
    <ul>
      <li>Bilingual sessions in both Urdu and English for comfortable, natural communication</li>
      <li>Rare combination of clinical hypnotherapy and CBT under one practitioner</li>
      <li>Hospital-trained clinical experience (Military Hospital Rawalpindi) — not just theoretical knowledge</li>
      <li>Flexible online and in-person sessions from Gulberg Greens, Islamabad</li>
    </ul>
  </section>

  <section id="services">
    <h2>Services</h2>
    <p>Comprehensive mental health support tailored to you.</p>
    <div class="services-grid">
      ${SERVICES.map((s) => `
        <article class="service-card">
          <h3><a href="${SITE}/services/${s.slug}">${escHtml(s.title)}</a></h3>
          <p>${escHtml(s.desc)}</p>
          <p><a href="${SITE}/services/${s.slug}">${escHtml(s.cta)} →</a></p>
        </article>
      `).join("")}
    </div>
    <h3>Service Comparison</h3>
    <table>
      <thead><tr><th>Service</th><th>Format</th><th>Duration</th><th>Best For</th></tr></thead>
      <tbody>
        <tr><td>Individual Therapy</td><td>In-person / Online</td><td>45–60 min</td><td>Anxiety, Depression, Growth</td></tr>
        <tr><td>Anxiety &amp; Stress Management</td><td>In-person / Online</td><td>45–60 min</td><td>Panic, Stress, Overwhelm</td></tr>
        <tr><td>Hypnotherapy</td><td>In-person</td><td>60 min</td><td>Phobias, Habits, Blocks</td></tr>
        <tr><td>Behavioral Therapy (CBT)</td><td>In-person / Online</td><td>45–60 min</td><td>Thought Patterns, Habits</td></tr>
        <tr><td>Psychological Assessments</td><td>In-person</td><td>60–90 min</td><td>Diagnosis, Treatment Plan</td></tr>
        <tr><td>Online Counseling</td><td>Online only</td><td>45–60 min</td><td>Remote Access, Convenience</td></tr>
      </tbody>
    </table>
  </section>

  <section id="experience">
    <h2>Experience</h2>
    <p>A journey rooted in learning and compassion.</p>
    ${EXPERIENCE.map((e) => `
      <div class="experience-item">
        <strong>${escHtml(e.period)}</strong>
        <h3>${escHtml(e.role)}</h3>
        <p><em>${escHtml(e.org)}</em></p>
        <p>${escHtml(e.desc)}</p>
      </div>
    `).join("")}
  </section>

  <section id="blog">
    <h2>Blog</h2>
    <p>Insights on mental health, therapy, and well-being.</p>
    ${posts.map((p) => `
      <article class="blog-card">
        <h3><a href="${SITE}/blog/${p.id}">${escHtml(p.title)}</a></h3>
        <p><time datetime="${p.created_at}">${formatDate(p.created_at)}</time> · ${p.read_time} min read · ${escHtml(p.tag)}</p>
        <p>${escHtml(p.excerpt)}</p>
        <p><a href="${SITE}/blog/${p.id}">Read more →</a></p>
      </article>
    `).join("")}
    <p><a href="${SITE}/blog">View All Posts →</a></p>
  </section>

  <section id="testimonials">
    <h2>What Clients Say</h2>
    <p>Real experiences from people who found support, clarity, and healing.</p>
    ${testimonials.map((t) => `
      <div class="testimonial">
        <p><strong>${escHtml(t.name)}</strong> — ${escHtml(t.role)}${t.location ? `, ${escHtml(t.location)}` : ""}</p>
        <p>"${escHtml(t.text)}"</p>
        <p>${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)}</p>
      </div>
    `).join("")}
    <p><a href="${SITE}/testimonial/new">Share Your Experience →</a></p>
  </section>

  <section id="faq" class="faq">
    <h2>Frequently Asked Questions</h2>
    <p>Common questions about therapy, services, and booking.</p>
    ${FAQS.map((f) => `
      <details>
        <summary>${escHtml(f.q)}</summary>
        <p>${escHtml(f.a)}</p>
      </details>
    `).join("")}
  </section>

  <section id="booking">
    <h2>Book a Session</h2>
    <p>Take the first step toward your well-being. Contact Zil-e-Huma Suleman to schedule an appointment.</p>
    <p><a href="mailto:zilehumaconsultant@gmail.com">Email: zilehumaconsultant@gmail.com</a></p>
    <p><a href="https://wa.me/923281022334">Chat on WhatsApp: +92 328 1022334</a></p>
    <p><a href="${SITE}/book-appointment">Book directly from our calendar →</a></p>
  </section>

  <section id="contact">
    <h2>Get in Touch</h2>
    <p>I'm here to help. Reach out anytime.</p>
    <ul>
      <li><strong>Email:</strong> <a href="mailto:zilehumaconsultant@gmail.com">zilehumaconsultant@gmail.com</a></li>
      <li><strong>Phone:</strong> <a href="tel:+923281022334">+92 328 1022334</a></li>
      <li><strong>WhatsApp:</strong> <a href="https://wa.me/923281022334">Chat on WhatsApp</a></li>
      <li><strong>Location:</strong> The Plazzo, Gulberg Greens, Islamabad</li>
    </ul>
  </section>

  ${FOOTER}
</body>
</html>`;
}

async function renderBlogListing(): Promise<string> {
  const sb = getSupabase();
  const { data: posts } = await sb.from("blog_posts").select("*").order("created_at", { ascending: false });
  const allPosts = posts ?? [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${HEAD_META}
  <title>Blog — Mental Health Insights | Zil-e-Huma Suleman</title>
  <meta name="description" content="Read articles on mental health, therapy techniques, self-care, and psychological well-being by Clinical Psychologist Zil-e-Huma Suleman.">
  <meta property="og:title" content="Blog — Mental Health Insights | Zil-e-Huma Suleman">
  <link rel="canonical" href="${SITE}/blog">
</head>
<body>
  ${NAV}
  <h1>Blog — Mental Health Insights</h1>
  <p>Articles on mental health, therapy, self-care, and well-being by Zil-e-Huma Suleman, Clinical Psychologist in Islamabad.</p>
  ${allPosts.map((p) => `
    <article class="blog-card">
      <h2><a href="${SITE}/blog/${p.id}">${escHtml(p.title)}</a></h2>
      <p><time datetime="${p.created_at}">${formatDate(p.created_at)}</time> · ${p.read_time} min read · ${escHtml(p.tag)}</p>
      <p>${escHtml(p.excerpt)}</p>
      <p><a href="${SITE}/blog/${p.id}">Read more →</a></p>
    </article>
  `).join("")}
  ${FOOTER}
</body>
</html>`;
}

async function renderBlogPost(id: string): Promise<string | null> {
  const sb = getSupabase();
  const { data: post } = await sb.from("blog_posts").select("*").eq("id", id).single();
  if (!post) return null;

  const articleJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author || "Zil-e-Huma Suleman" },
    datePublished: post.created_at,
    publisher: { "@type": "Person", name: "Zil-e-Huma Suleman" },
    mainEntityOfPage: `${SITE}/blog/${post.id}`,
    articleSection: post.tag,
    wordCount: post.content.split(/\s+/).length,
  });

  // Convert basic markdown-style paragraphs to HTML
  const contentHtml = post.content
    .split("\n\n")
    .map((p: string) => `<p>${escHtml(p.trim())}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${HEAD_META}
  <title>${escHtml(post.title)} | Zil-e-Huma Suleman Blog</title>
  <meta name="description" content="${escHtml(post.excerpt)}">
  <meta property="og:title" content="${escHtml(post.title)}">
  <meta property="og:description" content="${escHtml(post.excerpt)}">
  <meta property="og:type" content="article">
  <link rel="canonical" href="${SITE}/blog/${post.id}">
  <script type="application/ld+json">${articleJsonLd}</script>
</head>
<body>
  ${NAV}
  <article>
    <header>
      <h1>${escHtml(post.title)}</h1>
      <p>By ${escHtml(post.author || "Zil-e-Huma Suleman")} · <time datetime="${post.created_at}">${formatDate(post.created_at)}</time> · ${post.read_time} min read · ${escHtml(post.tag)}</p>
    </header>
    ${contentHtml}
  </article>
  <p><a href="${SITE}/blog">← Back to all posts</a></p>
  ${FOOTER}
</body>
</html>`;
}

function renderServicePage(slug: string): string | null {
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return null;

  const serviceJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.desc,
    provider: {
      "@type": "Psychologist",
      name: "Zil-e-Huma Suleman",
      url: SITE,
      address: { "@type": "PostalAddress", streetAddress: "The Plazzo, Gulberg Greens", addressLocality: "Islamabad", addressCountry: "PK" },
    },
    areaServed: "Islamabad, Pakistan",
    url: `${SITE}/services/${slug}`,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${HEAD_META}
  <title>${escHtml(service.title)} — Zil-e-Huma Suleman | Clinical Psychologist Islamabad</title>
  <meta name="description" content="${escHtml(service.desc)}">
  <meta property="og:title" content="${escHtml(service.title)} — Zil-e-Huma Suleman">
  <meta property="og:description" content="${escHtml(service.desc)}">
  <link rel="canonical" href="${SITE}/services/${slug}">
  <script type="application/ld+json">${serviceJsonLd}</script>
</head>
<body>
  ${NAV}
  <h1>${escHtml(service.title)}</h1>
  <p>${escHtml(service.desc)}</p>
  <h2>Why Choose This Service?</h2>
  <p>Zil-e-Huma Suleman provides ${escHtml(service.title.toLowerCase())} using evidence-based clinical methods honed through extensive training at Military Hospital Rawalpindi and specialized rehabilitation centers.</p>
  <p>Sessions are available both in-person at The Plazzo, Gulberg Greens, Islamabad, and via secure online video — in Urdu or English.</p>
  <h2>Book a Session</h2>
  <p><a href="${SITE}/#booking">${escHtml(service.cta)} →</a></p>
  <p><a href="https://wa.me/923281022334">Chat on WhatsApp</a> | <a href="mailto:zilehumaconsultant@gmail.com">Email</a></p>
  <h2>Other Services</h2>
  <ul>
    ${SERVICES.filter((s) => s.slug !== slug).map((s) => `<li><a href="${SITE}/services/${s.slug}">${escHtml(s.title)}</a> — ${escHtml(s.desc)}</li>`).join("\n")}
  </ul>
  ${FOOTER}
</body>
</html>`;
}

/* ─── Main handler ─── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = (url.searchParams.get("path") || "/").replace(/\/+$/, "") || "/";
  const ua = req.headers.get("user-agent") || "";

  // Debug/info endpoint
  if (path === "/__info") {
    return new Response(
      JSON.stringify({
        status: "ok",
        bot_detected: isBot(ua),
        user_agent: ua,
        supported_paths: ["/", "/blog", "/blog/:id", "/services/:slug"],
        bot_agents_count: BOT_AGENTS.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let html: string | null = null;

    if (path === "/" || path === "") {
      html = await renderHomepage();
    } else if (path === "/blog") {
      html = await renderBlogListing();
    } else if (path.startsWith("/blog/")) {
      const id = path.replace("/blog/", "");
      html = await renderBlogPost(id);
    } else if (path.startsWith("/services/")) {
      const slug = path.replace("/services/", "");
      html = renderServicePage(slug);
    }

    if (!html) {
      // Fallback: redirect to the SPA
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${SITE}${path}` },
      });
    }

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
        "X-Prerender": "1",
        "X-Robots-Tag": "index, follow",
        "Vary": "User-Agent",
      },
    });
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response(
      JSON.stringify({ error: "Prerender failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
