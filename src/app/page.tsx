import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingContact } from "@/components/floating-contact";

export default function Home() {
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
          <p className="caption-mono text-[var(--muted)] mb-4">Foundation Test</p>
          <h1 className="text-4xl font-light tracking-tight text-[var(--fg)]">
            Chinemerem Madueke
          </h1>
        </section>

        <section id="work" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-semibold tracking-tight">Work</h2>
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
      <Footer />
    </div>
  );
}
