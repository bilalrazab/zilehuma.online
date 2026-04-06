import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveTestimonial } from "@/lib/testimonialStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, Upload, X, CheckCircle2, MapPin, User, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AvatarCropper from "@/components/AvatarCropper";

const TestimonialNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [avatar, setAvatar] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cropSrc, setCropSrc] = useState("");
  const [showCropper, setShowCropper] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Maximum 5MB allowed.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropped = (croppedDataUrl: string) => {
    setAvatar(croppedDataUrl);
    setShowCropper(false);
    setCropSrc("");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (name.trim().length > 100) errs.name = "Name too long";
    if (!role.trim()) errs.role = "Service type is required";
    if (!text.trim()) errs.text = "Testimonial text is required";
    if (text.trim().length < 20) errs.text = "Please write at least 20 characters";
    if (text.trim().length > 1000) errs.text = "Maximum 1000 characters";
    if (rating < 1 || rating > 5) errs.rating = "Select a rating";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await saveTestimonial({
      name: name.trim(),
      role: role.trim(),
      location: location.trim() || undefined,
      rating,
      text: text.trim(),
      avatar,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
        <div className="glass-card !p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-2">Your testimonial has been submitted for review.</p>
          <p className="text-sm text-muted-foreground mb-8">It will appear on the website once approved by our team.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            <Button onClick={() => { setSubmitted(false); setName(""); setRole(""); setLocation(""); setRating(5); setText(""); setAvatar(""); }}>Add Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card !p-8 sm:!p-10">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Share Your Experience</h1>
          <p className="text-muted-foreground mb-8">Help others feel confident about starting their journey. Your testimonial will be reviewed before publishing.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatar ? (
                  <div className="relative">
                    <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20" />
                    <button type="button" onClick={() => setAvatar("")} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-full bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Profile Photo</p>
                <p>Optional · Max 5MB</p>
              </div>
            </div>

            <AvatarCropper
              open={showCropper}
              imageSrc={cropSrc}
              onClose={() => { setShowCropper(false); setCropSrc(""); }}
              onCropped={handleCropped}
            />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2"><User className="w-4 h-4 text-primary" /> Full Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha R." maxLength={100} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-primary" /> Service Received *</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Anxiety & Stress Management" maxLength={100} className={errors.role ? "border-destructive" : ""} />
              {errors.role && <p className="text-xs text-destructive mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-primary" /> Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Islamabad (optional)" maxLength={100} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform hover:scale-110">
                    <Star className={`w-7 h-7 transition-colors ${i <= (hoverRating || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="text-xs text-destructive mt-1">{errors.rating}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Your Experience *</label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share how your sessions helped you..." rows={5} maxLength={1000} className={errors.text ? "border-destructive" : ""} />
              <div className="flex justify-between mt-1">
                {errors.text ? <p className="text-xs text-destructive">{errors.text}</p> : <span />}
                <span className="text-xs text-muted-foreground">{text.length}/1000</span>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">Submit Testimonial</Button>
            <p className="text-xs text-center text-muted-foreground">By submitting, you agree to have your testimonial published on our website after review.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestimonialNew;
