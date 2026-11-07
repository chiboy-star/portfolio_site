# Chinemerem Madueke — Developer Portfolio

Personal developer portfolio for **Chinemerem Madueke** (Junior Frontend Developer & Software Engineering Student at Pan-Atlantic University).

Rebuilt with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## ⚡ Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router, React Server Components by default, Incremental Static Regeneration)
- **Styling:** Tailwind CSS v4 with custom CSS variable design tokens and squircle continuous corners
- **UI Components:** shadcn/ui (Radix Primitives, Vaul drawer, Sonner toasts, cmdk)
- **Icons:** `lucide-react` for UI and `@icons-pack/react-simple-icons` for tech logos
- **Theme:** `next-themes` (system, dark, light) with zero layout shift
- **Device Tiers:** Inline tier-detection script (`Full`, `Lite`, `Minimal`) that dynamically gates heavy effects (particles, 3D cylinder carousel, intro)
- **Admin & CMS:** Auth.js v5 (GitHub OAuth allowlist `chiboy-star`), Upstash Redis for overrides, Vercel Blob for CV & thumbnail storage, and Vercel Analytics for privacy-first metrics

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/chiboy-star/portfolio_site.git
cd portfolio_site
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the environment variables:
```env
# Auth.js (NextAuth v5)
AUTH_SECRET=                  # Generate with `openssl rand -base64 32` or `npx auth secret`
AUTH_GITHUB_ID=               # GitHub OAuth App Client ID
AUTH_GITHUB_SECRET=           # GitHub OAuth App Client Secret
ADMIN_GITHUB_LOGIN=chiboy-star

# GitHub API (server-side, public repo read-only)
GITHUB_USERNAME=chiboy-star
GITHUB_TOKEN=                 # Fine-grained personal access token with public_repo read

# Vercel API
VERCEL_TOKEN=                 # Vercel Personal Access Token
VERCEL_TEAM_ID=               # Optional (leave blank if personal account)

# Upstash Redis / Vercel KV (Key-Value Store)
# Supports either Upstash or Vercel KV environment variable pairs:
UPSTASH_REDIS_REST_URL=       # From Upstash Console or Vercel Marketplace
UPSTASH_REDIS_REST_TOKEN=     # From Upstash Console
# OR:
KV_REST_API_URL=              # From Vercel KV Dashboard
KV_REST_API_TOKEN=            # From Vercel KV Dashboard

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=        # From Vercel Project Storage

# Public URL
NEXT_PUBLIC_SITE_URL=https://chinemerem.dev
```

> **Note on Graceful Degradation:** Tokens are read only on the server. If tokens are missing during local development or build, features gracefully degrade to seeded projects and fallback memory storage without failing the build.

### 4. Running Locally
```bash
# Start development server
npm run dev

# Run production build
npm run build

# Start production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

---

## 🛠️ Admin Panel (`/admin`)

Access the management dashboard at `/admin`.
- Protected by Auth.js v5 GitHub login with strict allowlist matching `ADMIN_GITHUB_LOGIN=chiboy-star`.
- **Projects Tab:** Toggle visibility (`Visible` / `Hidden`), feature state (`Featured`), drag/arrow reordering, and inline modal editor.
- **Profile Tab:** Update headline, 60-word bio, contact email, and social links with instant cache invalidation (`revalidateTag`).
- **Links & CV Tab:** Upload PDF resumes directly to Vercel Blob and build campaign-tracked UTM links for recruiter analytics.

---

## 🎨 Design System Principles

- **Dark, Quiet, Typographic:** Geist font family with high-contrast neutral backgrounds (`#0A0A0B` dark, `#FAFAF7` light).
- **One Accent:** Amber (`#F5A524` in dark, `#B45309` in light), used strictly for primary CTA, active navigation underline, and focus rings.
- **Flat Surface Hierarchy:** Single surface cards without nested cards.
- **Device Tiers:**
  - **Minimal Tier:** Triggered when `prefers-reduced-motion: reduce` or `navigator.connection.saveData === true`. Zero canvas animations, plain text typography (`wide-thin` locked), lightweight payload.
  - **Lite Tier (Mobile/Touch/Narrow):** Triggered when `(pointer: coarse)`, hover is unavailable, or viewport width is under 1024px. Native scroll-snap list, swipe-to-dismiss bottom drawers, rotating typographic wordmark.
  - **Full Tier (Desktop):** Fine pointer, hover support, width >= 1024px. Crack-open canvas intro, interactive particle wordmark (~4,000–8,000 dots) or rotating typographic styles, 3D concave cylinder carousel.
  - **Stability & Hydration Safety:** Volatile signals (`effectiveType`, `downlink`, `rtt`, `deviceMemory`, `hardwareConcurrency`) are completely excluded from tier determination. The tier is decided once per load by an inline pre-paint script. Server markup renders identical HTML across tiers, toggling visual layout strictly via CSS (`html[data-tier]`, `html[data-intro]`).
  - **Testing Overrides & Dev Badge:** Append `?tier=full`, `?tier=lite`, or `?tier=minimal` to force a specific tier for that page load. In development mode, a small fixed corner badge indicates the active tier.

---

## 🎬 Crack-Open Intro Overlay (Homage to awards.racing)

The opening banner is an ink/amber slab that cracks open in stepped square Chebyshev rings (pixel staircase):
- **High-Contrast Theme Tokens:**
  - **Light Theme:** Page `--bg` is `#FAFAF7`, slab `--intro-bg` is `#0A0A0B` (solid ink, 18.9:1 contrast), wordmark is off-white (`#EDEDEE`, 16.9:1 contrast) with amber initials (`#F5A524`).
  - **Dark Theme:** Page `--bg` is `#0A0A0B`, slab `--intro-bg` is `#F5A524` (solid amber, 9.7:1 contrast), wordmark is ink (`#0A0A0B`, 9.7:1 contrast) with enlarged ink initials (`1.15em`).
