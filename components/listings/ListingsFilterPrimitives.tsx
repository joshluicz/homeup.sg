"use client";

import { cn } from "@/lib/utils";

interface FilterChipGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}

export function FilterChipGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
  layout = "grid",
  variant = "filled",
}: FilterChipGroupProps<T> & {
  layout?: "grid" | "row";
  variant?: "filled" | "outline";
}) {
  const gridClass =
    columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn(layout === "row" ? "flex flex-wrap gap-2" : cn("grid gap-2", gridClass))}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
              layout === "row" && "shrink-0",
              variant === "outline"
                ? active
                  ? "border-neutral-900 bg-white font-semibold text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                : active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface FilterRangeInputsProps {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  prefix?: string;
  suffix?: string;
}

export function FilterRangeInputs({
  min,
  max,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  prefix,
  suffix,
}: FilterRangeInputsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={0}
          placeholder={minPlaceholder}
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className={cn(
            "w-full rounded-full border border-neutral-200 bg-white py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100",
            prefix ? "pl-9 pr-3" : "px-3",
          )}
        />
      </div>
      <span className="shrink-0 text-sm text-neutral-300">–</span>
      <div className="relative min-w-0 flex-1">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={0}
          placeholder={maxPlaceholder}
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className={cn(
            "w-full rounded-full border border-neutral-200 bg-white py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100",
            prefix ? "pl-9 pr-3" : "px-3",
            suffix ? "pr-10" : "",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface BuyRentToggleProps {
  value: "All" | "For Sale" | "For Rent";
  onChange: (value: "For Sale" | "For Rent") => void;
}

export function BuyRentToggle({ value, onChange }: BuyRentToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 p-1">
      {(["For Sale", "For Rent"] as const).map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
              active
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {option === "For Sale" ? "Buy" : "Rent"}
          </button>
        );
      })}
    </div>
  );
}

interface FilterSheetFooterProps {
  onClear: () => void;
  onApply: () => void;
}

export function FilterSheetFooter({ onClear, onApply }: FilterSheetFooterProps) {
  return (
    <div className="flex gap-3 border-t border-neutral-100 bg-white px-5 py-4">
      <button
        type="button"
        onClick={onClear}
        className="flex-1 cursor-pointer rounded-full border border-neutral-900 bg-white py-3 text-sm font-semibold text-neutral-900 transition-colors duration-200 hover:bg-neutral-50"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={onApply}
        className="flex-1 cursor-pointer rounded-full bg-primary-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-700"
      >
        Apply
      </button>
    </div>
  );
}
