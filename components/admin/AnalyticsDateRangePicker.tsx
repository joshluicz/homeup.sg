"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DATE_PRESET_LABELS,
  type DatePreset,
  type GaDateRange,
} from "@/lib/analytics/dateRange";
import { cn } from "@/lib/utils";

const PRESETS: DatePreset[] = [
  "today",
  "yesterday",
  "last7days",
  "last28days",
  "last30days",
  "last90days",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "custom",
];

interface AnalyticsDateRangePickerProps {
  value: GaDateRange;
  onChange: (preset: DatePreset, startIso?: string, endIso?: string) => void;
}

export function AnalyticsDateRangePicker({ value, onChange }: AnalyticsDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startIso);
  const [customEnd, setCustomEnd] = useState(value.endIso);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function applyCustom() {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange("custom", customStart, customEnd);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
      >
        <Calendar className="h-4 w-4 text-neutral-400" />
        <span>{value.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Date range
          </p>
          <div className="max-h-64 overflow-y-auto">
            {PRESETS.filter((p) => p !== "custom").map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  value.preset === preset
                    ? "bg-primary-50 font-semibold text-primary-800"
                    : "text-neutral-700 hover:bg-neutral-50",
                )}
              >
                {DATE_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-neutral-100 pt-2 px-1">
            <p className="mb-2 text-xs font-semibold text-neutral-500">Custom range</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
              />
              <span className="text-xs text-neutral-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              className="mt-2 w-full rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              Apply custom range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
