import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Testimonial = Tables<"testimonials">;

const TESTIMONIAL_PASSWORD = "HuB@HeaS0n2026";

export function verifyTestimonialPassword(password: string): boolean {
  return password === TESTIMONIAL_PASSWORD;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }
  return data;
}

export async function saveTestimonial(testimonial: {
  name: string;
  role: string;
  avatar?: string;
  rating: number;
  text: string;
  location?: string;
}): Promise<Testimonial | null> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      ...testimonial,
      avatar: testimonial.avatar || "",
      location: testimonial.location || "",
      verified: true,
      approved: false,
    })
    .select()
    .single();
  if (error) {
    console.error("Error saving testimonial:", error);
    return null;
  }
  return data;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) console.error("Error deleting testimonial:", error);
}
