"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ListingFilter } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

const TABS: { value: ListingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "sold", label: "Sold" },
];

export function FilterTabs() {
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") as ListingFilter) || "all";

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value === "all") {
          params.delete("filter");
        } else {
          params.set("filter", tab.value);
        }
        params.delete("page");

        return (
          <Link
            key={tab.value}
            href={`/admin/listings?${params.toString()}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              current === tab.value
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
