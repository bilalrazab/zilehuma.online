import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://zilehuma.online";

const servicePages = [
  "individual-therapy",
  "anxiety-stress-management",
  "hypnotherapy-sessions",
  "behavioral-therapy",
  "psychological-assessments",
  "online-counseling",
];

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/privacy-policy", priority: "0.4", changefreq: "monthly" },
  ];

  const serviceUrls = servicePages.map((slug) => ({
    loc: `/services/${slug}`,
    priority: "0.7",
    changefreq: "monthly",
  }));

  const blogUrls = (posts || []).map((p) => ({
    loc: `/blog/${p.id}`,
    priority: "0.6",
    changefreq: "monthly",
    lastmod: p.created_at?.split("T")[0],
  }));

  const allUrls = [...staticUrls, ...serviceUrls, ...blogUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${(u as any).lastmod ? `\n    <lastmod>${(u as any).lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
