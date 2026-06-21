"use client";

import Link from "next/link";
import { savePlaybookReturn } from "@/lib/playbook/return-to";

interface PlaybookArticleLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function PlaybookArticleLink({ href, className, children }: PlaybookArticleLinkProps) {
  return (
    <Link
      href={href}
      onClick={savePlaybookReturn}
      className={className}
    >
      {children}
    </Link>
  );
}
