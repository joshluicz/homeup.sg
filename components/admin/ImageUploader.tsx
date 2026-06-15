"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export const LISTING_IMAGE_URL_MIME = "application/x-listing-image-url";

type ImageUploaderProps = {
  label: string;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  multiple?: boolean;
  className?: string;
  /** Allow dragging thumbnails out (e.g. additional images → featured). */
  draggableImages?: boolean;
  /** Accept a listing image URL dropped from another uploader. */
  acceptImageUrlDrop?: boolean;
  onImageUrlDrop?: (url: string) => void;
  dropHint?: string;
};

export function ImageUploader({
  label,
  images,
  onImagesChange,
  onUpload,
  multiple = false,
  className,
  draggableImages = false,
  acceptImageUrlDrop = false,
  onImageUrlDrop,
  dropHint,
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [draggingUrl, setDraggingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      setUploading(true);
      setError(null);

      try {
        const urls: string[] = [];
        for (const file of fileArray) {
          const url = await onUpload(file);
          urls.push(url);
        }
        onImagesChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [images, multiple, onImagesChange, onUpload],
  );

  function isImageUrlDrag(e: React.DragEvent) {
    return (
      acceptImageUrlDrop &&
      (e.dataTransfer.types.includes(LISTING_IMAGE_URL_MIME) ||
        e.dataTransfer.types.includes("text/uri-list") ||
        e.dataTransfer.types.includes("text/plain"))
    );
  }

  function readDroppedImageUrl(e: React.DragEvent): string | null {
    const url =
      e.dataTransfer.getData(LISTING_IMAGE_URL_MIME) ||
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    return url.startsWith("http") ? url : null;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (isImageUrlDrag(e)) {
      setDraggingUrl(true);
      setDragging(false);
      e.dataTransfer.dropEffect = "copy";
      return;
    }
    if (e.dataTransfer.types.includes("Files")) {
      setDragging(true);
      setDraggingUrl(false);
    }
  }

  function handleDragLeave() {
    setDragging(false);
    setDraggingUrl(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    setDraggingUrl(false);

    if (acceptImageUrlDrop) {
      const url = readDroppedImageUrl(e);
      if (url) {
        onImageUrlDrop?.(url);
        return;
      }
    }

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleRemove(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  const defaultDropHint = multiple
    ? "Drag and drop images, or click to browse"
    : acceptImageUrlDrop
      ? "Drag from Additional Images below, drop a file here, or click to browse"
      : "Drag and drop an image, or click to browse";

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-neutral-900">{label}</p>

      {draggableImages && images.length > 0 && (
        <p className="text-sm text-neutral-500">
          Drag a thumbnail to Featured Image above to set it as featured.
        </p>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
          draggingUrl
            ? "border-primary-500 bg-primary-50"
            : dragging
              ? "border-primary-500 bg-primary-50"
              : "border-neutral-200 bg-neutral-50 hover:border-neutral-300",
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        ) : (
          <>
            <Upload className="mb-2 h-6 w-6 text-neutral-400" />
            <p className="text-center text-sm text-neutral-600">
              {dropHint ?? defaultDropHint}
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className={cn("grid gap-3", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {images.map((url, index) => (
            <div
              key={url}
              draggable={draggableImages}
              onDragStart={(e) => {
                e.dataTransfer.setData(LISTING_IMAGE_URL_MIME, url);
                e.dataTransfer.setData("text/uri-list", url);
                e.dataTransfer.setData("text/plain", url);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-neutral-200",
                draggableImages && "cursor-grab active:cursor-grabbing",
              )}
            >
              {draggableImages && (
                <div className="absolute left-2 top-2 rounded-full bg-neutral-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-video w-full object-cover" draggable={false} />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-2 top-2 rounded-full bg-neutral-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
