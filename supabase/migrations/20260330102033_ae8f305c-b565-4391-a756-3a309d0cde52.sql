
-- 1. Blog comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID,
  author_name TEXT NOT NULL DEFAULT '',
  author_email TEXT,
  content TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved comments" ON public.blog_comments FOR SELECT USING (approved = true);
CREATE POLICY "Authenticated users can insert comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Doctors manage comments" ON public.blog_comments FOR ALL USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Blog likes table (track unique likes)
CREATE TABLE public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, session_id)
);
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON public.blog_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete likes" ON public.blog_likes FOR DELETE USING (true);

-- 3. Add approved column to testimonials
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;
-- Existing testimonials should be approved
UPDATE public.testimonials SET approved = true WHERE approved = false;

-- 4. Enable realtime for blog_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;
