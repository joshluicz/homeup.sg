"use client";

import {
  PLAYBOOK_TOPICS,
  TOPIC_LABELS,
  type PlaybookTopic,
} from "@/lib/data/playbook";
import { getPlaybookAgentOptions } from "@/lib/playbook/agent-attribution";
import type { PlaybookJourneyFilters } from "@/lib/playbook/playbook-filters";
import { cn } from "@/lib/utils";

const AGENT_OPTIONS = getPlaybookAgentOptions();

const selectClass =
  "w-full appearance-none rounded-full border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-neutral-900 shadow-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

type PlaybookFilterSelectsProps = {
  filters: PlaybookJourneyFilters;
  onChange: (filters: PlaybookJourneyFilters) => void;
  showLabels?: boolean;
  className?: string;
};

export function PlaybookFilterSelects({
  filters,
  onChange,
  showLabels = true,
  className,
}: PlaybookFilterSelectsProps) {
  const patch = (partial: Partial<PlaybookJourneyFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <label className="block min-w-0">
        {showLabels && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Topic
          </span>
        )}
        <div className="relative">
          <select
            value={filters.topic}
            onChange={(e) => patch({ topic: e.target.value as PlaybookTopic | "all" })}
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

      <label className="block min-w-0">
        {showLabels && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Agent
          </span>
        )}
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
  );
}
