
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Mental Health',
  cover_image TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Zil-e-Huma',
  read_time INTEGER NOT NULL DEFAULT 1,
  likes INTEGER NOT NULL DEFAULT 0,
  youtube_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT true,
  location TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public read for both tables
CREATE POLICY "Anyone can read blog posts" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can read testimonials" ON public.testimonials FOR SELECT USING (true);

-- Insert/update/delete (password protection is handled in app logic)
CREATE POLICY "Anyone can insert blog posts" ON public.blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update blog posts" ON public.blog_posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete blog posts" ON public.blog_posts FOR DELETE USING (true);

CREATE POLICY "Anyone can insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete testimonials" ON public.testimonials FOR DELETE USING (true);
