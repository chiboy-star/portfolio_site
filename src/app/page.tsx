import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingContact } from "@/components/floating-contact";
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
        <section id="hero" className="mx-auto max-w-[1120px] px-4 py-24 sm:px-6 lg:px-8">
          <p className="caption-mono text-[var(--muted)] mb-4">{profile.headline}</p>
          <h1 className="text-4xl font-light tracking-tight text-[var(--fg)]">
            Chinemerem Madueke
          </h1>
          <p className="mt-4 text-[var(--muted)] max-w-2xl">{profile.bio}</p>
        </section>

        <section id="work" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Work</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                id={`project-${project.id}`}
                className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-3 mb-4">{project.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs text-[var(--muted)] font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
