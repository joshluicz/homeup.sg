"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  PlaybookEmbeddedVideoPlayer,
  PlaybookExternalWatchButton,
} from "@/components/playbook/PlaybookEmbeddedVideoPlayer";
import { PlaybookVideoTitle } from "@/components/playbook/PlaybookVideoTitle";
import { TOPIC_LABELS, type PlaybookTopic } from "@/lib/data/playbook";
import { cn } from "@/lib/utils";

type PlaybookExclusiveWatchProps = {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  tags?: string[];
  topic?: PlaybookTopic | null;
  autoplay?: boolean;
  aspect?: "portrait" | "landscape";
  onClose?: () => void;
  closeLabel?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
  variant?: "page" | "modal";
  badgeLabel?: string;
  subtitle?: string;
};

export function PlaybookExclusiveWatch({
  videoUrl,
  title,
  thumbnail,
  tags = [],
  topic,
  autoplay = true,
  aspect = "portrait",
  onClose,
  closeLabel = "Close",
  backHref = "/playbook",
  backLabel = "Browse more tips",
  className,
  variant = "page",
  badgeLabel = "Exclusive",
  subtitle,
}: PlaybookExclusiveWatchProps) {
  const isModal = variant === "modal";

  if (!isModal) {
    return (
      <div className={cn("mx-auto w-full max-w-lg", className)}>
        <PlaybookVideoTitle
          title={title}
          as="h1"
          size="lg"
          className="mb-5 text-xl sm:mb-6 sm:text-2xl"
        />

        {subtitle?.trim() ? (
          <p className="mx-auto mb-5 max-w-md text-center text-sm text-neutral-500">{subtitle}</p>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-lg ring-1 ring-neutral-200">
          <PlaybookEmbeddedVideoPlayer
            videoUrl={videoUrl}
            title={title}
            thumbnail={thumbnail}
            autoplay={autoplay}
            aspect={aspect}
            showExternalLink={false}
            titlePosition="none"
            playerClassName="rounded-xl"
          />
        </div>

        <PlaybookExternalWatchButton
          videoUrl={videoUrl}
          className="mt-4 border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
        />

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link
          href={backHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isModal ? "w-full rounded-2xl" : "min-h-[70vh] rounded-none sm:rounded-3xl",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,154,68,0.22),transparent)]"
      />

      <div
        className={cn(
          "relative border border-white/10 bg-neutral-950 shadow-2xl shadow-primary-900/20 ring-1 ring-white/5",
          isModal && "overflow-hidden",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 border-b border-white/10",
            isModal ? "px-4 py-3" : "px-5 py-4 sm:px-6",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300 ring-1 ring-primary-400/20">
              <Sparkles className="h-3 w-3" />
              {badgeLabel}
            </span>
            {topic && (
              <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {TOPIC_LABELS[topic]}
              </span>
            )}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              {closeLabel}
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-col",
            isModal ? "gap-3 px-4 py-3" : "gap-4 px-5 py-5 sm:px-6 sm:py-6",
          )}
        >
          {!isModal && subtitle?.trim() ? (
            <p className="mx-auto max-w-md text-center text-xs text-neutral-500">{subtitle}</p>
          ) : null}

          <div
            className={cn(
              "mx-auto w-full overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(0,154,68,0.12)] ring-1 ring-primary-500/20",
              isModal ? "flex shrink-0 justify-center" : "max-w-md",
            )}
          >
            <PlaybookEmbeddedVideoPlayer
              videoUrl={videoUrl}
              title={title}
              thumbnail={thumbnail}
              autoplay={autoplay}
              aspect={aspect}
              fitViewport={isModal}
              showExternalLink={false}
              titlePosition="none"
              playerClassName="rounded-2xl"
            />
          </div>

          <div className={cn(isModal && "shrink-0")}>
            <PlaybookExternalWatchButton videoUrl={videoUrl} variant="primary" />
          </div>

          {tags.length > 0 && (
            <div className={cn("flex flex-wrap justify-center gap-2", isModal && "shrink-0")}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-400 ring-1 ring-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {!isModal && (
            <Link
              href={backHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Centered modal overlay — scrolls on very short viewports instead of clipping. */
export function PlaybookVideoModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="my-auto w-full max-w-[min(100%,340px)]" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}
