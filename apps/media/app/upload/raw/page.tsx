"use client";

import { useRef, useState } from "react";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].some((ext) =>
    lower.endsWith(ext),
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildR2Key(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `raw/${crypto.randomUUID()}/${safeName}`;
}

export default function RawUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectFile(next: File) {
    if (!isAcceptedImage(next)) {
      setError("Only image files (JPEG, PNG, WebP, GIF, HEIC) are accepted.");
      return;
    }

    setError(null);
    setResultUrl(null);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", buildR2Key(file.name));

      const res = await fetch("/api/upload/raw", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Upload failed");
      }

      setResultUrl(body.url);
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Upload Raw Images</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Upload images directly to R2 for the media pipeline.
        </p>
      </div>

      {resultUrl && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">Upload complete</p>
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-green-700 underline"
          >
            {resultUrl}
          </a>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Image File</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) selectFile(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-neutral-400 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <p className="text-sm font-medium text-neutral-700">
              Drop an image here or click to browse
            </p>
            <p className="mt-1 text-sm text-neutral-500">JPEG, PNG, WebP, GIF, HEIC</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/*"
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) selectFile(picked);
                e.target.value = "";
              }}
            />
          </div>

          {file && (
            <div className="mt-4 rounded-lg border border-neutral-200 p-4">
              <p className="truncate text-sm font-medium text-neutral-900">{file.name}</p>
              <p className="text-sm text-neutral-500">{formatFileSize(file.size)}</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-3 max-h-48 rounded-lg object-contain"
                />
              )}
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
