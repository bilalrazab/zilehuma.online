# MindFrame Mentality — Dr. Zil-e-Huma

A full-stack mental health practice website and client management platform for Dr. Zil-e-Huma. It combines a fast, SEO-optimized public marketing site with a private doctor dashboard for managing clients, appointments, tasks, resources, messaging, and progress tracking — plus automated email and WhatsApp notifications.

**Live site:** https://zilehuma.online

---

## Features

### Public Website
- Fast, SEO-optimized landing page (hero, about, services, experience, testimonials, FAQ, blog, contact)
- Per-service detail pages (`/services/:slug`)
- Blog with public posts and social sharing
- Public appointment booking flow with real-time doctor availability
- Self-hosted fonts, responsive images (WebP + `<picture>`), lazy-loaded below-fold sections
- Prerender worker (Cloudflare) for SEO/social crawlers

### Doctor Dashboard (private)
- Dashboard home with stats and quick actions
- Client management: invite clients, view client files, delete clients (full cascade cleanup)
- Appointment calendar with approval workflow (pending → approved)
- Session management with end-session summaries
- Task and resource assignment per client
- Progress tracking and mood entries
- Internal messaging
- Settings: weekly availability, profile, notifications

### Client Onboarding Lifecycle
- Invite or website booking → `pending_activation` → set password → `pending_profile` → complete onboarding → `active`
- Clients only appear in the client list after completing onboarding
- Automatic redirect to onboarding for incomplete client profiles

### Notifications & Automation
- Transactional email system (queue + templates) for invites, session confirmations, task/resource assignments
- WhatsApp Business API (Meta Cloud API) notifications on: booking requests, appointment approval, session end, task assignment, resource assignment, client invites
- External booking API endpoint (API-key authenticated) for third-party booking sources
- Email unsubscribe and suppression handling

### Security
- Role-based access control (`super_admin`, `doctor`, `client`) via a dedicated `user_roles` table with a `has_role` security-definer function
- Row Level Security on all tables
- Auth hook for custom transactional auth emails

---

## Technology Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix primitives) |
| Routing | react-router-dom v6 |
| Data | TanStack Query |
| Backend | Lovable Cloud (Supabase): Postgres, Auth, RLS, Edge Functions (Deno) |
| Email | Custom transactional email edge functions + queue |
| WhatsApp | Meta WhatsApp Business Cloud API |
| SEO | react-helmet-async, sitemap function, Cloudflare prerender worker |
| Testing | Vitest + jsdom |

---

## Project Structure

```text
├── index.html                  # Entry HTML (inlined fonts, meta/OG tags, splash screen)
├── src/
│   ├── main.tsx                # React bootstrap
│   ├── App.tsx                 # Root router (public homepage eager, rest lazy)
│   ├── AuthenticatedApp.tsx    # Lazy bundle: auth, dashboard, blog, booking routes
│   ├── index.css               # Design tokens (semantic colors, fonts)
│   ├── components/             # Public site sections (Hero, About, Services, FAQ, ...)
│   │   ├── dashboard/          # Dashboard sidebar/nav/cards
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/AuthContext.tsx# Auth session, role, profile loading
│   ├── layouts/DashboardLayout.tsx
│   ├── pages/                  # Public pages (Blog, BookPage, Login, Signup, ...)
│   │   └── dashboard/          # Dashboard pages (Clients, Calendar, Tasks, ...)
│   ├── lib/                    # blogStorage, testimonialStorage, clientProfile helpers
│   └── integrations/supabase/  # Auto-generated client + types (do not edit)
├── supabase/
│   └── functions/              # Edge functions (Deno)
│       ├── invite-client/      # Client invitation (email + WhatsApp)
│       ├── delete-client/      # Full client cascade deletion
│       ├── send-whatsapp-notification/
│       ├── external-booking/   # API-key authenticated booking endpoint
│       ├── send-transactional-email/, process-email-queue/
│       ├── auth-email-hook/    # Custom auth emails
│       ├── handle-email-unsubscribe/, handle-email-suppression/
│       ├── google-calendar-sync/, sitemap/, prerender/, seed-users/
│       └── _shared/            # Email templates (React Email)
├── worker/index.js             # Cloudflare prerender worker (SEO crawlers)
├── public/                     # Static assets (images, fonts, robots.txt, sitemap.xml)
└── vercel.json                 # Cache headers + SPA rewrites (if deployed to Vercel)
```

