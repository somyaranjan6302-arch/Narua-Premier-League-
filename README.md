# Narua Premier League (NPL) - Official T20 Cricket Tournament Website

Established Since 2024 • "Where Local Cricket Becomes History."

This project is a broadcast-grade sports tournament web platform for **Narua Premier League (NPL)** built with **React**, **Vite**, **Tailwind CSS v4**, and **Lucide React**.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

   On the first start, the server prints a randomly generated developer admin password in the terminal. Save it securely; it is shown only once. The developer account ID is `developer`. The developer can create additional admin accounts from the Admin Portal's **Admin Accounts** tab.

3. **Build for Production:**
   ```bash
   npm run build
   ```

## Production Database and Deployment

The production server uses Supabase Postgres for admin accounts, the session signing key, shared site content, private auction registrations, and newly uploaded media. The public website reads shared content from the server, so admin edits are visible to all visitors. Auction registrant details are only returned to authenticated admins. Local development continues to use the ignored `server/data/` files for admin credentials and local media uploads.

This repository includes a `render.yaml` Blueprint for a free Render web service. First create a Supabase Free project and copy its **Session pooler** PostgreSQL connection string from the Supabase Connect panel. Render uses IPv4, so the Supabase session pooler works without a paid IPv4 add-on. Then connect this GitHub repository in Render and create a Blueprint from the repo. Render will request `DATABASE_URL` and `NPL_INITIAL_OWNER_PASSWORD`; enter the Supabase connection string and a unique password of at least 16 characters in Render's secret fields. The initial owner account ID is `developer`.

Both services use free plans. Supabase Free includes 500 MB of database space and may pause a project after a week of low activity; Render's free web service spins down after 15 minutes without traffic and can take about a minute to wake. Supabase Free does not include downloadable database backups. Keep a separate backup of important tournament data and images. Review the current [Supabase limits](https://supabase.com/pricing) and [Render free-service limits](https://render.com/docs/free) before launch.

The server refuses to start in production without `DATABASE_URL`. The database schema is created automatically at startup. If shared content has not been initialized yet, the first owner sign-in saves that browser's current public content as the initial shared snapshot. Browser storage is scoped to its origin, so edits made at `localhost` do not automatically appear on the Render URL. Public registrations are saved directly to Postgres; the owner portal loads those records privately. Tracked files already under `public/uploads/` remain available as static assets, while future Owner Media uploads are stored in Postgres so they survive deploys.

### Deploy the website and API on Cloudflare Pages

Cloudflare Pages serves the Vite website and `functions/api/[[path]].js` implements the existing `/api/*` routes directly. It connects to the existing Supabase project through its HTTPS Data API; it does not proxy to Render. The original Express backend in `server/` and `render.yaml` remain in the repository for local development or a future Render restart. Local development still runs `npm run dev` and uses that Express backend.

#### Static image-only deployment (no database)

To preview the public site and repository-hosted images without Supabase, connect the repository to Cloudflare Pages and use `npm run build` with `dist` as the output directory. Leave the Supabase variables unset. The public site uses its bundled default content, `public/site-media.json`, and images under `public/uploads/`. The Admin Portal, registrations, shared edits, and live database features will not work in this mode. To publish local image uploads, commit and push both the image files and `public/site-media.json`.

The build command also generates JavaScript modules from the bundled JSON data files so Cloudflare Pages Functions can bundle the static fallback and historical season data.

Before deploying:

1. Keep the Supabase project and its existing database. In the Supabase SQL Editor, run [`supabase/cloudflare-api.sql`](./supabase/cloudflare-api.sql). The script is safe to rerun, preserves existing tournament data, grants the Cloudflare service role the needed table access, and adds database functions for atomic auction updates, image writes, registration writes, and rate limiting.
2. In Supabase, copy the **Project URL** and the server-only **service_role** API key. Never use the `anon` key for this backend, and never put the service-role key in a `VITE_` variable or browser code.
3. In Cloudflare, create a Pages project connected to this GitHub repository. Use the repository root, build command `npm run build`, and output directory `dist`.
4. In the Pages project **Settings → Variables and Secrets**, add these runtime variables/secrets for Production (and Preview if you use preview deployments):
   - `SUPABASE_URL` — the Supabase Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the Supabase server-only service-role key; mark it as a secret.
   - `NPL_OWNER_EMAIL` — the email address to use for the `developer` owner in Supabase Auth.
   - `NPL_INITIAL_OWNER_PASSWORD` — choose a new unique password of at least 16 characters for the `developer` owner account; store it as a secret.
5. Deploy the Pages project and verify the public site, `/api/site-data`, registration flow, admin login, live auction, and owner media uploads.

The Cloudflare API preserves the database records and admin account IDs/roles, but uses Supabase Auth for password verification rather than doing password hashing in a Cloudflare Function. The owner signs in as `developer` using `NPL_INITIAL_OWNER_PASSWORD`; on first sign-in, the API links that account to `NPL_OWNER_EMAIL` in Supabase Auth. Existing admin accounts keep their IDs and roles, but the owner must assign each admin an email and a new password in **Admin Members** before that admin can sign in. The app's sign-in form still accepts the admin ID and password. Supabase Auth stores the active email/password credentials and the app database stores each admin's Supabase Auth user link. Existing legacy password hashes are left untouched so the Render backend can continue using them; the Cloudflare API does not verify those old hashes. Tournament data and registration records are not changed.

The Render URL is not a secret and does not belong in `.gitignore`. `.gitignore` excludes only local Cloudflare `.dev.vars` files so you can keep development credentials out of Git. Keep the existing Render API source tracked; the Cloudflare Pages Function is a separate implementation and does not alter local behavior.

## Features

- **Broadcast Live Score Ticker:** Sticky strip across top of viewport with real-time match status.
- **Cinematic Stadium Hero:** Floodlit stadium visual with animated counters (Teams, Seasons, Champions, Matches).
- **The Story of NPL:** Narrative & milestone timeline (2024, 2025, 2026).
- **NPL Champions Showcase:** Previous winners carousel (NSK, RCN) with scorecards and trophy visual.
- **Tournament History:** Archive with team counts, matches, Orange Cap, Purple Cap, and MVP.
- **NPL Match Center:** Live scores with commentary, upcoming countdown timers, and completed scorecards.
- **Points Table:** Standings with top 4 playoff qualification indicators and recent form guide.
- **8 Franchise Clubs:** Detailed team cards and full squad modal with player stats.
- **Player Roster:** Search by name/team and filter by Batters, Bowlers, All-rounders, and Keepers.
- **Top Performers & Records:** Orange Cap, Purple Cap, Max Sixes, Best Bowling, and All-Time Records.
- **Photo Gallery & Video Highlights:** Masonry gallery with fullscreen lightbox and broadcast video player.
- **Auction Registration:** Public registration form that generates an official digital **NPL Player Pass** with ID & QR code.
- **Live Auction Arena Simulator:** Interactive bidding simulator with team paddles, audio gavel strike, confetti, and purse tracking.
- **Organizer Admin Console:** Server-authenticated admin portal with a developer owner account, owner-managed admin accounts, salted password hashes, and HTTP-only sessions.
- **Developer Media Library:** The owner-only Admin Portal tab can replace the public logo, stadium and trophy art, champion/team photos, news images, gallery photos, highlight thumbnails, and top-performer portraits. Production uploads are stored in Postgres; local development uploads use `public/`.

In production, Postgres stores the password hashes and signing key; keep the Render database and its backups private. For local development, `server/data/` remains excluded from Git. Do not commit `.env` files or admin credentials.
