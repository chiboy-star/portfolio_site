"use client";

import * as React from "react";
import { Project, Profile } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  FileDown,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [version, setVersion] = React.useState<number>(1);
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "visible" | "hidden">("all");
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);
  const [connections, setConnections] = React.useState<Record<string, { connected: boolean; message: string; missingVar?: string; hasToken?: boolean; storeType?: string }> | null>(null);
  const [showImportBanner, setShowImportBanner] = React.useState(true);

  // Tracked Link Builder state
  const [utmSource, setUtmSource] = React.useState("cv");
  const [utmMedium, setUtmMedium] = React.useState("pdf");
  const [utmCampaign, setUtmCampaign] = React.useState("recruiter_2026");
  const [copiedLink, setCopiedLink] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fetch initial admin data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, profRes, connRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/profile"),
        fetch("/api/admin/connections"),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        setVersion(pData.version || 1);
      }
      if (profRes.ok) {
        const prData = await profRes.json();
        setProfile(prData);
      }
      if (connRes.ok) {
        const cData = await connRes.json();
        setConnections(cData);
      }
    } catch {
      toast.error("Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcuts (/ to search, S to save)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        saveAllProjects();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Save projects with version checking and Idempotency-Key
  const saveAllProjects = async () => {
    const toastId = toast.loading("Saving changes...");
    const overrides: Record<string, Partial<Project>> = {};
    projects.forEach((p, idx) => {
      overrides[p.id] = {
        title: p.title,
        description: p.description,
        tags: p.tags,
        repoUrl: p.repoUrl,
        liveUrl: p.liveUrl,
        visible: p.visible,
        featured: p.featured,
        order: idx,
        source: p.source,
      };
    });

    const idempotencyKey = `save-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ overrides, version }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          toast.error("Save conflict: Stale data. Refreshing...", { id: toastId });
          fetchData();
          return;
        }
        throw new Error(data.error || "Save failed");
      }

      const data = await res.json();
      setVersion(data.version);
      toast.success("Projects successfully persisted and published!", { id: toastId });
    } catch {
      toast.error("Failed to save projects to cloud storage.", { id: toastId });
    }
  };

  // Optimistic Toggle with Undo Toast
  const toggleVisibility = (id: string) => {
    const prevProjects = [...projects];
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const nextState = !target.visible;
    setProjects((curr) =>
      curr.map((p) => (p.id === id ? { ...p, visible: nextState } : p))
    );

    toast.info(`${target.title} is now ${nextState ? "visible" : "hidden"}.`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          setProjects(prevProjects);
          toast.success("Change reversed.");
        },
      },
    });
  };

  const toggleFeatured = (id: string) => {
    const prevProjects = [...projects];
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const nextState = !target.featured;
    setProjects((curr) =>
      curr.map((p) => (p.id === id ? { ...p, featured: nextState } : p))
    );

    toast.info(`${target.title} featured status updated.`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          setProjects(prevProjects);
        },
      },
    });
  };

  // Reorder projects
  const moveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const prevProjects = [...projects];
    const updated = [...projects];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setProjects(updated);

    toast.info("Order changed", {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => setProjects(prevProjects),
      },
    });
  };

  // Save single edited project
  const saveEditedProject = () => {
    if (!editingProject) return;
    setProjects((curr) =>
      curr.map((p) => (p.id === editingProject.id ? editingProject : p))
    );
    setEditingProject(null);
    toast.success("Project updated locally. Click Save to publish.");
  };

  // Save Profile tab
  const saveProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const toastId = toast.loading("Updating profile...");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile saved and cache revalidated!", { id: toastId });
    } catch {
      toast.error("Error saving profile.", { id: toastId });
    }
  };

  // CV Upload handler
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading CV to Vercel Blob...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (profile) {
        setProfile({ ...profile, cvUrl: data.url });
      }
      toast.success("CV uploaded successfully!", { id: toastId });
    } catch {
      toast.error("Failed to upload CV.", { id: toastId });
    }
  };

  // Filtered projects list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "visible") return p.visible;
    if (filterType === "hidden") return !p.visible;
    return true;
  });

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://chinemerem.dev";
  const trackedUrl = `${siteUrl}?utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;

  const copyTrackedLink = () => {
    navigator.clipboard.writeText(trackedUrl);
    setCopiedLink(true);
    toast.success("Tracked link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)] mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="caption-mono text-xs text-[var(--accent)]">[Admin Panel]</span>
              <span className="text-xs font-mono text-[var(--muted)]">v.{version}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight mt-1">
              Portfolio Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 border-[var(--border)]"
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span>Live Site</span>
              </a>
            </Button>

            <Button
              onClick={saveAllProjects}
              size="sm"
              className="gap-2 bg-[var(--accent)] text-[var(--accent-fg)] font-semibold shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Save &amp; Publish (S)</span>
            </Button>
          </div>
        </header>

        {/* Connections Diagnostic Panel */}
        {connections && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2">
              <span className="caption-mono text-xs text-[var(--accent)] font-semibold">
                Connections Diagnostic
              </span>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                Store: {connections.redis?.storeType === "redis" ? "Upstash Redis" : "File (data/projects.config.json)"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* GitHub */}
              <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">GitHub API</span>
                  {connections.github?.connected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <AlertCircle className="h-3 w-3" /> PUBLIC
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{connections.github?.message}</p>
              </div>

              {/* Vercel */}
              <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Vercel API</span>
                  {connections.vercel?.connected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <AlertCircle className="h-3 w-3" /> MISSING VAR
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{connections.vercel?.message}</p>
              </div>

              {/* Storage */}
              <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Data Store</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> {connections.redis?.storeType === "redis" ? "REDIS" : "FILE FALLBACK"}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{connections.redis?.message}</p>
              </div>

              {/* Blob */}
              <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Vercel Blob</span>
                  {connections.blob?.connected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <AlertCircle className="h-3 w-3" /> LOCAL FALLBACK
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{connections.blob?.message}</p>
              </div>

              {/* Auth */}
              <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Auth.js (v5)</span>
                  {connections.auth?.connected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> OAUTH ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <AlertCircle className="h-3 w-3" /> DEV BYPASS
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{connections.auth?.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* First-Run Import Banner */}
        {showImportBanner && projects.filter((p) => p.source === "github" && !p.visible).length > 0 && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--accent)]/40 bg-[var(--surface)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Sparkles className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--fg)]">
                  {projects.filter((p) => p.source === "github" && !p.visible).length} new GitHub repositories found
                </h4>
                <p className="text-xs text-[var(--muted)]">
                  Newly discovered repositories start hidden by default. Review and choose what to display on your portfolio.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterType("hidden")}
                className="text-xs border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                Review Repos
              </Button>
              <button
                onClick={() => setShowImportBanner(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--fg)] px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projects &amp; Repos</TabsTrigger>
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="links">Links &amp; CV</TabsTrigger>
          </TabsList>

          {/* TAB 1: PROJECTS */}
          <TabsContent value="projects" className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--surface)] p-4 rounded-[var(--radius-card)] border border-[var(--border)]">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects or tags... (/)"
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-[var(--muted)]">Show:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "visible" | "hidden")}
                  className="h-9 px-3 text-xs rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] outline-none"
                >
                  <option value="all">All Projects</option>
                  <option value="visible">Visible Only</option>
                  <option value="hidden">Hidden Only</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmResetOpen(true)}
                  className="text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>

            {/* Projects List Table */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)] text-[var(--muted)] text-sm">
                No projects found matching filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]/80 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveProject(index, "up")}
                          disabled={index === 0}
                          aria-label="Move project up"
                          type="button"
                          className="h-6 w-6 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[var(--border)]/40 disabled:opacity-20"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveProject(index, "down")}
                          disabled={index === filteredProjects.length - 1}
                          aria-label="Move project down"
                          type="button"
                          className="h-6 w-6 flex items-center justify-center rounded border border-[var(--border)] hover:bg-[var(--border)]/40 disabled:opacity-20"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[var(--fg)]">
                            {project.title}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] uppercase">
                            {project.source}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5 max-w-lg">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      {/* Visible Switch */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted)]">Visible</span>
                        <Switch
                          checked={project.visible}
                          onCheckedChange={() => toggleVisibility(project.id)}
                        />
                      </div>

                      {/* Featured Switch */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted)]">Featured</span>
                        <Switch
                          checked={project.featured}
                          onCheckedChange={() => toggleFeatured(project.id)}
                        />
                      </div>

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProject({ ...project })}
                        className="h-8 gap-1 border-[var(--border)]"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PROFILE */}
          <TabsContent value="profile">
            {profile ? (
              <form
                onSubmit={saveProfileData}
                className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] space-y-6"
              >
                <div>
                  <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                    Headline
                  </label>
                  <Input
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  />
                </div>

                <div>
                  <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                    Biography (60 words max)
                  </label>
                  <Textarea
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                      Email Address
                    </label>
                    <Input
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                      Availability Status
                    </label>
                    <Input
                      value={profile.status}
                      onChange={(e) => setProfile({ ...profile, status: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                      GitHub URL
                    </label>
                    <Input
                      value={profile.github}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="caption-mono text-xs text-[var(--muted)] block mb-2">
                      LinkedIn URL
                    </label>
                    <Input
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                  >
                    Save Profile
                  </Button>
                </div>
              </form>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </TabsContent>

          {/* TAB 3: LINKS & CV */}
          <TabsContent value="links" className="space-y-6">
            {/* CV Upload */}
            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-semibold mb-2">CV / Resume Document</h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                Upload your updated CV PDF directly to Vercel Blob storage.
              </p>

              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-medium transition-colors">
                  <Upload className="h-4 w-4 text-[var(--accent)]" />
                  <span>Choose PDF Document</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleCvUpload}
                    className="hidden"
                  />
                </label>

                {profile?.cvUrl && (
                  <a
                    href={profile.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--accent)] underline inline-flex items-center gap-1"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Current CV: {profile.cvUrl}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tracked Link Builder */}
            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-semibold mb-2">Tracked Link Builder</h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                Generate UTM-tagged URLs for your CV or LinkedIn to monitor inbound recruiter traffic in Vercel Analytics.
              </p>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                    utm_source
                  </label>
                  <Input
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="cv, linkedin, email"
                  />
                </div>

                <div>
                  <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                    utm_medium
                  </label>
                  <Input
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="pdf, social, referral"
                  />
                </div>

                <div>
                  <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                    utm_campaign
                  </label>
                  <Input
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="recruiter_2026, internship"
                  />
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3 flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-[var(--fg)] truncate">
                  {trackedUrl}
                </span>

                <button
                  onClick={copyTrackedLink}
                  type="button"
                  className="flex h-8 items-center gap-1.5 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs shrink-0 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[var(--muted)]" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingProject(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Project: {editingProject.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                  Title
                </label>
                <Input
                  value={editingProject.title}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                  Description
                </label>
                <Textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                  Tags (comma-separated, max 3)
                </label>
                <Input
                  value={editingProject.tags.join(", ")}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div>
                <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                  Live Application URL
                </label>
                <Input
                  value={editingProject.liveUrl || ""}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, liveUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="caption-mono text-xs text-[var(--muted)] block mb-1">
                  Repository URL
                </label>
                <Input
                  value={editingProject.repoUrl || ""}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, repoUrl: e.target.value })
                  }
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button
                onClick={saveEditedProject}
                className="bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
              >
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal for Destructive Reset */}
      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Project Settings?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[var(--muted)]">
            This will discard your custom overrides and revert all projects to the default seeded state.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmResetOpen(false);
                await fetch("/api/admin/projects", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ overrides: {}, version }),
                });
                toast.success("Reset to defaults complete.");
                fetchData();
              }}
            >
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

