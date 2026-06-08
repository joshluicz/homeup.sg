"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  label: string;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  multiple?: boolean;
  className?: string;
};

export function ImageUploader({
  label,
  images,
  onImagesChange,
  onUpload,
  multiple = false,
  className,
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-neutral-900">{label}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
          dragging
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
            <p className="text-sm text-neutral-600">
              Drag and drop {multiple ? "images" : "an image"}, or click to browse
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className={cn("grid gap-3", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {images.map((url, index) => (
            <div key={url} className="group relative overflow-hidden rounded-xl border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-video w-full object-cover" />
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
