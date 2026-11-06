import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingContact } from "@/components/floating-contact";
import { HeroSection } from "@/components/hero-section";
import { WorkSection } from "@/components/work-section";
import { SkillsSection } from "@/components/skills-section";
import { AboutSection } from "@/components/about-section";
import { ContactSection } from "@/components/contact-section";
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

        <SkillsSection />

        <AboutSection />

        <ContactSection
          email={profile.email}
          github={profile.github}
          linkedin={profile.linkedin}
          cvUrl={profile.cvUrl}
        />
      </main>

      <FloatingContact />
      <Footer updatedAt={profile.updatedAt} />
    </div>
  );
}
