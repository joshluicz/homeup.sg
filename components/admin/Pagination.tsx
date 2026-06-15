"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
}) {
  const searchParams = useSearchParams();

  if (totalCount === 0) return null;

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    return `/admin/listings${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-600">
        Showing {rangeStart}–{rangeEnd} of {totalCount}
        {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Link
            href={pageHref(page - 1)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium transition-colors",
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-neutral-50",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
          <Link
            href={pageHref(page + 1)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium transition-colors",
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-neutral-50",
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
