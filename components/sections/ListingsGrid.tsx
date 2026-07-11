"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingsFilterBar } from "@/components/listings/ListingsFilterBar";
import {
  DEFAULT_LISTINGS_PER_PAGE_DESKTOP,
  DEFAULT_LISTINGS_PER_PAGE_MOBILE,
  ListingsPaginationBar,
  LISTINGS_PER_PAGE_OPTIONS,
  type ListingsPerPage,
  type ListingsViewMode,
} from "@/components/listings/ListingsPaginationBar";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
import type { Listing } from "@/lib/listings/types";
import {
  DEFAULT_LISTINGS_FILTERS,
  filterListings,
  type ListingsFilterState,
} from "@/lib/listings/listings-filters";

interface ListingsGridProps {
  listings: Listing[];
}

function parsePerPage(value: string | null, fallback: ListingsPerPage): ListingsPerPage {
  const parsed = Number(value);
  return LISTINGS_PER_PAGE_OPTIONS.includes(parsed as ListingsPerPage)
    ? (parsed as ListingsPerPage)
    : fallback;
}

function useResponsiveDefaultPerPage(): ListingsPerPage {
  const [defaultPerPage, setDefaultPerPage] = useState<ListingsPerPage>(() => {
    if (typeof window === "undefined") return DEFAULT_LISTINGS_PER_PAGE_MOBILE;
    return window.matchMedia("(max-width: 639px)").matches
      ? DEFAULT_LISTINGS_PER_PAGE_MOBILE
      : DEFAULT_LISTINGS_PER_PAGE_DESKTOP;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setDefaultPerPage(mq.matches ? DEFAULT_LISTINGS_PER_PAGE_MOBILE : DEFAULT_LISTINGS_PER_PAGE_DESKTOP);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return defaultPerPage;
}

export function ListingsGrid({ listings }: ListingsGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLElement>(null);

  const [filters, setFilters] = useState<ListingsFilterState>(DEFAULT_LISTINGS_FILTERS);

  const defaultPerPage = useResponsiveDefaultPerPage();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = parsePerPage(searchParams.get("perPage"), defaultPerPage);
  const viewMode: ListingsViewMode = searchParams.get("view") === "list" ? "list" : "grid";

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filtered = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const filtersKey = JSON.stringify(filters);
  const prevFiltersKey = useRef(filtersKey);

  const paginationProps = {
    page: currentPage,
    totalPages,
    totalCount: filtered.length,
    rangeStart,
    rangeEnd,
    perPage,
    viewMode,
    onPageChange: (nextPage: number) => {
      updateQuery({ page: nextPage === 1 ? null : String(nextPage) });
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onPerPageChange: (nextPerPage: ListingsPerPage) => {
      updateQuery({
        perPage: nextPerPage === defaultPerPage ? null : String(nextPerPage),
        page: null,
      });
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onViewModeChange: (nextView: ListingsViewMode) => {
      updateQuery({ view: nextView === "grid" ? null : nextView });
    },
  };

  useEffect(() => {
    if (page !== currentPage) {
      updateQuery({ page: currentPage === 1 ? null : String(currentPage) });
    }
  }, [currentPage, page, updateQuery]);

  useEffect(() => {
    if (prevFiltersKey.current === filtersKey) return;
    prevFiltersKey.current = filtersKey;
    if (page > 1) {
      updateQuery({ page: null });
    }
  }, [filtersKey, page, updateQuery]);

  if (listings.length === 0) {
    return (
      <section className="bg-white px-[var(--gutter)] py-12">
        <div className="container-page py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600">No listings yet</p>
          <p className="mt-2 text-sm text-neutral-400">Check back soon for new properties.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={gridRef} className="relative overflow-hidden bg-white px-[var(--gutter)] pb-12 pt-6 sm:pt-8">
      <SectionBlendTop from="neutral-50" />
      <div className="container-page">
        <div className="mb-5">
          <ListingsFilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {filtered.length > 0 && (
          <div className="mb-6">
            <ListingsPaginationBar {...paginationProps} position="top" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${JSON.stringify(filters)}-${currentPage}-${perPage}-${viewMode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={
              viewMode === "list"
                ? "flex flex-col gap-4"
                : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {paginated.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                layout={viewMode}
                priority={index < 4}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-neutral-500">No listings match your filters.</p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_LISTINGS_FILTERS)}
              className="mt-3 cursor-pointer text-sm font-semibold text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-8">
            <ListingsPaginationBar {...paginationProps} position="bottom" />
          </div>
        )}
      </div>
    </section>
  );
}
