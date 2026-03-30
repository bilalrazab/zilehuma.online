import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPosts, deletePost, verifyPassword, type BlogPost } from "@/lib/blogStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Heart, Clock, Search, Plus, Trash2, Tag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordDialog from "@/components/PasswordDialog";

const TAGS = ["All", "Mental Health", "Therapy", "Hypnotherapy", "Self-Care", "Relationships", "Wellness"];

const Blog = () => {
  const { role } = useAuth();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const perPage = 6;

  const loadPosts = async () => {
    const data = await getPosts();
    setPosts(data);
    setLoading(false);

    // Load like counts from blog_likes table
    const postIds = data.map(p => p.id);
    if (postIds.length > 0) {
      const db = supabase as any;
      const { data: likes } = await db.from('blog_likes').select('post_id');
      const counts: Record<string, number> = {};
      (likes || []).forEach((l: any) => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
      setLikeCounts(counts);

      const { data: comments } = await db.from('blog_comments').select('post_id').eq('approved', true);
      const cCounts: Record<string, number> = {};
      (comments || []).forEach((c: any) => { cCounts[c.post_id] = (cCounts[c.post_id] || 0) + 1; });
      setCommentCounts(cCounts);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchTag = activeTag === "All" || p.tag === activeTag;
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchTag && matchSearch;
    });
  }, [posts, search, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);


  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deletePost(deleteTarget);
      await loadPosts();
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <Navbar />
      <PasswordDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDeleteConfirm}
        action="delete this post"
      />
      <main className="min-h-screen pt-24 pb-12">
        <div className="section-container !py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </Link>
              <h1 className="section-title !mb-1">Blog</h1>
              <p className="section-subtitle">Insights on mental health, therapy & well-being.</p>
            </div>
            {isStaff && (
              <Link to="/blog/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Write a Post
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search articles..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button key={tag} onClick={() => { setActiveTag(tag); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200 ${activeTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No posts found.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((post) => (
                <article key={post.id} className="glass-card flex flex-col group">
                  {post.cover_image && (
                    <div className="rounded-2xl overflow-hidden mb-4 -mx-2 -mt-2">
                      <img src={post.cover_image} alt={post.title} className="w-full aspect-[16/9] object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-body text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {post.tag}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.read_time} min
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-foreground text-lg mb-2 leading-snug">{post.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3.5 h-3.5" />
                        {likeCounts[post.id] || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {commentCounts[post.id] || 0}
                      </span>
                      {isStaff && (
                        <button onClick={() => handleDeleteClick(post.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Link to={`/blog/${post.id}`} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all font-body" aria-label={`Read full article: ${post.title}`}>
                      Read <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-full text-sm font-body transition-all ${page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {i + 1}
                </button>
              ))}
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Blog;
