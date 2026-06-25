"use client";

import { Search, X } from "lucide-react";
import { PlaybookFilterSelects } from "@/components/playbook/PlaybookFilterSelects";
import {
  DEFAULT_PLAYBOOK_JOURNEY_FILTERS,
  hasActivePlaybookFilters,
  type PlaybookJourneyFilters,
} from "@/lib/playbook/playbook-filters";
import { cn } from "@/lib/utils";

type PlaybookJourneyToolbarProps = {
  filters: PlaybookJourneyFilters;
  onChange: (filters: PlaybookJourneyFilters) => void;
  resultCount: number;
  className?: string;
};

export function PlaybookJourneyToolbar({
  filters,
  onChange,
  resultCount,
  className,
}: PlaybookJourneyToolbarProps) {
  const active = hasActivePlaybookFilters(filters);

  const patch = (partial: Partial<PlaybookJourneyFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className={cn("border-b border-neutral-200 bg-white", className)}>
      <div className="container-page py-4 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder="Search articles…"
              className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-10 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => patch({ query: "" })}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <PlaybookFilterSelects
            filters={filters}
            onChange={onChange}
            className="w-full sm:max-w-md lg:w-[22rem] lg:shrink-0"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <p>
            {resultCount} result{resultCount === 1 ? "" : "s"}
            {active ? " matching your filters" : ""}
          </p>
          {active && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_PLAYBOOK_JOURNEY_FILTERS)}
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
