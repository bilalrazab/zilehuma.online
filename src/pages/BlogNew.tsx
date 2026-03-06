import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { savePost } from "@/lib/blogStorage";
import { ArrowLeft, Send, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TAGS = ["Mental Health", "Therapy", "Hypnotherapy", "Self-Care", "Relationships", "Wellness"];

const BlogNew = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    tag: TAGS[0],
    coverImage: "",
    author: "Zil-e-Huma",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.excerpt.trim()) e.excerpt = "Excerpt is required";
    if (!form.content.trim()) e.content = "Content is required";
    if (form.content.trim().length < 50) e.content = "Content must be at least 50 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    savePost(form);
    toast.success("Post published!");
    navigate("/blog");
  };

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  // Simple preview render
  const renderPreview = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="font-heading text-xl font-semibold mt-6 mb-2 text-foreground">{line.slice(3)}</h2>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground mb-1">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return <p key={i} className="text-muted-foreground leading-relaxed mb-2">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{p}</strong> : p)}</p>;
    });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Blog
          </Link>

          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title !mb-0">Write a Post</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(!preview)}
              className="gap-1"
            >
              {preview ? <><Edit3 className="w-4 h-4" /> Edit</> : <><Eye className="w-4 h-4" /> Preview</>}
            </Button>
          </div>

          {preview ? (
            <div className="glass-card !p-8 sm:!p-10">
              <span className="text-xs font-body text-primary bg-primary/10 px-3 py-1 rounded-full mb-4 inline-block">{form.tag}</span>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-3">{form.title || "Untitled"}</h1>
              <p className="text-muted-foreground mb-6 italic">{form.excerpt || "No excerpt"}</p>
              {form.coverImage && (
                <div className="rounded-2xl overflow-hidden mb-6">
                  <img src={form.coverImage} alt="" className="w-full h-56 object-cover" />
                </div>
              )}
              <div>{renderPreview(form.content || "No content yet...")}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card !p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Your article title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Input
                  id="excerpt"
                  placeholder="A short summary of the post"
                  value={form.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                  className={errors.excerpt ? "border-destructive" : ""}
                />
                {errors.excerpt && <p className="text-xs text-destructive">{errors.excerpt}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tag">Category</Label>
                  <select
                    id="tag"
                    value={form.tag}
                    onChange={(e) => update("tag", e.target.value)}
                    className="flex h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) => update("author", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
                <Input
                  id="coverImage"
                  placeholder="https://example.com/image.jpg"
                  value={form.coverImage}
                  onChange={(e) => update("coverImage", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content * <span className="text-xs text-muted-foreground font-normal">(Use ## for headings, **bold**, - for lists)</span></Label>
                <Textarea
                  id="content"
                  placeholder="Write your article content here..."
                  value={form.content}
                  onChange={(e) => update("content", e.target.value)}
                  rows={14}
                  className={`font-mono text-sm ${errors.content ? "border-destructive" : ""}`}
                />
                {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
                <p className="text-xs text-muted-foreground">{form.content.split(/\s+/).filter(Boolean).length} words</p>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                <Send className="w-4 h-4" /> Publish Post
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BlogNew;