- **Typography:** **Unbounded 900** uppercase, stacked on two lines ("CHINEMEREM" over "MADUEKE"), skewed `-10deg` (`transform: skewX(-10deg)`).
- **Sequence (<= 1.6s):**
  - **0–400ms:** Solid slab and wordmark hold (wordmark scales 1.04 $\to$ 1.0).
  - **400–1300ms:** Chebyshev distance rings expanding from center in 7 steps (90ms/step), creating a pixel staircase opening.
  - **1300–1600ms:** Wordmark lifts -8vh and fades out; overlay is removed from the DOM.
- **Session Rules & Replay:**
  - Played once per session (sets `sessionStorage.introSeen = "true"` on completion).
  - `?intro=1`: Forces replay on load regardless of session storage.
  - `?intro=0`: Forces skip for automated testing or quick navigation.
  - **Replay Intro Command:** Available in the Command Menu (`Ctrl+K` / `Cmd+K` $\to$ "Replay Intro", Full tier only). Replays the sequence in-memory via custom event without reloading the page.
  - **Interplay with Hero Name:** Emits an `intro:done` event upon completion; the rotating hero name waits for this event before animating in so it never animates blindly behind the slab.

---

## 🔀 Rotating Hero Name & Typographic System (9 Modular Styles)

The hero name features an orchestrated rotation system with 9 modular typographic display styles, self-hosted via `next/font/google` (`display: "swap"`, `preload: false`, on-demand transfer):

1. **`wide-thin`**: **Syncopate (400)**. Wide caps, generous letter-spacing tracking. (Static lock for Minimal tier).
2. **`heavy-stacked`**: **Unbounded (900)**. Stacked two-line skewed `-10deg` with amber accent initials.
3. **`marker-scrawl`**: **Permanent Marker (400)**. Letters appear left to right with random $\pm 3^\circ$ tilt, followed by a dynamic SVG scribble underline drawn with `stroke-dashoffset`.
4. **`slice`**: **Anton (400)**. Tall condensed caps cut into 3 horizontal bands with alternating clip-path translation.
5. **`decode`**: **Major Mono Display (400)**. Scrambled matrix glyph decoding stream locking left to right.
6. **`outline-fill`**: **Rubik Mono One (400)**. Outlined text-stroke typography filling with a gradient wipe from left to right.
7. **`weight-sweep`**: **Fraunces (variable)**. Continuous sinusoidal font weight wave (100 $\to$ 900 $\to$ 400) sweeping across individual letters.
8. **`soft-blur`**: **Instrument Serif (italic)**. Quiet, editorial italic serif resolving gently from `blur(8px)` and opacity 0.
9. **`particles`**: **Syncopate sampling mask**. Interactive cursor-repelling canvas dot name (~4,000–8,000 dots, Full tier only, 2x selection weight).

### Selection & Rotation Lifecycle
- **Initial Pick:** On page load, randomly selects a style different from the previous visit (`localStorage` key `last_name_style`). Minimal tier is hard-locked to `wide-thin`.
- **Timer & Rotation:** Periodically transitions between styles every 30–60 seconds.
- **Smart Pause Safeguards:** The rotation timer automatically pauses when:
  - The tab is hidden or backgrounded (`document.visibilityState !== "visible"`).
  - The hero is scrolled out of the viewport (`IntersectionObserver`).
  - The user's pointer hovers over the hero name area.
  - The crack-open intro is actively playing.
- **Font Load Safeguard (1.5s Timeout):** Each style awaits its font (`waitForFont(...)`). If a font fails to load or times out after 1.5 seconds, it falls back cleanly to the Geist sans typography.
- **Zero CLS:** The hero name container is height-locked (`h-[110px] sm:h-[140px] lg:h-[160px]`) with absolute positioning for decorative variations, guaranteeing zero Cumulative Layout Shift during transitions (measured CLS: 0.0003).

---

## 🔤 How to Add or Swap a Name Style Font

1. **Declare the Google Font in [`src/lib/fonts.ts`](file:///c:/Users/chine/Downloads/portfolio_site/src/lib/fonts.ts):**
   ```typescript
   import { Your_Font } from "next/font/google";

   export const fontYourFont = Your_Font({
     weight: "400", // or ["400", "700"]
     subsets: ["latin"],
     display: "swap",
     preload: false, // Ensures font is downloaded on-demand only when style renders
     variable: "--font-your-font",
   });
   ```
2. **Expose the CSS variable in [`src/app/layout.tsx`](file:///c:/Users/chine/Downloads/portfolio_site/src/app/layout.tsx):**
   Add `${fontYourFont.variable}` to `<body>` className.
3. **Register the style ID in [`src/components/name-styles/types.ts`](file:///c:/Users/chine/Downloads/portfolio_site/src/components/name-styles/types.ts)** and [`selector.ts`](file:///c:/Users/chine/Downloads/portfolio_site/src/components/name-styles/selector.ts).
4. **Implement the style component:**
   Use `waitForFont("Your Font", "400")` inside a `useEffect`, apply `fontFamily: "var(--font-your-font), sans-serif"`, and handle `phase: "entering" | "active" | "exiting"`.

---

## 🧪 Testing & Verification

```bash
# Run unit tests (testing name styles selection, pause guards, intro skip logic)
npm test

# Run Playwright automated verification suite (intro light/dark, replay event, all 9 styles, CLS, network on-demand fonts)
node scripts/verify-round4.mjs
```

---

## 📄 License

MIT © [Chinemerem Madueke](https://github.com/chiboy-star).
