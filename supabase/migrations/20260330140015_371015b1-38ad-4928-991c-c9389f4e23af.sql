
-- Allow anyone (including anon) to insert and delete likes
DROP POLICY IF EXISTS "Authenticated users insert likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users delete own likes" ON blog_likes;

CREATE POLICY "Anyone can insert likes" ON blog_likes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete own likes" ON blog_likes FOR DELETE TO anon, authenticated USING (true);

-- Allow anyone (including anon) to insert comments
DROP POLICY IF EXISTS "Authenticated users insert comments" ON blog_comments;
CREATE POLICY "Anyone can insert comments" ON blog_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
