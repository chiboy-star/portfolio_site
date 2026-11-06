import { Project } from "./types";
import { SEEDED_PROJECTS, getProjectOverrides } from "./store";
import { fetchGitHubRepos } from "./github";
import { fetchVercelProjects } from "./vercel";
import { getProjectThumbnail } from "./thumbnails";

export async function getAllProjects(): Promise<Project[]> {
  const [ghRepos, vcProjects, { overrides }] = await Promise.all([
    fetchGitHubRepos(),
    fetchVercelProjects(),
    getProjectOverrides(),
  ]);

  const projectsMap = new Map<string, Project>();

  // 1. Load seeded projects
  SEEDED_PROJECTS.forEach((p) => {
    projectsMap.set(p.id, { ...p });
  });

  // 2. Merge GitHub repos
  ghRepos.forEach((gh) => {
    if (!gh.id) return;
    const existing = projectsMap.get(gh.id);
    if (existing) {
      existing.repoUrl = gh.repoUrl || existing.repoUrl;
      existing.pushedAt = gh.pushedAt || existing.pushedAt;
    } else {
      projectsMap.set(gh.id, {
        id: gh.id,
        title: gh.title || "Untitled Project",
        description: gh.description || "",
        repoUrl: gh.repoUrl,
        liveUrl: gh.liveUrl,
        tags: gh.tags || [],
        visible: false, // Hidden by default unless seeded or overridden
        featured: false,
        order: 99,
        source: "github",
        pushedAt: gh.pushedAt,
        thumbnail: getProjectThumbnail(gh.title || "Untitled", gh.liveUrl),
      });
    }
  });

  // 3. Match Vercel projects to GitHub repos
  vcProjects.forEach((vc) => {
    if (vc.linkedRepo) {
      const ghId = `gh:${vc.linkedRepo}`;
      const project = projectsMap.get(ghId);
      if (project && vc.productionUrl && !project.liveUrl) {
        project.liveUrl = vc.productionUrl;
        project.thumbnail = getProjectThumbnail(project.title, project.liveUrl);
      }
    }
  });

  // 4. Apply Redis overrides
  Object.entries(overrides).forEach(([id, override]) => {
    const project = projectsMap.get(id);
    if (project) {
      Object.assign(project, override);
      if (override.title || override.liveUrl || override.thumbnail) {
        project.thumbnail = getProjectThumbnail(
          project.title,
          project.liveUrl,
          override.thumbnail
        );
      }
    } else if (override.title) {
      // Manual project added via admin
      projectsMap.set(id, {
        id,
        title: override.title,
        description: override.description || "",
        repoUrl: override.repoUrl,
        liveUrl: override.liveUrl,
        tags: override.tags || [],
        visible: override.visible ?? false,
        featured: override.featured ?? false,
        order: override.order ?? 99,
        source: override.source || "manual",
        thumbnail: getProjectThumbnail(
          override.title,
          override.liveUrl,
          override.thumbnail
        ),
      });
    }
  });

  const list = Array.from(projectsMap.values());
  list.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.pushedAt && b.pushedAt) return b.pushedAt.localeCompare(a.pushedAt);
    return 0;
  });

  return list;
}

export async function getPublicProjects(featuredOnly = false): Promise<Project[]> {
  const all = await getAllProjects();
  const visible = all.filter((p) => p.visible);
  if (featuredOnly) {
    return visible.filter((p) => p.featured);
  }
  return visible;
}
