export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  location?: string;
}

const STORAGE_KEY = "zh_testimonials";
const TESTIMONIAL_PASSWORD = "HuB@HeaS0n2026";

export function verifyTestimonialPassword(password: string): boolean {
  return password === TESTIMONIAL_PASSWORD;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Ayesha R.",
    role: "Anxiety & Stress Management",
    avatar: "",
    rating: 5,
    text: "Zil-e-Huma helped me understand patterns I didn't even know existed. Her approach is warm, structured, and incredibly effective. After just a few sessions, I felt a noticeable shift in how I handled daily stressors.",
    date: "Jan 2026",
    verified: true,
    location: "Islamabad",
  },
  {
    id: "2",
    name: "Hassan M.",
    role: "CBT Sessions",
    avatar: "",
    rating: 5,
    text: "I was skeptical about therapy at first, but the CBT techniques I learned have genuinely transformed my thought patterns. The sessions felt safe, professional, and judgment-free. Highly recommended.",
    date: "Dec 2025",
    verified: true,
    location: "Rawalpindi",
  },
  {
    id: "3",
    name: "Fatima K.",
    role: "Hypnotherapy",
    avatar: "",
    rating: 5,
    text: "The hypnotherapy sessions were nothing like what I expected — they were deeply calming and helped me address issues I'd carried for years. Zil-e-Huma creates a space where healing feels natural.",
    date: "Nov 2025",
    verified: true,
    location: "Islamabad",
  },
  {
    id: "4",
    name: "Omar S.",
    role: "Online Counseling",
    avatar: "",
    rating: 4,
    text: "Being able to have sessions online made all the difference for me. The quality of care was just as good as in-person. She's attentive, empathetic, and truly cares about her clients' progress.",
    date: "Oct 2025",
    verified: true,
    location: "Lahore",
  },
];

export function getTestimonials(): Testimonial[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultTestimonials;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTestimonials));
  return defaultTestimonials;
}

export function saveTestimonial(
  testimonial: Omit<Testimonial, "id" | "date" | "verified">
): Testimonial {
  const testimonials = getTestimonials();
  const newTestimonial: Testimonial = {
    ...testimonial,
    id: Date.now().toString(),
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    verified: true,
  };
  testimonials.unshift(newTestimonial);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(testimonials));
  return newTestimonial;
}

export function deleteTestimonial(id: string): void {
  const testimonials = getTestimonials().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(testimonials));
}
