import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getPresignedReadUrl } from "@/lib/r2";

type GetPresignedReadBody = {
  r2_key?: string;
};

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: GetPresignedReadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { r2_key } = body;

  if (!r2_key || typeof r2_key !== "string") {
    return NextResponse.json({ error: "r2_key is required" }, { status: 400 });
  }

  try {
    const presigned_url = await getPresignedReadUrl(r2_key);
    return NextResponse.json({ presigned_url });
  } catch (err) {
    console.error("Failed to generate presigned read URL:", err);
    return NextResponse.json(
      { error: "Failed to generate presigned read URL" },
      { status: 500 },
    );
  }
}
