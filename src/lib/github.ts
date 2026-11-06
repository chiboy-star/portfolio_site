import { Octokit } from "@octokit/rest";
import { Project } from "./types";

export async function fetchGitHubRepos(): Promise<Partial<Project>[]> {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME || process.env.ADMIN_GITHUB_LOGIN || "chiboy-star";

  if (!token) {
    console.warn("[GitHub] GITHUB_TOKEN is not set. Skipping live GitHub fetch and falling back to seeded data.");
    return [];
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      sort: "pushed",
      direction: "desc",
      per_page: 100,
    });

    return repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({
        id: `gh:${repo.full_name}`,
        title: repo.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: repo.description || "Project built by Chinemerem Madueke.",
        repoUrl: repo.html_url,
        liveUrl: repo.homepage || undefined,
        tags: repo.topics && repo.topics.length > 0 ? repo.topics.slice(0, 3) : [repo.language || "TypeScript"],
        source: "github" as const,
        pushedAt: repo.pushed_at || undefined,
      }));
  } catch (error) {
    console.error("[GitHub] Failed to fetch repositories:", error);
    return [];
  }
}
