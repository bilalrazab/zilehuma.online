import { useScrollReveal } from "@/hooks/useScrollReveal";

const faqs = [
  {
    q: "Who is Zil-e-Huma SulemansS?",
    a: "Zil-e-Huma Suleman is a qualified Clinical Psychologist based in Islamabad, Pakistan. She specializes in creating safe, compassionate spaces for healing using evidence-based therapy and genuine human connection.",
  },
  {
    q: "What services does Zil-e-Huma Suleman offer?",
    a: "She offers evidence-based therapy, Cognitive Behavioral Therapy (CBT), hypnotherapy, and professional counseling. Sessions are available both online and in-person in Islamabad.",
  },
  {
    q: "Does Zil-e-Huma Suleman provide online therapy in Pakistan?",
    a: "Yes. She offers convenient online counseling sessions that you can attend from anywhere in Pakistan or abroad via video call.",
  },
  {
    q: "What is CBT therapy and how can it help?",
    a: "CBT (Cognitive Behavioral Therapy) is a proven, practical approach that helps you identify and change negative thought patterns. It is highly effective for anxiety, depression, stress, and many other mental health challenges.",
  },
  {
    q: "Is hypnotherapy available with Zil-e-Huma Suleman?",
    a: "Yes. Hypnotherapy is one of her specialized services and is used to address deep-rooted habits, anxiety, phobias, and certain emotional blocks in a relaxed, focused state.",
  },
  {
    q: "How do I book an appointment with Zil-e-Huma Suleman?",
    a: "Simply email zilehumaconsultant@gmail.com or send a message via WhatsApp. She will reply quickly and help you choose an online or in-person slot that suits you.",
  },
  {
    q: "Where is Zil-e-Huma Suleman's clinic in Islamabad?",
    a: "Her in-person practice is located in Islamabad. Exact address and directions are provided once you book your session.",
  },
  {
    q: "What are Zil-e-Huma Suleman's qualifications and experience?",
    a: "She holds an MS in Clinical Psychology and has gained hands-on clinical experience in hospitals, rehabilitation centers, and therapeutic settings.",
  },
  {
    q: "Are therapy sessions confidential?",
    a: "Absolutely. All sessions are strictly confidential and follow the highest professional ethics and privacy standards of clinical psychology in Pakistan.",
  },
  {
    q: "Who can benefit from sessions with a clinical psychologist like Zil-e-Huma?",
    a: "Anyone struggling with anxiety, depression, stress, trauma, relationship issues, self-esteem, or simply wanting personal growth can benefit. Sessions are suitable for adults and young adults.",
  },
  {
    q: "How long is a typical therapy session?",
    a: "Most sessions last 45–60 minutes. The exact duration is discussed and customized when you book.",
  },
  {
    q: "What should I expect in my first session?",
    a: "In the first session you will discuss what brings you to therapy in a safe, non-judgmental space. Zil-e-Huma will understand your goals and create a personalized plan. There is no pressure — it's simply a gentle conversation.",
  },
];

const FAQSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="faq" className="section-container">
      <div ref={ref} className="opacity-0 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle mx-auto">
            Common questions about therapy, services, and booking.
          </p>
        </div>

        <div className="w-full divide-y divide-border">
          {faqs.map((faq, i) => (
            <details key={i} className="group">
              <summary className="flex items-center justify-between cursor-pointer py-4 text-left text-foreground font-body text-sm sm:text-base hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <svg
                  className="w-4 h-4 shrink-0 ml-2 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="pb-4 text-muted-foreground font-body leading-relaxed text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
