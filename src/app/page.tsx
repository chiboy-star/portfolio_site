import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingContact } from "@/components/floating-contact";
import { HeroSection } from "@/components/hero-section";
import { WorkSection } from "@/components/work-section";
import { getPublicProjects } from "@/lib/projects";
import { getProfile } from "@/lib/store";

export const revalidate = 3600;

export default async function Home() {
  const [projects, profile] = await Promise.all([
    getPublicProjects(),
    getProfile(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] selection:bg-[var(--accent)] selection:text-[var(--accent-fg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-lg"
      >
        Skip to content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <HeroSection
          headline={profile.headline}
          bio={profile.bio}
          status={profile.status}
        />

        <WorkSection initialProjects={projects} />

        <section id="skills" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-semibold tracking-tight">Skills</h2>
        </section>

        <section id="about" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-semibold tracking-tight">About</h2>
        </section>

        <section id="contact" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
        </section>
      </main>

      <FloatingContact />
      <Footer updatedAt={profile.updatedAt} />
    </div>
  );
}
