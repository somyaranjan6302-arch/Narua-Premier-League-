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

### Deploy the website and API on Cloudflare Pages with D1

Cloudflare Pages serves the Vite website, `functions/api/[[path]].js` implements the `/api/*` routes, and the `DB` binding stores shared site content, admin accounts, auction registrations, live auctions, and uploaded images in Cloudflare D1. Cloudflare Workers handle password hashing and signed admin sessions; no Supabase account or API keys are needed. The Express server and Render deployment remain available separately. `npm run dev` starts that local Express server; `npm run dev:cloudflare` runs the Pages Functions against a local D1 database.

#### Run the Cloudflare version locally

1. Install dependencies with `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and change `NPL_INITIAL_OWNER_PASSWORD` to a unique password of at least 16 characters. The ignored `.dev.vars` file is never committed.
3. In a terminal at the project root, run `npm run dev:cloudflare` and open the local URL Wrangler prints. The script builds the site, applies D1 migrations to the local database, and starts the Pages Functions.
4. Sign in to the Admin Portal using admin ID `developer` and the password from `.dev.vars`.

The local Cloudflare database is separate from the Express server's local data and from the Cloudflare production database. Use `npm run dev` if you want to keep using the existing Express setup.

#### Create and deploy the Cloudflare D1 database

1. Install dependencies and authenticate the Wrangler CLI with `npx wrangler login`.
2. Create the production database with `npx wrangler d1 create npl`. Copy the returned database ID into `database_id` in [`wrangler.toml`](./wrangler.toml), replacing the placeholder ID.
3. Apply the database schema with `npm run db:migrate:remote`.
4. Create a Cloudflare Pages project, if you do not already have one: `npx wrangler pages project create narua-premier-league`. Select your production Git branch when prompted.
5. Add a unique owner password to Pages secrets: `npx wrangler pages secret put NPL_INITIAL_OWNER_PASSWORD`. Use at least 16 characters and keep the value private.
6. Deploy with `npm run deploy:cloudflare`. Alternatively, connect the repository to Cloudflare Pages and set the root directory to the project root, build command to `npm run build`, and output directory to `dist`. Keep `wrangler.toml` in the root so Pages can bind the D1 database.

The first successful sign-in with admin ID `developer` creates the owner account in D1 using the configured initial password. Admins created through **Admin Accounts** can sign in with their admin ID and password. Existing tracked images under `public/uploads/` remain static assets; new admin image uploads are stored in D1 in chunks to stay within database row limits. Keep an independent backup of tournament data and uploaded media.

The build command also generates JavaScript modules from the bundled JSON data files so Cloudflare Pages Functions can bundle the static fallback and historical season data.

The Render URL is not a secret and does not belong in `.gitignore`. Keep the existing Render API source tracked; the Cloudflare Pages Function is a separate implementation and does not alter local behavior.

### Build the Android APK

The Android app uses Capacitor to open the live Cloudflare Pages website, so the existing D1-backed APIs and admin sign-in continue to use the website's origin. The APK contains only a small local connection screen; site pages and images load online, so the app requires an internet connection and is not an offline copy of the site.

1. Install Android Studio and its Android SDK, plus a supported JDK (JDK 21).
2. Install project dependencies with `npm install`.
3. Generate the Android project once with `npx cap add android`.
4. Build a debug APK with `npm run android:apk`. The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
5. To install it on a connected Android device with USB debugging enabled, run `cd android` then `gradlew installDebug`. You can also open the native project with `npm run android:open` and build it in Android Studio.

The app's website address is configured in `capacitor.config.json`. Update `server.url` and its `allowNavigation` host if the production website moves to a different domain. A release APK for distribution must be signed with a release key; the debug APK is intended for testing.

#### Preview and publish a new app logo yourself

1. Make sure Node.js, the project dependencies, JDK 21, the Android SDK, and Wrangler login are set up as described above.
2. From the project folder, run `npm run app-icon:studio` and open `http://127.0.0.1:4179` in your browser.
3. Choose one or more logo photos. Click each thumbnail to preview it as an Android launcher icon. Adjust the logo size, background color, and optional dark-background removal until the previews look right.
4. Only after approving a preview, click **Build APK and publish**. The local tool updates the icon assets, builds the Android APK outside OneDrive, and deploys the site with the new APK and favicon. Keep the tool's terminal open until it reports success.
5. Download the updated APK from the link the tool displays and install it on Android to update the launcher icon. The installed icon changes only after installing the new APK.

The studio binds only to `127.0.0.1`; selected images are processed on your computer and are not uploaded to a separate image service. Publishing is an explicit action because it deploys the selected icon and APK to production.

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
