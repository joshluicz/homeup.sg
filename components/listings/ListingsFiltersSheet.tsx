"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BuyRentToggle,
  FilterChipGroup,
  FilterRangeInputs,
  FilterSheetFooter,
} from "@/components/listings/ListingsFilterPrimitives";
import type { ListingsFilterState } from "@/lib/listings/listings-filters";
import {
  DEFAULT_LISTINGS_FILTERS,
  ROOM_OPTIONS,
  TYPE_FILTERS,
} from "@/lib/listings/listings-filters";
import { cn } from "@/lib/utils";

export type PrimaryFilterTab = "type" | "price" | "bedroom";

const TABS: { id: PrimaryFilterTab; label: string }[] = [
  { id: "type", label: "Property Type" },
  { id: "price", label: "Price" },
  { id: "bedroom", label: "Bedroom" },
];

interface ListingsFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ListingsFilterState;
  onApply: (filters: ListingsFilterState) => void;
  onOpenMore: () => void;
  initialTab?: PrimaryFilterTab;
  showExtendedFilters?: boolean;
}

export function ListingsFiltersSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  onOpenMore,
  initialTab = "type",
  showExtendedFilters = true,
}: ListingsFiltersSheetProps) {
  const [draft, setDraft] = useState(filters);
  const [activeTab, setActiveTab] = useState<PrimaryFilterTab>(initialTab);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setActiveTab(initialTab);
    }
  }, [open, filters, initialTab]);

  const patch = (partial: Partial<ListingsFilterState>) =>
    setDraft((current) => ({ ...current, ...partial }));

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    if (activeTab === "type") {
      setDraft((current) => ({ ...current, typeFilter: "All", statusFilter: "All" }));
      return;
    }
    if (activeTab === "price") {
      setDraft((current) => ({ ...current, minPrice: "", maxPrice: "" }));
      return;
    }
    setDraft((current) => ({ ...current, minRooms: "any" }));
  };

  const handleClearAll = () => {
    setDraft((current) => ({
      ...DEFAULT_LISTINGS_FILTERS,
      search: current.search,
      tenureFilter: current.tenureFilter,
      conditionFilter: current.conditionFilter,
      minBathrooms: current.minBathrooms,
      sort: current.sort,
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-neutral-100 p-0 sm:max-w-md [&>button]:hidden"
      >
        <SheetHeader className="relative space-y-0 border-b border-neutral-100 bg-neutral-900 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold text-white">Filters</SheetTitle>
          <SheetClose className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        <div className="border-b border-neutral-100 px-5">
          <div className="flex gap-6 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 border-b-2 py-3.5 text-sm font-medium transition-colors duration-200",
                  activeTab === tab.id
                    ? "border-primary-600 font-semibold text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {showExtendedFilters && activeTab === "type" && (
            <div className="mb-6">
              <BuyRentToggle
                value={draft.statusFilter}
                onChange={(status) => patch({ statusFilter: status })}
              />
            </div>
          )}

          {activeTab === "type" && (
            <FilterChipGroup
              options={TYPE_FILTERS.map((t) => ({ value: t, label: t }))}
              value={draft.typeFilter}
              onChange={(typeFilter) => patch({ typeFilter })}
              layout="row"
              variant="outline"
            />
          )}

          {activeTab === "price" && (
            <FilterRangeInputs
              min={draft.minPrice}
              max={draft.maxPrice}
              onMinChange={(minPrice) => patch({ minPrice })}
              onMaxChange={(maxPrice) => patch({ maxPrice })}
              prefix="S$"
            />
          )}

          {activeTab === "bedroom" && (
            <FilterChipGroup
              options={ROOM_OPTIONS}
              value={draft.minRooms}
              onChange={(minRooms) => patch({ minRooms })}
              columns={3}
            />
          )}

          {showExtendedFilters && (
            <>
              <div className="mt-8 border-t border-neutral-100 pt-6">
                <p className="mb-3 text-sm font-semibold text-neutral-900">Floor size</p>
                <FilterRangeInputs
                  min={draft.minSize}
                  max={draft.maxSize}
                  onMinChange={(minSize) => patch({ minSize })}
                  onMaxChange={(maxSize) => patch({ maxSize })}
                  suffix="sqft"
                />
              </div>

              <button
                type="button"
                onClick={onOpenMore}
                className="mt-6 flex w-full cursor-pointer items-center justify-between border-t border-neutral-100 py-4 text-sm font-semibold text-neutral-900 transition-colors duration-200 hover:text-primary-600"
              >
                More filters
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>
            </>
          )}
        </div>

        <FilterSheetFooter
          onClear={showExtendedFilters ? handleClearAll : handleClear}
          onApply={handleApply}
        />
      </SheetContent>
    </Sheet>
  );
}
