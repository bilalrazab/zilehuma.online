import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { getPosts, type BlogPost } from "@/lib/blogStorage";
import { Button } from "@/components/ui/button";

const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    getPosts().then((data) => setPosts(data.slice(0, 3)));
  }, []);

  if (posts.length === 0) return null;

  return <BlogSectionContent posts={posts} />;
};

const BlogSectionContent = ({ posts }: { posts: BlogPost[] }) => {
  const ref = useScrollReveal();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <section id="blog" className="section-container">
      <div ref={ref} className="opacity-0">
        <div className="text-center mb-12">
          <h2 className="section-title">Blog</h2>
          <p className="section-subtitle mx-auto">Insights on mental health, therapy, and well-being.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {posts.map((post) => (
            <article key={post.id} className="glass-card flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-body text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {post.tag}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.read_time} min
                </span>
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2 leading-snug">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                <Link
                  to={`/blog/${post.id}`}
                  className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all font-body"
                  aria-label={`Read more about ${post.title}`}
                >
                  Read more <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              View All Posts <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
