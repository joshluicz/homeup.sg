"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const LISTINGS_PER_PAGE_OPTIONS = [25, 50, 100] as const;
export type ListingsPerPage = (typeof LISTINGS_PER_PAGE_OPTIONS)[number];
export type ListingsViewMode = "grid" | "list";
export const DEFAULT_LISTINGS_PER_PAGE_MOBILE: ListingsPerPage = 25;
export const DEFAULT_LISTINGS_PER_PAGE_DESKTOP: ListingsPerPage = 50;
export const DEFAULT_LISTINGS_PER_PAGE = DEFAULT_LISTINGS_PER_PAGE_DESKTOP;

export type ListingsPaginationState = {
  page: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  perPage: ListingsPerPage;
  viewMode: ListingsViewMode;
};

type Props = ListingsPaginationState & {
  position?: "top" | "bottom";
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: ListingsPerPage) => void;
  onViewModeChange: (view: ListingsViewMode) => void;
};

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ListingsViewMode;
  onViewModeChange: (view: ListingsViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1"
    >
      <Button
        type="button"
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "h-8 w-8 rounded-lg p-0",
          viewMode !== "grid" && "text-neutral-500 hover:text-neutral-900",
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        onClick={() => onViewModeChange("list")}
        className={cn(
          "h-8 w-8 rounded-lg p-0",
          viewMode !== "list" && "text-neutral-500 hover:text-neutral-900",
        )}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ListingsPaginationBar({
  page,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
  perPage,
  viewMode,
  position = "bottom",
  onPageChange,
  onPerPageChange,
  onViewModeChange,
}: Props) {
  if (totalCount === 0) return null;

  const isTop = position === "top";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        isTop ? "border-b border-neutral-100 pb-5" : "border-t border-neutral-100 pt-6",
      )}
    >
      <p className="text-sm text-neutral-500">
        Showing{" "}
        <span className="font-semibold text-neutral-700">
          {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-neutral-700">{totalCount.toLocaleString()}</span>
        {totalPages > 1 ? (
          <>
            {" "}
            · Page {page} of {totalPages}
          </>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Per page</span>
          <Select
            value={String(perPage)}
            onValueChange={(value) => onPerPageChange(Number(value) as ListingsPerPage)}
          >
            <SelectTrigger
              aria-label="Listings per page"
              className="h-9 w-[4.5rem] rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-sm focus:ring-primary-100"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 shadow-lg">
              {LISTINGS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                  className="cursor-pointer rounded-lg text-sm focus:bg-primary-50 focus:text-primary-700"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="gap-1 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="gap-1 rounded-xl"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
