import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!token) {
      console.warn("[Upload] BLOB_READ_WRITE_TOKEN is not configured. Simulating upload.");
      return NextResponse.json({
        url: URL.createObjectURL(file),
        simulated: true,
      });
    }

    const blob = await put(file.name, file, {
      access: "public",
      token,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[Upload] Error uploading file:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

