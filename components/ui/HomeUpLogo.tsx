import Image from "next/image";
import { cn } from "@/lib/utils";

interface HomeUpLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export function HomeUpLogo({
  className,
  imageClassName = "h-8 w-8",
  showText = true,
  textClassName = "font-display text-xl font-bold tracking-tight text-primary-600",
}: HomeUpLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/images/homeup-logo.png"
        alt="HomeUP"
        width={32}
        height={32}
        className={cn("object-contain", imageClassName)}
        priority
      />
      {showText && <span className={textClassName}>HomeUP</span>}
    </span>
  );
}
