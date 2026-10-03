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

3. **Share Uploaded Images:**
   The Admin Portal's **OWNER MEDIA** uploads are saved in `public/uploads/`, with their image-slot mapping in `public/site-media.json`. Content-image slots support separate images per session; the NPL logo, stadium background, and main trophy image are shared across sessions. These files are part of the repository. After uploading or replacing photos, share them with other clones by committing and pushing:

   ```bash
   git add public/uploads public/site-media.json
   git commit -m "Share uploaded NPL media"
   git push
   ```

   The server copies legacy images from `server/data/uploads/` into `public/uploads/` at startup when possible. Check the copied files and `public/site-media.json`, then commit and push them. Admin credentials and session keys remain in the ignored `server/data/` folder and must not be committed.

4. **Build for Production:**
   ```bash
   npm run build
   ```

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
- **Developer Media Library:** The owner-only Admin Portal tab can replace the public logo, stadium and trophy art, champion/team photos, news images, gallery photos, highlight thumbnails, and top-performer portraits. Uploaded images are stored under `public/` so they can be versioned and shared with Git.

Admin account hashes and the session signing key are stored under `server/data/`, which is excluded from Git. Back up this directory securely for deployments using local file storage. Production deployments must use HTTPS and persistent private storage for `server/data/`; deleting it will generate a new developer password and invalidate all existing accounts.
