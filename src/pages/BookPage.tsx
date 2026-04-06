import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Send, ChevronLeft, ChevronRight, CheckCircle2, Loader2, MapPin, Video, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const db = supabase as any;

const sessionTypes = [
  { value: "individual", label: "Individual Therapy", icon: "🧠" },
  { value: "anxiety", label: "Anxiety & Stress", icon: "🌿" },
  { value: "hypnotherapy", label: "Hypnotherapy", icon: "🌀" },
  { value: "cbt", label: "CBT", icon: "💡" },
  { value: "assessment", label: "Psychological Assessment", icon: "📋" },
  { value: "online", label: "Online Counseling", icon: "💻" },
];

const modeOptions = [
  { value: "in-person", label: "In-Person", icon: MapPin },
  { value: "online", label: "Online", icon: Video },
  { value: "phone", label: "Phone", icon: Phone },
];

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookPage = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMode, setSelectedMode] = useState("in-person");
  const [availability, setAvailability] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingMeta, setBookingMeta] = useState<{ portalInviteSent?: boolean; portalSetupRequired?: boolean } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load doctor availability
  useEffect(() => {
    const loadAvailability = async () => {
      const { data } = await db.from("doctor_availability").select("*").eq("is_available", true);
      setAvailability(data || []);
      if (!data || data.length === 0) {
        console.log("No doctor availability configured — calendar will show no available dates.");
      }
    };
    loadAvailability();
  }, []);

  // Load existing appointments for the month
  useEffect(() => {
    const loadAppointments = async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const { data } = await db.from("appointments").select("start_time, end_time, status")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .in("status", ["scheduled", "pending_approval"]);
      setExistingAppointments(data || []);
    };
    loadAppointments();
  }, [currentMonth]);

  // Generate time slots when date is selected
  useEffect(() => {
    if (!selectedDate) { setTimeSlots([]); return; }
    const dayOfWeek = (selectedDate.getDay() + 6) % 7; // Mon=0
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvail) { setTimeSlots([]); return; }

    const startHour = parseInt(dayAvail.start_time.split(":")[0]);
    const endHour = parseInt(dayAvail.end_time.split(":")[0]);
    const slots: TimeSlot[] = [];

    for (let h = startHour; h < endHour; h++) {
      for (const m of [0, 30]) {
        if (h === endHour - 1 && m === 30) continue; // need 50min slot
        const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const dateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${time}`);
        
        // Check if slot is in the past
        if (isBefore(dateTime, new Date())) {
          continue;
        }

        // Check conflicts
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.start_time).getTime();
          const slotStart = dateTime.getTime();
          return Math.abs(aptStart - slotStart) < 50 * 60000;
        });

        slots.push({ time, available: !hasConflict });
      }
    }
    setTimeSlots(slots);
  }, [selectedDate, availability, existingAppointments]);

  const isDayAvailable = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return availability.some(a => a.day_of_week === dayOfWeek && a.is_available);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedDate || !selectedTime || !selectedType) {
      toast({ title: "Please complete all steps", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/external-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          client_name: form.name,
          client_email: form.email,
          client_phone: form.phone,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          type: selectedMode,
          service: sessionTypes.find(t => t.value === selectedType)?.label || selectedType,
          notes: form.message || undefined,
          source: "website",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Booking failed");
      }

      setBookingMeta({
        portalInviteSent: result.portal_invite_sent,
        portalSetupRequired: result.portal_setup_required,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold">Request Submitted!</h2>
            <p className="text-muted-foreground">
              Your session request for <strong>{format(selectedDate!, "MMMM d, yyyy")}</strong> at <strong>{selectedTime}</strong> has been received. 
              You'll receive a confirmation once your therapist approves the booking.
            </p>
            {bookingMeta?.portalInviteSent && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground text-left">
                We also sent a secure setup email to <strong>{form.email}</strong> so you can create your portal password and complete your profile.
              </div>
            )}
            {!bookingMeta?.portalInviteSent && bookingMeta?.portalSetupRequired && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground text-left">
                Your portal access is being prepared. If you do not receive the setup email, the clinic can re-send it for you.
              </div>
            )}
            <div className="pt-4 space-y-2">
              <Button onClick={() => { setSubmitted(false); setBookingMeta(null); setStep(1); setSelectedDate(null); setSelectedTime(""); }} variant="outline" className="w-full">
                Book Another Session
              </Button>
              <Link to="/">
                <Button variant="ghost" className="w-full">← Back to Website</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Book a Therapy Session — Online & Islamabad"
        description="Book an in-person or online therapy session with Clinical Psychologist Zil-e-Huma Suleman. Offering anxiety, depression, trauma, and hypnotherapy consultations across Pakistan."
        canonical="https://zilehuma.online/book-appointment"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Clinical Psychology & Hypnotherapy Sessions",
          "provider": { "@type": "Person", "name": "Zil-e-Huma Suleman" },
          "areaServed": "Pakistan",
          "url": "https://zilehuma.online/book-appointment",
          "serviceType": ["Online Therapy", "Hypnotherapy", "Mental Health Counseling"]
        }}
      />
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold text-primary">Zil-e-Huma</span>
            <span className="text-xs text-muted-foreground">Clinical Psychologist</span>
          </Link>
          <Badge variant="secondary" className="text-xs">
            <CalendarDays className="h-3 w-3 mr-1" /> Book a Session
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: "Date & Time" },
            { n: 2, label: "Service" },
            { n: 3, label: "Your Info" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => { if (s.n < step) setStep(s.n); }}
                className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all ${
                  step >= s.n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.n ? "✓" : s.n}
              </button>
              <span className={`text-sm hidden sm:inline ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-8 sm:w-16 h-0.5 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-heading font-bold">Choose Date & Time</h2>
              <p className="text-muted-foreground mt-1">Select an available slot that works for you</p>
            </div>

            {availability.length === 0 && (
              <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/10">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-amber-700 dark:text-amber-400">No available slots at this time</p>
                  <p className="mt-1">The therapist has not configured availability yet. Please check back later or contact the clinic directly.</p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h3 className="font-heading font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                      <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                    {days.map((day, i) => {
                      const inMonth = day.getMonth() === currentMonth.getMonth();
                      const available = isDayAvailable(day);
                      const selected = selectedDate && isSameDay(day, selectedDate);
                      const today = isToday(day);
                      return (
                        <button
                          key={i}
                          onClick={() => { if (available && inMonth) { setSelectedDate(day); setSelectedTime(""); } }}
                          disabled={!available || !inMonth}
                          className={`aspect-square rounded-lg text-sm transition-all relative ${
                            selected ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30" :
                            today ? "bg-accent font-semibold" :
                            available && inMonth ? "hover:bg-muted cursor-pointer" :
                            "text-muted-foreground/30 cursor-not-allowed"
                          }`}
                        >
                          {format(day, "d")}
                          {available && inMonth && !selected && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                  </h3>
                  {!selectedDate ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">← Pick a date to see available times</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">No available slots for this day</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                            selectedTime === slot.time
                              ? "bg-primary text-primary-foreground border-primary"
                              : slot.available
                              ? "bg-card border-border hover:border-primary/40 hover:bg-muted"
                              : "bg-muted/50 text-muted-foreground/40 border-transparent cursor-not-allowed line-through"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                size="lg"
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Service Type */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-heading font-bold">Choose Service</h2>
              <p className="text-muted-foreground mt-1">What type of session would you like?</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessionTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedType === type.value
                      ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-medium mt-2">{type.label}</p>
                </button>
              ))}
            </div>

            <div>
              <Label className="mb-2 block">Session Mode</Label>
              <div className="flex gap-3">
                {modeOptions.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                      selectedMode === mode.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    <mode.icon className="h-4 w-4" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedType} size="lg">Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-heading font-bold">Your Information</h2>
              <p className="text-muted-foreground mt-1">We'll use this to confirm your booking</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* Booking Summary */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-medium">Booking Summary</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>📅 {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
                    <p>🕐 {selectedTime}</p>
                    <p>🧠 {sessionTypes.find(t => t.value === selectedType)?.label}</p>
                    <p className="capitalize">📍 {selectedMode}</p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }}
                  placeholder="Your full name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }}
                  placeholder="your@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: "" })); }}
                  placeholder="+92 300 1234567"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Anything you'd like your therapist to know..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
                <Button onClick={handleSubmit} disabled={loading} size="lg">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Zil-e-Huma — Clinical Psychologist</p>
        <p className="mt-1">The Plazzo, Gulberg Greens, Islamabad</p>
      </footer>
    </div>
  );
};

export default BookPage;
