import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BlogPost = Tables<"blog_posts">;

// Password verification removed — blog management is now protected by RLS (staff-only policies)

export async function getPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
  return data;
}

export async function getPost(id: string): Promise<BlogPost | undefined> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Error fetching post:", error);
    return undefined;
  }
  return data ?? undefined;
}

export async function savePost(post: {
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  cover_image?: string;
  author: string;
  youtube_url?: string;
}): Promise<BlogPost | null> {
  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...post,
      read_time: readTime,
      likes: 0,
    })
    .select()
    .single();
  if (error) {
    console.error("Error saving post:", error);
    return null;
  }
  return data;
}

// Likes are now tracked via the blog_likes table (see BlogPost.tsx)

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) console.error("Error deleting post:", error);
}
