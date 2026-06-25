"use client";

import { Search, X } from "lucide-react";
import {
  TOPIC_LABELS,
  PLAYBOOK_TOPICS,
  type PlaybookTopic,
} from "@/lib/data/playbook";
import { getPlaybookAgentOptions } from "@/lib/playbook/agent-attribution";
import {
  DEFAULT_PLAYBOOK_JOURNEY_FILTERS,
  hasActivePlaybookFilters,
  type PlaybookJourneyFilters,
} from "@/lib/playbook/playbook-filters";
import { cn } from "@/lib/utils";

const AGENT_OPTIONS = getPlaybookAgentOptions();

const selectClass =
  "w-full appearance-none rounded-full border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-neutral-900 shadow-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-md lg:shrink-0">
            <label className="block w-full">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Topic
              </span>
              <div className="relative">
                <select
                  value={filters.topic}
                  onChange={(e) =>
                    patch({ topic: e.target.value as PlaybookTopic | "all" })
                  }
                  className={selectClass}
                  aria-label="Filter by topic"
                >
                  <option value="all">All topics</option>
                  {PLAYBOOK_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {TOPIC_LABELS[topic]}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  ▾
                </span>
              </div>
            </label>

            <label className="block w-full">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Agent
              </span>
              <div className="relative">
                <select
                  value={filters.agent}
                  onChange={(e) => patch({ agent: e.target.value })}
                  className={selectClass}
                  aria-label="Filter by agent"
                >
                  <option value="all">All agents</option>
                  {AGENT_OPTIONS.map((agent) => (
                    <option key={agent.slug} value={agent.slug}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  ▾
                </span>
              </div>
            </label>
          </div>
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
