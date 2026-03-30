import { useParams, Link, useNavigate } from "react-router-dom";
import { getPost, deletePost, type BlogPost } from "@/lib/blogStorage";
import { ArrowLeft, Heart, Clock, Tag, Trash2, Calendar, MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordDialog from "@/components/PasswordDialog";
import SocialShare from "@/components/SocialShare";

const db = supabase as any;

const getSessionId = () => {
  let sid = localStorage.getItem('blog_session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('blog_session_id', sid); }
  return sid;
};

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const BlogPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isStaff = role === 'doctor' || role === 'super_admin';
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Likes
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  const loadLikes = useCallback(async () => {
    if (!id) return;
    const { count } = await db.from('blog_likes').select('*', { count: 'exact', head: true }).eq('post_id', id);
    setLikeCount(count || 0);
    const sid = getSessionId();
    const { data } = await db.from('blog_likes').select('id').eq('post_id', id).eq('session_id', sid).single();
    setHasLiked(!!data);
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    const { data } = await db.from('blog_comments').select('*').eq('post_id', id).eq('approved', true).order('created_at', { ascending: true });
    setComments(data || []);
  }, [id]);

  useEffect(() => {
    const load = async () => {
      const data = await getPost(id || "");
      setPost(data ?? null);
      setLoading(false);
    };
    load();
    loadLikes();
    loadComments();
  }, [id, loadLikes, loadComments]);

  if (loading) return (<><Navbar /><main className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main></>);
  if (!post) return (<><Navbar /><main className="min-h-screen pt-24 flex items-center justify-center"><div className="text-center"><h1 className="section-title">Post not found</h1><Link to="/blog"><Button variant="outline" className="mt-4">Back to Blog</Button></Link></div></main></>);

  const handleLike = async () => {
    const sid = getSessionId();
    if (hasLiked) {
      await db.from('blog_likes').delete().eq('post_id', post.id).eq('session_id', sid);
    } else {
      await db.from('blog_likes').insert({ post_id: post.id, session_id: sid });
    }
    loadLikes();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await db.from('blog_comments').insert({
        post_id: post.id, author_name: commentName.trim(), content: commentText.trim(), approved: false,
      });
      setCommentSuccess(true);
      setCommentName(''); setCommentText('');
      setTimeout(() => setCommentSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    await deletePost(post.id);
    setShowDeletePassword(false);
    navigate("/blog");
  };

  const ytId = post.youtube_url ? extractYouTubeId(post.youtube_url) : null;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*")) return <em key={j} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={j} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("### ")) { elements.push(<h3 key={i} className="font-heading text-lg font-semibold text-foreground mt-6 mb-2">{parseInline(line.slice(4))}</h3>); i++; continue; }
      if (line.startsWith("## ")) { elements.push(<h2 key={i} className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">{parseInline(line.slice(3))}</h2>); i++; continue; }
      if (line.startsWith("# ")) { elements.push(<h2 key={i} className="font-heading text-2xl font-bold text-foreground mt-8 mb-3">{parseInline(line.slice(2))}</h2>); i++; continue; }
      if (line.startsWith("> ")) { elements.push(<blockquote key={i} className="border-l-4 border-primary/40 pl-4 py-2 my-4 italic text-muted-foreground bg-primary/5 rounded-r-lg">{parseInline(line.slice(2))}</blockquote>); i++; continue; }
      if (/^---+$/.test(line.trim())) { elements.push(<hr key={i} className="border-border my-6" />); i++; continue; }
      if (line.startsWith("- ")) { const li: React.ReactNode[] = []; while (i < lines.length && lines[i].startsWith("- ")) { li.push(<li key={i} className="text-muted-foreground leading-relaxed">{parseInline(lines[i].slice(2))}</li>); i++; } elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 ml-2">{li}</ul>); continue; }
      if (/^\d+\.\s/.test(line)) { const li: React.ReactNode[] = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) { li.push(<li key={i} className="text-muted-foreground leading-relaxed">{parseInline(lines[i].replace(/^\d+\.\s/, ""))}</li>); i++; } elements.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-3 ml-2">{li}</ol>); continue; }
      if (line.trim() === "") { elements.push(<div key={i} className="h-3" />); i++; continue; }
      elements.push(<p key={i} className="text-muted-foreground leading-relaxed mb-3">{parseInline(line)}</p>); i++;
    }
    return elements;
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image || "https://zilehuma.online/og-image.png",
    "author": { "@type": "Person", "name": post.author, "url": "https://zilehuma.online" },
    "publisher": { "@type": "Organization", "name": "Zil-e-Huma Suleman", "url": "https://zilehuma.online" },
    "datePublished": post.created_at,
    "dateModified": post.created_at,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://zilehuma.online/blog/${post.id}` },
    "wordCount": post.content.split(/\s+/).length,
    "articleSection": post.tag,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["article h1", "article header p"]
    }
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <PasswordDialog open={showDeletePassword} onClose={() => setShowDeletePassword(false)} onSuccess={handleDeleteConfirm} action="delete this post" />
      <main className="min-h-screen pt-24 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Posts
          </Link>

          <header className="mb-8">
            <span className="text-xs font-body text-primary bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-4"><Tag className="w-3 h-3" /> {post.tag}</span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.created_at)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time} min read</span>
              <span className="font-body">By {post.author}</span>
            </div>
          </header>

          {post.cover_image && <div className="rounded-3xl overflow-hidden mb-8 aspect-[16/9]"><img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" /></div>}
          {ytId && <div className="rounded-3xl overflow-hidden mb-8 aspect-video"><iframe src={`https://www.youtube.com/embed/${ytId}`} title="YouTube video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}

          <div className="glass-card !p-8 sm:!p-10 mb-8">{renderContent(post.content)}</div>

          {/* Like + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${hasLiked ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}>
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </button>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" /> {comments.length} comments
              </span>
              {isStaff && (
                <Button variant="ghost" size="sm" onClick={() => setShowDeletePassword(true)} className="text-muted-foreground hover:text-destructive gap-1">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
            </div>
            <SocialShare url={window.location.href} title={post.title} excerpt={post.excerpt} />
          </div>

          {/* Comments Section */}
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-semibold">Comments ({comments.length})</h3>

            {/* Comment Form */}
            <div className="glass-card !p-6">
              <h4 className="font-semibold text-sm mb-3">Leave a comment</h4>
              {commentSuccess ? (
                <div className="text-center py-4">
                  <p className="text-sm text-primary font-medium">✅ Comment submitted! It will appear after approval.</p>
                </div>
              ) : (
                <form onSubmit={handleComment} className="space-y-3">
                  <Input placeholder="Your name" value={commentName} onChange={e => setCommentName(e.target.value)} required maxLength={100} />
                  <Textarea placeholder="Write your comment..." value={commentText} onChange={e => setCommentText(e.target.value)} required rows={3} maxLength={1000} />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-muted-foreground">Comments are moderated before publishing.</span>
                    <Button type="submit" size="sm" disabled={commentSubmitting}>
                      {commentSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Post</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="glass-card !p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {c.author_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.author_name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
};

export default BlogPostPage;
