import { useScrollReveal } from "@/hooks/useScrollReveal";

const timeline = [
  { period: "June 2025 – Jan 2026", role: "Hypnotherapist", place: "Mind Power Artists – Gulberg, Islamabad", detail: "Conducted clinical hypnotherapy sessions for phobias, habit change, emotional blocks, and deep relaxation using guided subconscious techniques." },
  { period: "Sep 2023 – Jan 2025", role: "Clinical Internship", place: "Military Hospital Rawalpindi", detail: "Completed 16-month clinical training in psychiatry and psychology wards — conducted intake assessments, administered psychometric tests, and co-facilitated CBT group sessions." },
  { period: "2023 – 2024", role: "Clinical Psychology Observer", place: "Military Hospital Rawalpindi", detail: "Observed senior psychologists in diagnostic evaluations, neuropsychological testing, and trauma-focused interventions across diverse patient populations." },
  { period: "Mar 2023 – May 2023", role: "Clinical Intern", place: "Aeman Rehabilitation Center", detail: "Worked with individuals recovering from substance use disorders — provided motivational interviewing, psychoeducation, and relapse prevention counseling." },
  { period: "2021 – 2023", role: "Special Education Teacher", place: "Learn-A-Lacious School", detail: "Designed individualized learning plans and behavioral interventions for children with developmental and learning disabilities." },
];

const ExperienceSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="experience" className="section-container">
      <div ref={ref} className="opacity-0 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Experience</h2>
          <p className="section-subtitle mx-auto">A journey rooted in learning and compassion.</p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-border" />

          <div className="flex flex-col gap-8">
            {timeline.map((t, i) => (
              <div key={i} className="relative pl-12 sm:pl-16">
                {/* Node */}
                <div className="absolute left-2.5 sm:left-4.5 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                <div className="glass-card p-5">
                  <span className="text-xs font-body text-muted-foreground tracking-wide">{t.period}</span>
                  <h3 className="font-heading font-semibold text-foreground mt-1">{t.role}</h3>
                  <p className="text-sm text-muted-foreground">{t.place}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
