"use client";

import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { HighlightGroup, HighlighterItem, Particles } from "@/components/ui/highlighter";

interface FaqContactHighlightProps {
  whatsappUrl: string;
  className?: string;
}

export function FaqContactHighlight({ whatsappUrl, className }: FaqContactHighlightProps) {
  return (
    <HighlightGroup className={cn("group shrink-0 lg:w-72", className)}>
      <HighlighterItem className="rounded-2xl">
        <aside className="group/item relative z-20 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Particles
            className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
            quantity={80}
            color="#009A44"
            vy={-0.1}
          />
          <h3 className="text-sm font-bold text-neutral-900">Still have questions?</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            If we didn&apos;t cover it above, tap WhatsApp Us. We&apos;ll give you a straight answer.
          </p>
          <Button size="sm" asChild className="mt-4 gap-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4 shrink-0" />
              WhatsApp Us
            </a>
          </Button>
        </aside>
      </HighlighterItem>
    </HighlightGroup>
  );
}
