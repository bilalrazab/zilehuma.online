import { useParams, Link, useNavigate } from "react-router-dom";
import { getPost, toggleLike, deletePost, type BlogPost } from "@/lib/blogStorage";
import { ArrowLeft, Heart, Clock, Tag, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordDialog from "@/components/PasswordDialog";
import SocialShare from "@/components/SocialShare";

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const BlogPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getPost(id || "");
      setPost(data ?? null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="section-title">Post not found</h1>
            <Link to="/blog">
              <Button variant="outline" className="mt-4">Back to Blog</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const handleLike = async () => {
    const updated = await toggleLike(post.id);
    if (updated) setPost(updated);
  };

  const handleDeleteConfirm = async () => {
    await deletePost(post.id);
    setShowDeletePassword(false);
    navigate("/blog");
  };

  const ytId = post.youtube_url ? extractYouTubeId(post.youtube_url) : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
        if (match) {
          return (
            <li key={i} className="ml-4 text-muted-foreground leading-relaxed mb-1">
              <strong className="text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}
            </li>
          );
        }
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-4 text-muted-foreground leading-relaxed mb-1">{line.slice(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 list-decimal text-muted-foreground leading-relaxed mb-1">{line.replace(/^\d+\.\s/, "")}</li>;
      }
      if (line.trim() === "") return <br key={i} />;
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed mb-2">
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part))}
        </p>
      );
    });
  };

  return (
    <>
      <Navbar />
      <PasswordDialog
        open={showDeletePassword}
        onClose={() => setShowDeletePassword(false)}
        onSuccess={handleDeleteConfirm}
        action="delete this post"
      />
      <main className="min-h-screen pt-24 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Posts
          </Link>

          <header className="mb-8">
            <span className="text-xs font-body text-primary bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-4">
              <Tag className="w-3 h-3" /> {post.tag}
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.created_at)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time} min read</span>
              <span className="font-body">By {post.author}</span>
            </div>
          </header>

          {post.cover_image && (
            <div className="rounded-3xl overflow-hidden mb-8">
              <img src={post.cover_image} alt={post.title} className="w-full h-64 sm:h-80 object-cover" />
            </div>
          )}

          {ytId && (
            <div className="rounded-3xl overflow-hidden mb-8 aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="glass-card !p-8 sm:!p-10 mb-8">
            {renderContent(post.content)}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Heart className="w-4 h-4" />
              {post.likes} {post.likes === 1 ? "like" : "likes"}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setShowDeletePassword(true)} className="text-muted-foreground hover:text-destructive gap-1">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
};

export default BlogPostPage;
