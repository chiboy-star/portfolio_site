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

# Upstash Redis
UPSTASH_REDIS_REST_URL=       # From Upstash Console or Vercel Marketplace
UPSTASH_REDIS_REST_TOKEN=     # From Upstash Console

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
  - **Full Tier (Desktop):** Crack-open canvas intro, interactive particle wordmark with rAF settle detection, 3D concave cylinder carousel.
  - **Lite Tier (Mobile/Touch):** Native scroll-snap list, swipe-to-dismiss bottom drawers, static wordmark.
  - **Minimal Tier (Reduced Motion / Data Saver):** Zero canvas animations, plain text typography, lightweight payload.

---

## 📄 License

MIT © [Chinemerem Madueke](https://github.com/chiboy-star).
