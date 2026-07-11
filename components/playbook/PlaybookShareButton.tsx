"use client";

import { useCallback, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type PlaybookShareButtonProps = {
  url: string;
  title: string;
  className?: string;
};

export function PlaybookShareButton({ url, title, className }: PlaybookShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [title, url]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
      aria-label="Share this article"
      aria-live="polite"
      onClick={() => void handleShare()}
    >
      <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
