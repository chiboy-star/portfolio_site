import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ShieldAlert } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Sign In | Chinemerem Madueke",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--fg)]">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--border)]/40 text-[var(--accent)] mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Authentication</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Restricted to portfolio owner (chiboy-star).
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/admin" });
          }}
        >
          <Button
            type="submit"
            className="w-full gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
          >
            <SiGithub className="h-4 w-4" />
            <span>Continue with GitHub</span>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            ← Return to portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
