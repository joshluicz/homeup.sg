"use client";

import Link from "next/link";
import { markPlaybookRestorePending } from "@/lib/playbook/return-to";
import { cn } from "@/lib/utils";

interface PlaybookReturnLinkProps {
  className?: string;
  children: React.ReactNode;
}

export function PlaybookReturnLink({ className, children }: PlaybookReturnLinkProps) {
  return (
    <Link
      href="/playbook"
      onClick={() => markPlaybookRestorePending()}
      className={cn(
        "text-sm font-medium text-neutral-500 transition-colors hover:text-primary-600",
        className,
      )}
    >
      {children}
    </Link>
  );
}
