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

## 🔀 Rotating Hero Name & Typographic Fallback System

The hero name features an orchestrated rotation system with 8 modular typographic styles:

1. **`wide-thin`**: Extreme letter-spacing tracking animation with clean minimalist font-weight. (Default fallback for Minimal tier).
2. **`heavy-stacked`**: Stacked two-line Geist 800 with `-10deg` skew and accent initials ("CHINEMEREM" over "MADUEKE", awards.racing homage).
3. **`letter-rise`**: Staggered baseline reveal per glyph with subtle bounce.
4. **`slice`**: Horizontal 3-band staggered clip-path offset.
5. **`decode`**: Scrambled matrix glyph decoding into the final name.
6. **`outline-fill`**: Crisp text stroke with dynamic gradient filling.
7. **`weight-sweep`**: Sinusoidal variable font-weight wave running across individual letters (100 -> 800 -> 300).
8. **`particles`**: Interactive cursor-repelling canvas particles (~4,000–8,000 dots, Full tier only, 2x selection weight).

### Selection & Rotation Lifecycle
- **Initial Pick:** On page load, randomly selects a style different from the previous visit (`localStorage` key `cm_last_name_style`). Minimal tier is hard-locked to `wide-thin`.
- **Timer & Rotation:** Periodically transitions between styles every 30–60 seconds.
- **Smart Pause Safeguards:** The rotation timer automatically pauses when:
  - The tab is hidden or backgrounded (`document.visibilityState !== "visible"`).
  - The hero is scrolled out of the viewport (`IntersectionObserver`).
  - The user's pointer hovers over the hero name area.
- **Particle Safeguard (1.5s Timeout):** If the particle canvas fails to draw its initial frame within 1.5 seconds (due to font load delays or canvas initialization failure), it automatically triggers a graceful exit and falls back to another rotating typographic style.
- **Zero CLS:** The hero name container is height-locked (`h-[110px] sm:h-[140px] lg:h-[160px]`) with absolute positioning for decorative variations, guaranteeing zero Cumulative Layout Shift during transitions.

---

## 🧪 Testing & Verification

```bash
# Run unit tests (testing name styles selection, pause guards, and store logic)
npm test

# Run Playwright automated verification suite (hydration across 5 scenarios, CLS, reload stability, particle render)
node scripts/verify-round3.mjs
```

---

## 📄 License

MIT © [Chinemerem Madueke](https://github.com/chiboy-star).
