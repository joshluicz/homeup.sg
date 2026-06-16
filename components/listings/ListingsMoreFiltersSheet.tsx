"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FilterChipGroup,
  FilterSheetFooter,
} from "@/components/listings/ListingsFilterPrimitives";
import type { ListingsFilterState } from "@/lib/listings/listings-filters";
import {
  BATHROOM_OPTIONS,
  CONDITION_FILTERS,
  DEFAULT_LISTINGS_FILTERS,
  SORT_OPTIONS,
  TENURE_FILTERS,
} from "@/lib/listings/listings-filters";
import { ChevronDown, X } from "lucide-react";

interface ListingsMoreFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ListingsFilterState;
  onApply: (filters: ListingsFilterState) => void;
  activeCount: number;
}

function SortDropdown({
  value,
  onChange,
}: {
  value: ListingsFilterState["sort"];
  onChange: (value: ListingsFilterState["sort"]) => void;
}) {
  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Default";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full justify-between rounded-full border-neutral-200 bg-white text-sm font-medium text-neutral-700"
        >
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as ListingsFilterState["sort"])}
        >
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ListingsMoreFiltersSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  activeCount,
}: ListingsMoreFiltersSheetProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const patch = (partial: Partial<ListingsFilterState>) =>
    setDraft((current) => ({ ...current, ...partial }));

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDraft((current) => ({
      ...current,
      tenureFilter: DEFAULT_LISTINGS_FILTERS.tenureFilter,
      conditionFilter: DEFAULT_LISTINGS_FILTERS.conditionFilter,
      minBathrooms: DEFAULT_LISTINGS_FILTERS.minBathrooms,
      sort: DEFAULT_LISTINGS_FILTERS.sort,
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-neutral-100 p-0 sm:max-w-md [&>button]:hidden"
      >
        <SheetHeader className="relative space-y-0 border-b border-neutral-100 bg-neutral-900 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold text-white">
            More filters
            {activeCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
                {activeCount}
              </span>
            )}
          </SheetTitle>
          <SheetClose className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          <Accordion type="multiple" defaultValue={["tenure", "furnishing", "bathroom", "sort"]}>
            <AccordionItem value="tenure" className="border-neutral-100">
              <AccordionTrigger className="py-4 text-sm font-semibold text-neutral-900 hover:no-underline">
                Tenure
              </AccordionTrigger>
              <AccordionContent>
                <FilterChipGroup
                  options={TENURE_FILTERS.map((t) => ({ value: t, label: t }))}
                  value={draft.tenureFilter}
                  onChange={(tenureFilter) => patch({ tenureFilter })}
                  columns={3}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="furnishing" className="border-neutral-100">
              <AccordionTrigger className="py-4 text-sm font-semibold text-neutral-900 hover:no-underline">
                Furnishing
              </AccordionTrigger>
              <AccordionContent>
                <FilterChipGroup
                  options={CONDITION_FILTERS}
                  value={draft.conditionFilter}
                  onChange={(conditionFilter) => patch({ conditionFilter })}
                  columns={2}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bathroom" className="border-neutral-100">
              <AccordionTrigger className="py-4 text-sm font-semibold text-neutral-900 hover:no-underline">
                Bathroom
              </AccordionTrigger>
              <AccordionContent>
                <FilterChipGroup
                  options={BATHROOM_OPTIONS}
                  value={draft.minBathrooms}
                  onChange={(minBathrooms) => patch({ minBathrooms })}
                  columns={4}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sort" className="border-neutral-100">
              <AccordionTrigger className="py-4 text-sm font-semibold text-neutral-900 hover:no-underline">
                Sort by
              </AccordionTrigger>
              <AccordionContent>
                <SortDropdown value={draft.sort} onChange={(sort) => patch({ sort })} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <FilterSheetFooter onClear={handleClear} onApply={handleApply} />
      </SheetContent>
    </Sheet>
  );
}
