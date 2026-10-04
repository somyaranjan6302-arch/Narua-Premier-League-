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

The production server uses Render Postgres for admin accounts, the session signing key, shared site content, private auction registrations, and newly uploaded media. The public website reads shared content from the server, so admin edits are visible to all visitors. Auction registrant details are only returned to authenticated admins. Local development continues to use the ignored `server/data/` files for admin credentials and local media uploads.

This repository includes a `render.yaml` Blueprint. To deploy it, connect this GitHub repository in Render and create a Blueprint from the repo. Render will request `NPL_INITIAL_OWNER_PASSWORD`; set a unique password of at least 16 characters and save it securely. The initial owner account ID is `developer`.

The Blueprint uses a free web service and a small paid PostgreSQL plan (`0.1c-256mb`, currently $6 USD/month). The database is persistent; the free web service may spin down after inactivity. Review the current Render plan and billing details in the Render dashboard before creating the Blueprint resources. A Render Free Postgres database is not used because it expires after 30 days.

The server refuses to start in production without `DATABASE_URL`. The database schema is created automatically at startup. If shared content has not been initialized yet, the first owner sign-in saves that browser's current public content as the initial shared snapshot. Browser storage is scoped to its origin, so edits made at `localhost` do not automatically appear on the Render URL. Public registrations are saved directly to Postgres; the owner portal loads those records privately. Tracked files already under `public/uploads/` remain available as static assets, while future Owner Media uploads are stored in Postgres so they survive deploys.

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
