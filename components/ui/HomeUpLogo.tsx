import Image from "next/image";
import { cn } from "@/lib/utils";

type HomeUpLogoVariant = "icon" | "wordmark" | "wordmark-light";

const LOGO_ASSETS = {
  icon: {
    src: "/images/homeup-logo-icon.svg",
    width: 100,
    height: 100,
    defaultClassName: "h-8 w-8",
  },
  wordmark: {
    src: "/images/homeup-logo-wordmark.svg",
    width: 218,
    height: 46,
    defaultClassName: "h-7 w-auto sm:h-8",
  },
  "wordmark-light": {
    src: "/images/homeup-logo-wordmark-light.svg",
    width: 218,
    height: 46,
    defaultClassName: "h-9 w-auto sm:h-10",
  },
} as const;

interface HomeUpLogoProps {
  variant?: HomeUpLogoVariant;
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export function HomeUpLogo({
  variant = "icon",
  className,
  imageClassName,
  showText,
  textClassName = "font-display text-xl font-bold tracking-tight text-primary-600",
}: HomeUpLogoProps) {
  const asset = LOGO_ASSETS[variant];
  const isWordmark = variant !== "icon";
  const showLabel = showText ?? !isWordmark;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={asset.src}
        alt="HomeUP"
        width={asset.width}
        height={asset.height}
        className={cn("object-contain", imageClassName ?? asset.defaultClassName)}
        priority
      />
      {showLabel && <span className={textClassName}>HomeUP</span>}
    </span>
  );
}
