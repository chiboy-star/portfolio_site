import { NextRequest, NextResponse } from "next/server";
import { getAllProjects } from "@/lib/projects";
import { getProjectOverrides, saveProjectOverrides } from "@/lib/store";
import { revalidatePath, revalidateTag } from "next/cache";

// In-memory idempotency cache for repeated requests
const idempotencyCache = new Map<string, { timestamp: number; response: unknown }>();

export async function GET() {
  const [projects, { version }] = await Promise.all([
    getAllProjects(),
    getProjectOverrides(),
  ]);

  return NextResponse.json({ projects, version });
}

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey)!;
    // Cache valid for 60 seconds
    if (Date.now() - cached.timestamp < 60000) {
      return NextResponse.json(cached.response);
    }
  }

  try {
    const body = await req.json();
    const { overrides, version } = body;

    if (!overrides) {
      return NextResponse.json({ error: "Missing overrides payload" }, { status: 400 });
    }

    const result = await saveProjectOverrides(overrides, version);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Conflict: Stale version", version: result.version },
        { status: 409 }
      );
    }

    // Revalidate public cache tags
    try {
      revalidateTag("projects");
      revalidatePath("/");
    } catch (e) {
      // revalidateTag might be a no-op in dev
    }

    const responseData = { success: true, version: result.version };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        timestamp: Date.now(),
        response: responseData,
      });
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("[Admin API] Failed to save projects:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

