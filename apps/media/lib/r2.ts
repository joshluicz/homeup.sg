import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export function buildR2Key(jobId: string, fileName: string): string {
  return `uploads/${jobId}/${fileName}`;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function getPresignedReadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export function getPublicR2Url(key: string): string {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("R2_PUBLIC_URL is not configured");
  }
  return `${base}/${key}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function archiveRemoteFileToR2(
  sourceUrl: string,
  key: string,
): Promise<{ r2_url: string; file_size: number; content_type: string }> {
  if (!isValidR2Key(key)) {
    throw new Error("Invalid R2 key");
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download source video (${response.status})`,
    );
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  const buffer = Buffer.from(await response.arrayBuffer());

  await uploadToR2(key, buffer, contentType);

  return {
    r2_url: getPublicR2Url(key),
    file_size: buffer.length,
    content_type: contentType,
  };
}

const SAFE_R2_KEY_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/;

export function isValidR2Key(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/")) return false;
  return SAFE_R2_KEY_REGEX.test(key);
}
