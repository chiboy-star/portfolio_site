export type Project = {
  id: string; // "gh:chiboy-star/repo" | "vc:<projectId>" | "manual:<slug>"
  title: string;
  description: string;
  repoUrl?: string;
  liveUrl?: string;
  tags: string[]; // max 3 shown
  thumbnail?: { url: string; blurhash?: string };
  visible: boolean; // shown on the site (All)
  featured: boolean; // shown in Featured view
  order: number;
  source: "github" | "vercel" | "manual";
  pushedAt?: string;
};

export type Profile = {
  headline: string;
  bio: string;
  email: string;
  github: string;
  linkedin: string;
  cvUrl?: string;
  status: string;
  updatedAt: string;
};

