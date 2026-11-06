interface VercelProjectResponse {
  projects: Array<{
    id: string;
    name: string;
    link?: {
      type: string;
      repo: string;
    };
    targets?: {
      production?: {
        url?: string;
        alias?: string[];
      };
    };
  }>;
}

export async function fetchVercelProjects(): Promise<
  Array<{
    projectId: string;
    name: string;
    linkedRepo?: string;
    productionUrl?: string;
  }>
> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.warn("[Vercel] VERCEL_TOKEN is not set. Skipping live Vercel fetch.");
    return [];
  }

  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL("https://api.vercel.com/v9/projects");
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 3600, tags: ["vercel"] },
    });

    if (!res.ok) {
      console.warn(`[Vercel] API returned status ${res.status}`);
      return [];
    }

    const data: VercelProjectResponse = await res.json();
    return (data.projects || []).map((p) => {
      let prodUrl = p.targets?.production?.url;
      if (prodUrl && !prodUrl.startsWith("http")) {
        prodUrl = `https://${prodUrl}`;
      }
      return {
        projectId: p.id,
        name: p.name,
        linkedRepo: p.link?.repo,
        productionUrl: prodUrl,
      };
    });
  } catch (err) {
    console.error("[Vercel] Error fetching projects:", err);
    return [];
  }
}
