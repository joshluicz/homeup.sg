"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
];
const ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".avi"];

type ContentType = "short" | "long";
type Category = "house_tour" | "lifestyle" | "educational";

type FileEntry = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type SuccessfulUpload = {
  entryId: string;
  file_name: string;
  file_size: number;
  r2_key: string;
  r2_url: string;
};

function isAcceptedVideo(file: File): boolean {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseKeywordPieces(raw: string): string[] {
  return raw
    .split(",")
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0);
}

function mergeUniqueKeywords(existing: string[], additions: string[]): string[] {
  const merged = [...existing];
  for (const piece of additions) {
    if (!merged.includes(piece)) {
      merged.push(piece);
    }
  }
  return merged;
}

function resolveKeywords(
  keywords: string[],
  keywordInput: string,
): string[] {
  return mergeUniqueKeywords(keywords, parseKeywordPieces(keywordInput));
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export default function UploadPage() {
  const [propertyName, setPropertyName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("short");
  const [category, setCategory] = useState<Category>("house_tour");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid: FileEntry[] = [];
    const rejected: string[] = [];

    Array.from(incoming).forEach((file) => {
      if (isAcceptedVideo(file)) {
        valid.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: "pending",
        });
      } else {
        rejected.push(file.name);
      }
    });

    if (rejected.length > 0) {
      setError(`Only MP4, MOV, and AVI files are accepted. Skipped: ${rejected.join(", ")}`);
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }
  }, []);

  function addKeywordFromInput() {
    const pieces = parseKeywordPieces(keywordInput);
    if (pieces.length > 0) {
      setKeywords((prev) => mergeUniqueKeywords(prev, pieces));
    }
    setKeywordInput("");
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeywordFromInput();
    }
  }

  function removeKeyword(keyword: string) {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFile(id: string, patch: Partial<FileEntry>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!propertyName.trim()) {
      setError("Property name is required.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one video file.");
      return;
    }

    const resolvedKeywords = resolveKeywords(keywords, keywordInput);
    setKeywords(resolvedKeywords);
    setKeywordInput("");

    setSubmitting(true);

    const jobId = crypto.randomUUID();
    const successfulUploads: SuccessfulUpload[] = [];
    const failedFileNames: string[] = [];

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to upload.");
      }

      for (const entry of files) {
        updateFile(entry.id, {
          status: "uploading",
          progress: 0,
          error: undefined,
        });

        try {
          const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: jobId,
              file_name: entry.file.name,
              content_type: entry.file.type || "application/octet-stream",
            }),
          });

          if (!presignRes.ok) {
            const body = await presignRes.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to get upload URL.");
          }

          const { presigned_url, r2_key, r2_url } = await presignRes.json();

          await uploadWithProgress(presigned_url, entry.file, (percent) => {
            updateFile(entry.id, { progress: percent });
          });

          successfulUploads.push({
            entryId: entry.id,
            file_name: entry.file.name,
            file_size: entry.file.size,
            r2_key,
            r2_url,
          });

          updateFile(entry.id, { status: "done", progress: 100 });
        } catch (fileErr) {
          const message =
            fileErr instanceof Error ? fileErr.message : "Upload failed.";
          updateFile(entry.id, { status: "error", error: message });
          failedFileNames.push(entry.file.name);
        }
      }

      if (successfulUploads.length === 0) {
        setError(
          "All uploads failed. Please check your connection and try again.",
        );
        return;
      }

      const jobPayload = {
        id: jobId,
        uploaded_by: user.id,
        property_name: propertyName.trim(),
        content_type: contentType,
        category,
        keywords: resolvedKeywords,
        notes: notes.trim() || null,
        status: "pending" as const,
      };

      console.log("media_jobs insert payload:", jobPayload);

      const { error: jobError } = await supabase
        .from("media_jobs")
        .insert(jobPayload);

      if (jobError) {
        throw new Error(jobError.message ?? "Failed to create upload job.");
      }

      const fileInsertErrors: string[] = [];
      const webhookErrors: string[] = [];

      for (const upload of successfulUploads) {
        const { error: fileError } = await supabase.from("media_files").insert({
          job_id: jobId,
          file_name: upload.file_name,
          file_size: upload.file_size,
          r2_key: upload.r2_key,
          r2_url: upload.r2_url,
          status: "uploaded",
        });

        if (fileError) {
          fileInsertErrors.push(upload.file_name);
          continue;
        }

        try {
          const webhookRes = await fetch("/api/upload/trigger-transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: jobId,
              r2_key: upload.r2_key,
            }),
          });

          if (!webhookRes.ok) {
            const body = await webhookRes.json().catch(() => ({}));
            throw new Error(body.error ?? "Transcription webhook failed");
          }
        } catch (webhookErr) {
          const message =
            webhookErr instanceof Error
              ? webhookErr.message
              : "Transcription webhook failed";
          console.error(
            `Transcription webhook failed for ${upload.file_name}:`,
            webhookErr,
          );
          webhookErrors.push(upload.file_name);
        }
      }

      if (fileInsertErrors.length > 0) {
        throw new Error(
          `Job created but failed to save file records for: ${fileInsertErrors.join(", ")}`,
        );
      }

      setSuccess(true);

      if (webhookErrors.length > 0) {
        setError(
          `Upload succeeded but transcription could not be started for: ${webhookErrors.join(", ")}. Please contact support if this persists.`,
        );
      }

      if (failedFileNames.length > 0) {
        setError(
          `Some files failed to upload: ${failedFileNames.join(", ")}. The successful files were submitted — you can retry the failed ones below.`,
        );
        setFiles((prev) =>
          prev
            .filter((f) => failedFileNames.includes(f.file.name))
            .map((f) => ({ ...f, status: "pending" as const, progress: 0, error: undefined })),
        );
      } else {
        setPropertyName("");
        setContentType("short");
        setCategory("house_tour");
        setKeywords([]);
        setNotes("");
        setFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Upload Videos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Submit property media for processing.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Your videos have been submitted for processing.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Metadata</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="e.g. The Pinnacle @ Duxton"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                >
                  <option value="short">Short-form</option>
                  <option value="long">Long-form</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                >
                  <option value="house_tour">House Tour</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="educational">Educational</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Keywords
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                onBlur={addKeywordFromInput}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="Type a keyword and press Enter (commas also separate keywords)"
              />
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-sm text-neutral-700"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="text-neutral-400 hover:text-neutral-700"
                        aria-label={`Remove ${keyword}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="Optional notes for the editing team"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Video Files</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-neutral-400 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <p className="text-sm font-medium text-neutral-700">
              Drop video files here or click to browse
            </p>
            <p className="mt-1 text-sm text-neutral-500">MP4, MOV, AVI only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              {files.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {entry.file.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatFileSize(entry.file.size)}
                      </p>
                    </div>
                    {!submitting && (
                      <button
                        type="button"
                        onClick={() => removeFile(entry.id)}
                        className="shrink-0 text-sm text-neutral-400 hover:text-neutral-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {(entry.status === "uploading" || entry.status === "done") && (
                    <div className="mt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            entry.status === "done" ? "bg-green-500" : "bg-neutral-700"
                          }`}
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {entry.status === "done" ? "Uploaded" : `${entry.progress}%`}
                      </p>
                    </div>
                  )}

                  {entry.status === "error" && entry.error && (
                    <p className="mt-2 text-sm text-red-600">{entry.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {submitting ? "Uploading…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
