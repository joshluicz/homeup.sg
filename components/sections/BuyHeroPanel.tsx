import Image from "next/image";
import {
  BUY_HERO_PANEL_ALT,
  BUY_HERO_PANEL_IMAGE,
  BUY_HERO_PANEL_IMAGE_CLASS,
} from "@/lib/constants/images";
import { cn } from "@/lib/utils";

interface BuyHeroPanelProps {
  className?: string;
  showAdvisor?: boolean;
  priority?: boolean;
  /** Fill the parent height instead of a fixed 5:4 aspect ratio */
  fillContainer?: boolean;
  src?: string;
  alt?: string;
  imageClass?: string;
  showGradient?: boolean;
}

export function BuyHeroPanel({
  className,
  showAdvisor = false,
  priority = false,
  fillContainer = false,
  src = BUY_HERO_PANEL_IMAGE,
  alt = BUY_HERO_PANEL_ALT,
  imageClass = BUY_HERO_PANEL_IMAGE_CLASS,
  showGradient = true,
}: BuyHeroPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl",
        fillContainer && "h-full min-h-[240px]",
        className,
      )}
      style={fillContainer ? undefined : { aspectRatio: "5/4" }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={imageClass}
        sizes="(max-width: 1024px) 100vw, 48vw"
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      )}

      {showAdvisor && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:gap-3 sm:px-4 sm:py-3">
          <Image
            src="/images/agent-tong-boon.png"
            alt="Yeo Tong Boon"
            width={44}
            height={44}
            className="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover object-top sm:h-11 sm:w-11"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-900 sm:text-sm">HomeUP Buying Team</p>
            <p className="text-xs font-normal text-neutral-500 sm:text-sm">
              Yeo Tong Boon · Senior Advisor
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
