SUBMARINE — LIVE BACKEND CONNECTED

Supabase project: https://xsziqfquzjbhhyjljiri.supabase.co
Project ref: xsziqfquzjbhhyjljiri
Browser key: publishable key only (safe with RLS; no service_role key included).

Open index.html for Store and dashboard.html for Dashboard.
Serve from a static host (GitHub Pages, Netlify, Cloudflare Pages) or local web server.
Internet required: Supabase JS SDK is loaded from esm.sh.

Already applied to Supabase:
- profiles, apps, submissions, reviews, favorites, moderation_actions, audit_logs
- RLS enabled on every public table
- profile creation trigger, app rating trigger
- private storage bucket submarine-files and upload policies
- staff-only moderation/audit policies

IMPORTANT ONE-TIME SETUP:
1) Supabase Dashboard > API Settings: add public schema to Data API exposed schemas if it is not already exposed. Supabase's current default for new tables is not to expose them automatically.
2) Register your own account through Store.
3) Open SQL Editor, replace YOUR_EMAIL@example.com in OWNER_SETUP.sql with the same email and run it. This grants owner role to that account.
4) Dashboard login then works. Do not grant owner/admin role to public users.
5) Configure Auth > URL Configuration with your final website URL and redirect URLs.

Prototype scope/limitations:
- The UI is wired to the live database for catalog, auth, submissions, review queue, app visibility/blocking, user mute/ban, and audit logging.
- File upload UI, email verification, signed download counters, automated expiry for mutes, production malware scanning, legal review, rate limiting, and a server-side approval transaction still need deployment/hardening.
- Never put service_role/secret keys into browser code.
