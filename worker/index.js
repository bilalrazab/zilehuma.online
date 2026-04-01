/**
 * Cloudflare Worker — Bot-Aware Prerender Proxy
 * 
 * HOW IT WORKS:
 * 1. Every request to zilehuma.online hits this Worker first
 * 2. Worker checks User-Agent for known bots/crawlers
 * 3. If bot → proxy to the Supabase prerender edge function (full static HTML)
 * 4. If human → pass through to the origin (normal SPA)
 * 
 * SETUP:
 * 1. Go to https://dash.cloudflare.com
 * 2. Select your zilehuma.online domain
 * 3. Go to Workers & Pages → Create Worker
 * 4. Paste this code
 * 5. Go to Triggers → Add Route: zilehuma.online/* and www.zilehuma.online/*
 * 6. Deploy
 * 
 * IMPORTANT: Your domain must be on Cloudflare DNS (proxied, orange cloud) for this to work.
 */

const PRERENDER_URL = "https://stdchygflgjzxpteizcw.supabase.co/functions/v1/prerender";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGNoeWdmbGdqenhwdGVpemN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTAwMjgsImV4cCI6MjA4ODUyNjAyOH0.GFn2sGF7vmqeIQK285HLuieJJxv9MYtI0vdpGL45bqc";

// Comprehensive bot detection list
const BOT_AGENTS = [
  // Search engines
  "googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider",
  "slurp", "sogou", "exabot", "ia_archiver", "amazonbot",
  // Social media
  "facebot", "facebookexternalhit", "linkedinbot", "twitterbot",
  "whatsapp", "telegrambot", "pinterestbot", "redditbot",
  "discordbot", "slackbot",
  // AI crawlers
  "gptbot", "chatgpt-user", "claudebot", "perplexitybot",
  "applebot", "cohere-ai", "google-extended", "anthropic-ai",
  "bytespider",
  // SEO tools
  "semrushbot", "ahrefsbot", "mj12bot", "dotbot", "petalbot",
  "rogerbot", "screaming frog", "sitebulb", "deepcrawl",
  // Prerender/headless
  "prerender", "headlesschrome",
];

// Paths that should be prerendered (content pages only)
const PRERENDER_PATHS = ["/", "/blog", "/services/", "/book-appointment"];
const PRERENDER_PATTERNS = [/^\/blog\/[a-f0-9-]+$/, /^\/services\/[\w-]+$/];

// Static asset extensions to never prerender
const SKIP_EXTENSIONS = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".map", ".json", ".xml", ".txt", ".pdf", ".mp4", ".webp", ".avif"];

function isBot(ua) {
  const lower = ua.toLowerCase();
  return BOT_AGENTS.some((b) => lower.includes(b));
}

function shouldPrerender(pathname) {
  if (SKIP_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return false;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/api")) return false;
  if (PRERENDER_PATHS.some((p) => pathname === p || pathname.startsWith(p))) return true;
  if (PRERENDER_PATTERNS.some((p) => p.test(pathname))) return true;
  if (pathname === "/" || pathname === "") return true;
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const pathname = url.pathname;

    // Redirect www to non-www
    if (url.hostname.startsWith("www.")) {
      const target = new URL(request.url);
      target.hostname = target.hostname.replace(/^www\./, "");
      return Response.redirect(target.toString(), 301);
    }

    // Only prerender for bots on content pages
    if (isBot(ua) && shouldPrerender(pathname)) {
      try {
        const prerenderUrl = `${PRERENDER_URL}?path=${encodeURIComponent(pathname)}`;
        const response = await fetch(prerenderUrl, {
          headers: {
            "Authorization": `Bearer ${ANON_KEY}`,
            "User-Agent": ua,
          },
        });

        if (response.ok) {
          const html = await response.text();
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
              "X-Prerender": "1",
              "X-Robots-Tag": "index, follow",
              "Vary": "User-Agent",
            },
          });
        }
      } catch (e) {
        console.error("Prerender failed:", e);
      }
    }

    // Human visitors or prerender failure → pass through to origin
    // Add performance cache headers for static assets
    const response = await fetch(request);
    
    if (SKIP_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      const newHeaders = new Headers(response.headers);
      if (!newHeaders.has("Cache-Control")) {
        // Cache static assets for 1 year (they have hashed filenames from Vite)
        newHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return response;
  },
};
