import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getListingImageSrc,
  type ListingImageVariant,
} from "@/lib/listings/image-url";

const SIZES: Record<ListingImageVariant, string> = {
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  compact: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  thumb: "96px",
  gallery: "(max-width: 768px) 100vw, 768px",
};

type ListingImageProps = {
  src: string;
  alt: string;
  variant?: ListingImageVariant;
  priority?: boolean;
  className?: string;
  /** Fixed aspect container — use fill layout (default for cards). */
  fill?: boolean;
  width?: number;
  height?: number;
};

export function ListingImage({
  src,
  alt,
  variant = "card",
  priority = false,
  className,
  fill = true,
  width,
  height,
}: ListingImageProps) {
  const optimizedSrc = getListingImageSrc(src, variant);

  if (fill) {
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        sizes={SIZES[variant]}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        decoding={priority ? "sync" : "async"}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width ?? VARIANT_FALLBACK[variant].width}
      height={height ?? VARIANT_FALLBACK[variant].height}
      sizes={SIZES[variant]}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding={priority ? "sync" : "async"}
      className={cn("object-cover", className)}
    />
  );
}

const VARIANT_FALLBACK: Record<ListingImageVariant, { width: number; height: number }> = {
  card: { width: 640, height: 480 },
  compact: { width: 480, height: 360 },
  thumb: { width: 160, height: 120 },
  gallery: { width: 1200, height: 900 },
};
