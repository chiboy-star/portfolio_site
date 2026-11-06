import { NextResponse } from "next/server";
import { getStoreBackend } from "@/lib/store";

export async function GET() {
  const username = process.env.GITHUB_USERNAME || process.env.ADMIN_GITHUB_LOGIN || "chiboy-star";
  const hasGithubToken = !!process.env.GITHUB_TOKEN;
  const hasVercelToken = !!process.env.VERCEL_TOKEN;
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasAuth = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const storeBackend = getStoreBackend();

  return NextResponse.json({
    github: {
      connected: true,
      username,
      hasToken: hasGithubToken,
      message: hasGithubToken
        ? `Connected with GITHUB_TOKEN (rate limit: 5,000/hr)`
        : `Connected without token (public API, rate limit: 60/hr). Add GITHUB_TOKEN for higher limits.`,
    },
    vercel: {
      connected: hasVercelToken,
      missingVar: hasVercelToken ? undefined : "VERCEL_TOKEN",
      message: hasVercelToken
        ? `Connected to Vercel API`
        : `Missing VERCEL_TOKEN. Deployments cannot be auto-linked.`,
    },
    redis: {
      connected: hasRedis,
      storeType: storeBackend,
      missingVar: hasRedis ? undefined : "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN",
      message: hasRedis
        ? `Connected to Upstash Redis (serverless KV)`
        : `Missing Upstash credentials. Using file persistence: data/projects.config.json`,
    },
    blob: {
      connected: hasBlob,
      missingVar: hasBlob ? undefined : "BLOB_READ_WRITE_TOKEN",
      message: hasBlob
        ? `Connected to Vercel Blob file store`
        : `Missing BLOB_READ_WRITE_TOKEN. File uploads will be local/mocked.`,
    },
    auth: {
      connected: hasAuth,
      missingVar: hasAuth ? undefined : "AUTH_GITHUB_ID / AUTH_GITHUB_SECRET",
      message: hasAuth
        ? `Connected to Auth.js with GitHub OAuth allowlist (chiboy-star)`
        : `Missing OAuth credentials. Running in local dev bypass mode.`,
    },
  });
}

