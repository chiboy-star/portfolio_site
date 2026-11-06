import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/store";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updatedProfile = {
      ...body,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const success = await saveProfile(updatedProfile);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist profile" }, { status: 500 });
    }

    try {
      revalidateTag("profile");
      revalidatePath("/");
    } catch {
      // revalidateTag might be a no-op in dev
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error("[Admin API] Failed to update profile:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

