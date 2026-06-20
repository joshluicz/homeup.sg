"use client";

import { useState } from "react";
import {
  BedDouble,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  ListingsFiltersSheet,
  type PrimaryFilterTab,
} from "@/components/listings/ListingsFiltersSheet";
import { ListingsMoreFiltersSheet } from "@/components/listings/ListingsMoreFiltersSheet";
import type { ListingsFilterState } from "@/lib/listings/listings-filters";
import {
  countActiveFilters,
  priceFilterLabel,
  roomFilterLabel,
  typeFilterLabel,
} from "@/lib/listings/listings-filters";
import { cn } from "@/lib/utils";

interface ListingsFilterBarProps {
  filters: ListingsFilterState;
  onFiltersChange: (filters: ListingsFilterState) => void;
}

function QuickFilterPill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Building2;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
    </button>
  );
}

export function ListingsFilterBar({
  filters,
  onFiltersChange,
}: ListingsFilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<PrimaryFilterTab>("type");
  const [sheetExtended, setSheetExtended] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryCount = countActiveFilters(filters, "primary");
  const moreCount = countActiveFilters(filters, "more");
  const totalActive = primaryCount + moreCount;

  const patch = (partial: Partial<ListingsFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const openSheet = (tab: PrimaryFilterTab, extended: boolean) => {
    setSheetTab(tab);
    setSheetExtended(extended);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          placeholder="Search by location or property name"
          value={filters.search}
          onChange={(e) => patch({ search: e.target.value })}
          className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-3.5 pl-12 pr-5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors duration-200 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="relative z-10 flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:scrollbar-none">
        <button
          type="button"
          onClick={() => openSheet("type", true)}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
            primaryCount > 0
              ? "border-primary-600 bg-primary-600 text-white shadow-sm"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {primaryCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
              {primaryCount}
            </span>
          )}
        </button>

        <QuickFilterPill
          icon={Building2}
          label={typeFilterLabel(filters.typeFilter)}
          active={filters.typeFilter !== "All"}
          onClick={() => openSheet("type", false)}
        />

        <QuickFilterPill
          icon={CircleDollarSign}
          label={priceFilterLabel(filters.minPrice, filters.maxPrice)}
          active={Boolean(filters.minPrice || filters.maxPrice)}
          onClick={() => openSheet("price", false)}
        />

        <QuickFilterPill
          icon={BedDouble}
          label={roomFilterLabel(filters.minRooms)}
          active={filters.minRooms !== "any"}
          onClick={() => openSheet("bedroom", false)}
        />

        {moreCount > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50"
          >
            +{moreCount} more
          </button>
        )}
      </div>

      <ListingsFiltersSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        onApply={onFiltersChange}
        initialTab={sheetTab}
        showExtendedFilters={sheetExtended}
        onOpenMore={() => {
          setSheetOpen(false);
          setMoreOpen(true);
        }}
      />

      <ListingsMoreFiltersSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        filters={filters}
        onApply={onFiltersChange}
        activeCount={moreCount}
      />

      {totalActive > 0 && (
        <button
          type="button"
          onClick={() =>
            onFiltersChange({
              ...filters,
              typeFilter: "All",
              statusFilter: "All",
              tenureFilter: "All",
              conditionFilter: "All",
              minRooms: "any",
              minBathrooms: "any",
              minPrice: "",
              maxPrice: "",
              minSize: "",
              maxSize: "",
              sort: "default",
            })
          }
          className="self-start text-sm font-medium text-primary-600 transition-colors duration-200 hover:text-primary-700 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
