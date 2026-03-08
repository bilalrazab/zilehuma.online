import { useState, FormEvent } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "./ui/button";
import { CalendarDays, Clock, Send } from "lucide-react";

const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
const sessionTypes = ["Individual Therapy", "Anxiety & Stress Management", "Hypnotherapy", "Behavioral Therapy", "Psychological Assessment", "Online Counseling"];

interface FormData {
  name: string; email: string; phone: string; date: string; time: string; type: string; mode: string; message: string;
}

const BookingSection = () => {
  const ref = useScrollReveal();
  const [form, setForm] = useState<FormData>({ name: "", email: "", phone: "", date: "", time: "", type: "", mode: "Online", message: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Select a time";
    if (!form.type) e.type = "Select a type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const msg = `Hello! I'd like to book a session.\n\nName: ${form.name}\nDate: ${form.date}\nTime: ${form.time}\nSession: ${form.type}\nMode: ${form.mode}\nMessage: ${form.message || "N/A"}`;
    const url = `https://wa.me/923281022334?text=${encodeURIComponent(msg)}`;

    setSubmitted(true);
    setTimeout(() => window.open(url, "_blank"), 1200);
  };

  const set = (key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const inputClass = (key: keyof FormData) =>
    `w-full rounded-2xl px-4 py-3 bg-muted border text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${errors[key] ? "border-destructive" : "border-border"}`;

  if (submitted) {
    return (
      <section id="booking" className="section-container">
        <div className="max-w-lg mx-auto text-center glass-card p-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h2 className="section-title text-2xl">Session Requested!</h2>
          <p className="text-muted-foreground mt-2">Redirecting you to WhatsApp to confirm your booking…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="section-container bg-muted/30">
      <div ref={ref} className="opacity-0 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Book a Session</h2>
          <p className="section-subtitle mx-auto">Take the first step toward your well-being.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5" noValidate>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-name" className="text-xs text-muted-foreground mb-1 block font-body">Full Name</label>
              <input id="booking-name" placeholder="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass("name")} />
              {errors.name && <span className="text-xs text-destructive mt-1 block">{errors.name}</span>}
            </div>
            <div>
              <label htmlFor="booking-email" className="text-xs text-muted-foreground mb-1 block font-body">Email</label>
              <input id="booking-email" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass("email")} />
              {errors.email && <span className="text-xs text-destructive mt-1 block">{errors.email}</span>}
            </div>
          </div>

          <div>
            <label htmlFor="booking-phone" className="text-xs text-muted-foreground mb-1 block font-body">Phone Number</label>
            <input id="booking-phone" placeholder="Phone Number" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass("phone")} />
            {errors.phone && <span className="text-xs text-destructive mt-1 block">{errors.phone}</span>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-date" className="text-xs text-muted-foreground mb-1 block font-body">Preferred Date</label>
              <input id="booking-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass("date")} />
              {errors.date && <span className="text-xs text-destructive mt-1 block">{errors.date}</span>}
            </div>
            <div>
              <label htmlFor="booking-type" className="text-xs text-muted-foreground mb-1 block font-body">Session Type</label>
              <select id="booking-type" value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass("type")} aria-label="Session Type">
                <option value="">Select type…</option>
                {sessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <span className="text-xs text-destructive mt-1 block">{errors.type}</span>}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-body flex items-center gap-1">
              <Clock className="w-3 h-3" /> Preferred Time
            </label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("time", t)}
                  className={`px-4 py-2 rounded-full text-sm font-body transition-all border ${
                    form.time === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.time && <span className="text-xs text-destructive mt-1 block">{errors.time}</span>}
          </div>

          {/* Mode */}
          <div className="flex gap-3">
            {["Online", "In-person"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("mode", m)}
                className={`flex-1 py-3 rounded-2xl text-sm font-body border transition-all ${
                  form.mode === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="booking-message" className="text-xs text-muted-foreground mb-1 block font-body">Message (optional)</label>
            <textarea
              id="booking-message"
              placeholder="Your message (optional)"
              rows={3}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className={inputClass("message")}
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            <Send className="w-4 h-4" /> Send via WhatsApp
          </Button>
        </form>
      </div>
    </section>
  );
};

export default BookingSection;