### Architecture Overview
- **Code splitting:** The public homepage loads a minimal critical bundle (~73KB JS). Everything authenticated (Supabase client, Radix, TanStack Query, dashboard) is lazy-loaded via `AuthenticatedApp`.
- **Lazy sections:** Below-fold homepage sections render via `LazyVisible` (IntersectionObserver) to keep initial JS small.
- **Backend:** All server logic lives in Supabase Edge Functions. The frontend talks to Postgres via the Supabase JS client with RLS enforcing access.
- **Roles:** Stored in `user_roles` (never on profiles); checked via the `has_role` security-definer function.

---

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- A Supabase project (or Lovable Cloud backend)

### Installation

```sh
git clone <YOUR_GIT_URL>
cd <PROJECT_NAME>
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
```

**Edge function secrets** (set via `supabase secrets set` or the Lovable Cloud UI):

| Secret | Purpose |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Business phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta WhatsApp Business account ID |
| `WHATSAPP_ACCESS_TOKEN` | Meta permanent access token |
| `EXTERNAL_BOOKING_API_KEY` | API key for the external-booking endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided to edge functions |

### Run Locally

```sh
npm run dev        # Dev server on http://localhost:8080
npm run build      # Production build
npm run test       # Vitest
```

### Deploy Edge Functions

```sh
supabase functions deploy invite-client delete-client send-whatsapp-notification \
  external-booking send-transactional-email process-email-queue auth-email-hook
```

---

## Routes

### Public
| Route | Page |
|---|---|
| `/` | Landing page |
| `/blog`, `/blog/:id` | Blog list & post |
| `/services/:slug` | Service detail |
| `/book-appointment` | Public booking |
| `/privacy-policy` | Privacy policy |
| `/login`, `/signup`, `/reset-password` | Auth |
| `/unsubscribe` | Email unsubscribe |

### Authenticated
| Route | Page |
|---|---|
| `/blog/new`, `/testimonial/new` | Content creation |
| `/dashboard` | Dashboard home |
| `/dashboard/clients`, `/dashboard/clients/:id` | Client list & file |
| `/dashboard/calendar` | Appointments |
| `/dashboard/sessions` | Sessions |
| `/dashboard/tasks` | Tasks |
| `/dashboard/progress` | Client progress |
| `/dashboard/messages` | Messaging |
| `/dashboard/resources` | Resources |
| `/dashboard/settings` | Settings & availability |
| `/dashboard/onboarding` | Client onboarding |

---

## Known Limitations

- **WhatsApp test mode:** Until the Meta app is approved for production, WhatsApp messages can only be sent to numbers added to the allowed list in the Meta Developer Console.
- **WhatsApp templates:** Business-initiated messages outside a 24h window require Meta-approved message templates; plain text only works within an open conversation window.
- **Invite links:** Auth invite/reset links expire per Supabase auth settings (default 1h; configurable up to 24h in auth settings).
- **Single doctor:** The booking system assumes one doctor (first `doctor` role found).
- **Unused CSS:** Tailwind ships some unused utility classes for shadcn components (~12KB) — framework limitation.

## Future Improvements

- Client self-service portal (view own appointments, resources, progress)
- Meta WhatsApp production approval + approved message templates
- Google Calendar two-way sync (function scaffolded)
- Automated session reminders (cron-triggered edge function)
- WhatsApp message history/logging in the dashboard
- Multi-doctor support

---

## Deployment

The site is deployed via Lovable (Publish button) with a custom domain (`zilehuma.online`). Backend changes (edge functions, migrations) deploy immediately; frontend changes require clicking **Update** in the publish dialog. A Cloudflare worker (`worker/index.js`) prerenders pages for SEO crawlers.
