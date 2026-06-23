import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getPublicR2Url, isValidR2Key, uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const key = formData.get("key");

    if (!(file instanceof File) || typeof key !== "string" || !key) {
      return NextResponse.json({ error: "Missing file or key" }, { status: 400 });
    }

    if (!isValidR2Key(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadToR2(key, buffer, file.type || "application/octet-stream");

    const url = getPublicR2Url(key);
    return NextResponse.json({ url, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Raw upload failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
