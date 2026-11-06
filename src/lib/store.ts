import { Redis } from "@upstash/redis";
import { Project, Profile } from "./types";
import { getProjectThumbnail } from "./thumbnails";

export const SEEDED_PROJECTS: Project[] = [
  {
    id: "manual:caskayd-sprint",
    title: "Influencer Marketing Web-App",
    description:
      "Serving as Front-end Lead for this platform connecting brands with creators. Built dynamic dashboards and seamless user flows.",
    tags: ["Next.js", "Tailwind CSS", "React"],
    liveUrl: "https://caskayd-sprint-frontend.vercel.app",
    visible: true,
    featured: true,
    order: 0,
    source: "manual",
    thumbnail: getProjectThumbnail(
      "Influencer Marketing Web-App",
      "https://caskayd-sprint-frontend.vercel.app"
    ),
  },
  {
    id: "gh:chiboy-star/calculator-project",
    title: "Smart Calculator",
    description:
      "A modern, glassmorphism-styled calculator featuring custom logic for rapid thousands (K) and millions (M) multiplier inputs.",
    tags: ["JavaScript", "HTML5", "CSS3"],
    repoUrl: "https://github.com/chiboy-star/calculator-project",
    visible: true,
    featured: true,
    order: 1,
    source: "github",
    thumbnail: getProjectThumbnail("Smart Calculator"),
  },
  {
    id: "gh:chiboy-star/password_generator",
    title: "Secure Password Generator",
    description:
      "A cryptographically secure password generation tool with a responsive UI, utilizing window.crypto for true randomness.",
    tags: ["JavaScript", "Web Crypto", "CSS3"],
    repoUrl: "https://github.com/chiboy-star/password_generator",
    visible: true,
    featured: true,
    order: 2,
    source: "github",
    thumbnail: getProjectThumbnail("Secure Password Generator"),
  },
];

export const DEFAULT_PROFILE: Profile = {
  headline: "Junior Frontend Developer. Open to internships.",
  bio: "I'm a second-year Software Engineering student at Pan-Atlantic University with a strong foundation in front-end development. I specialize in building responsive, API-driven web applications using JavaScript, React, and Next.js, with ambitions in back-end development and cybersecurity.",
  email: "chinemeremmadueke1@gmail.com",
  github: "https://github.com/chiboy-star",
  linkedin: "https://www.linkedin.com/in/chinemerem-madueke-b75038294",
  cvUrl: "/cv.pdf",
  status: "Open to internships",
  updatedAt: "2026-11-06",
};

// In-memory fallback if Redis is not configured
let inMemoryOverrides: Record<string, Partial<Project>> = {};
let inMemoryProfile: Profile = { ...DEFAULT_PROFILE };
let inMemoryVersion = 1;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (err) {
    console.warn("[Store] Failed to initialize Redis client:", err);
    return null;
  }
}

export async function getProjectOverrides(): Promise<{
  overrides: Record<string, Partial<Project>>;
  version: number;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return { overrides: inMemoryOverrides, version: inMemoryVersion };
  }

  try {
    const data = await redis.get<Record<string, Partial<Project>>>("portfolio:projects");
    const version = (await redis.get<number>("portfolio:version")) || 1;
    return { overrides: data || {}, version };
  } catch (err) {
    console.error("[Store] Redis error reading project overrides:", err);
    return { overrides: inMemoryOverrides, version: inMemoryVersion };
  }
}

export async function saveProjectOverrides(
  overrides: Record<string, Partial<Project>>,
  expectedVersion?: number
): Promise<{ success: boolean; version: number; error?: string }> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const currentVersion = (await redis.get<number>("portfolio:version")) || 1;
      if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
        return {
          success: false,
          version: currentVersion,
          error: "Conflict: data was modified by another request.",
        };
      }
      const nextVersion = currentVersion + 1;
      await redis.set("portfolio:projects", overrides);
      await redis.set("portfolio:version", nextVersion);
      return { success: true, version: nextVersion };
    } catch (err) {
      console.error("[Store] Redis error saving project overrides:", err);
    }
  }

  // Fallback to in-memory
  if (expectedVersion !== undefined && expectedVersion !== inMemoryVersion) {
    return {
      success: false,
      version: inMemoryVersion,
      error: "Conflict: data was modified by another request.",
    };
  }
  inMemoryOverrides = overrides;
  inMemoryVersion += 1;
  return { success: true, version: inMemoryVersion };
}

export async function getProfile(): Promise<Profile> {
  const redis = getRedisClient();
  if (!redis) {
    return inMemoryProfile;
  }

  try {
    const profile = await redis.get<Profile>("portfolio:profile");
    return profile || DEFAULT_PROFILE;
  } catch (err) {
    console.error("[Store] Redis error reading profile:", err);
    return inMemoryProfile;
  }
}

export async function saveProfile(profile: Profile): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    inMemoryProfile = profile;
    return true;
  }

  try {
    await redis.set("portfolio:profile", profile);
    return true;
  } catch (err) {
    console.error("[Store] Redis error saving profile:", err);
    inMemoryProfile = profile;
    return false;
  }
}
