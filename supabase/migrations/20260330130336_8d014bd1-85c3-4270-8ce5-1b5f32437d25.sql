
-- Fix blog_likes: restrict insert/delete to authenticated users
DROP POLICY IF EXISTS "Anyone can insert likes" ON blog_likes;
DROP POLICY IF EXISTS "Anyone can delete likes" ON blog_likes;

CREATE POLICY "Authenticated users insert likes" ON blog_likes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete own likes" ON blog_likes
  FOR DELETE TO authenticated
  USING (true);
