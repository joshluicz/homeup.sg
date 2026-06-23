import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireAuth } from "@/lib/supabase/auth";

const BUCKET = "homeup-media-raw";

function getR2Client() {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const SAFE_R2_KEY_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/;

function isValidR2Key(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/")) return false;
  return SAFE_R2_KEY_REGEX.test(key);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicUrl) {
    return NextResponse.json(
      { error: "R2_PUBLIC_URL is not configured" },
      { status: 500 },
    );
  }

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

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      }),
    );

    return NextResponse.json({ url: `${publicUrl}/${key}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("upload-to-r2 failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
