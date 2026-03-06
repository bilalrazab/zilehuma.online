import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Understanding Anxiety: Signs You Shouldn't Ignore",
    excerpt: "Anxiety is more than just worry. Learn to recognize the physical and emotional signs that indicate it's time to seek support.",
    date: "Feb 15, 2026",
    tag: "Mental Health",
  },
  {
    id: 2,
    title: "How CBT Can Transform Your Thought Patterns",
    excerpt: "Cognitive Behavioral Therapy helps you identify and reshape negative thinking. Here's how it works in practice.",
    date: "Jan 28, 2026",
    tag: "Therapy",
  },
  {
    id: 3,
    title: "The Power of Hypnotherapy for Stress Relief",
    excerpt: "Hypnotherapy isn't magic — it's science. Discover how guided relaxation can unlock deep healing and resilience.",
    date: "Jan 10, 2026",
    tag: "Hypnotherapy",
  },
];

const BlogSection = () => {
  const ref = useScrollReveal();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="blog" className="section-container">
      <div ref={ref} className="opacity-0">
        <div className="text-center mb-12">
          <h2 className="section-title">Blog</h2>
          <p className="section-subtitle mx-auto">Insights on mental health, therapy, and well-being.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {blogPosts.map((post) => (
            <article key={post.id} className="glass-card flex flex-col">
              <span className="text-xs font-body text-primary bg-primary/10 self-start px-3 py-1 rounded-full mb-3">
                {post.tag}
              </span>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2 leading-snug">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {expanded === post.id ? post.excerpt : post.excerpt.slice(0, 100) + "…"}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{post.date}</span>
                <button
                  onClick={() => setExpanded(expanded === post.id ? null : post.id)}
                  className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all font-body"
                >
                  {expanded === post.id ? "Less" : "Read more"} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
