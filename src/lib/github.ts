import { Project } from "./types";

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string | null;
}

export async function fetchGitHubRepos(includeForks = false): Promise<Partial<Project>[]> {
  const username = process.env.GITHUB_USERNAME || process.env.ADMIN_GITHUB_LOGIN || "chiboy-star";
  const token = process.env.GITHUB_TOKEN;

  const url = `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "chinemerem-portfolio",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600, tags: ["github"] },
    });

    if (!res.ok) {
      console.warn(`[GitHub] API responded with HTTP ${res.status} (${res.statusText})`);
      return [];
    }

    const repos: GitHubRepoResponse[] = await res.json();
    if (!Array.isArray(repos)) {
      return [];
    }

    return repos
      .filter((repo) => (includeForks ? true : !repo.fork) && !repo.archived)
      .map((repo) => ({
        id: `gh:${repo.full_name}`,
        title: repo.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: repo.description || "Project built by Chinemerem Madueke.",
        repoUrl: repo.html_url,
        liveUrl: repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : undefined,
        tags: repo.topics && repo.topics.length > 0 ? repo.topics.slice(0, 3) : [repo.language || "TypeScript"],
        source: "github" as const,
        pushedAt: repo.pushed_at || undefined,
      }));
  } catch (error) {
    console.error("[GitHub] Failed to fetch repositories:", error);
    return [];
  }
}
