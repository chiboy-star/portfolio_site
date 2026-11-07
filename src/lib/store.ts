import { Redis } from "@upstash/redis";
import { Project, Profile } from "./types";
import { getProjectThumbnail } from "./thumbnails";
import fs from "fs";
import path from "path";

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
  headline: "Junior Frontend Developer.",
  bio: "I'm a second-year Software Engineering student at Pan-Atlantic University with a strong foundation in front-end development. I specialize in building responsive, API-driven web applications using JavaScript, React, and Next.js, with ambitions in back-end development and cybersecurity.",
  email: "chinemeremmadueke1@gmail.com",
  github: "https://github.com/chiboy-star",
  linkedin: "https://www.linkedin.com/in/chinemerem-madueke-b75038294",
  cvUrl: "/cv.pdf",
  status: "Open to internships",
  updatedAt: "2026-11-06",
};

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "projects.config.json");

function readConfigFile(): { overrides: Record<string, Partial<Project>>; version: number } {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("[Store] Could not read data/projects.config.json:", err);
  }
  return { overrides: {}, version: 1 };
}

function writeConfigFile(overrides: Record<string, Partial<Project>>, version: number) {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      CONFIG_FILE_PATH,
      JSON.stringify({ version, overrides }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("[Store] Could not write data/projects.config.json:", err);
  }
}

export function getRedisConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.KV_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return { url, token };
  }
  return null;
}

function getRedisClient(): Redis | null {
  const config = getRedisConfig();
  if (!config) return null;

  try {
    return new Redis({ url: config.url, token: config.token });
  } catch (err) {
    console.warn("[Store] Failed to initialize Redis client:", err);
    return null;
  }
}

export function getStoreBackend(): "redis" | "file" {
  return getRedisClient() ? "redis" : "file";
}

export async function getProjectOverrides(): Promise<{
  overrides: Record<string, Partial<Project>>;
  version: number;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return readConfigFile();
  }

  try {
    const data = await redis.get<Record<string, Partial<Project>>>("portfolio:projects");
    const version = (await redis.get<number>("portfolio:version")) || 1;
    return { overrides: data || {}, version };
  } catch (err) {
    console.error("[Store] Redis error reading project overrides, falling back to file:", err);
    return readConfigFile();
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

  // Fallback to file persistence
  const fileData = readConfigFile();
  if (expectedVersion !== undefined && expectedVersion !== fileData.version) {
    return {
      success: false,
      version: fileData.version,
      error: "Conflict: data was modified by another request.",
    };
  }
  const nextVersion = fileData.version + 1;
  writeConfigFile(overrides, nextVersion);
  return { success: true, version: nextVersion };
}

let inMemoryProfile: Profile = { ...DEFAULT_PROFILE };

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
