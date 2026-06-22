"use client";

import { useRouter } from "next/navigation";
import { savePlaybookReturn } from "@/lib/playbook/return-to";
import { cn } from "@/lib/utils";

interface PlaybookArticleLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function PlaybookArticleLink({ href, className, children }: PlaybookArticleLinkProps) {
  const router = useRouter();

  function navigate() {
    savePlaybookReturn();
    router.push(href);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate();
        }
      }}
      className={cn("cursor-pointer touch-manipulation", className)}
    >
      {children}
    </div>
  );
}
