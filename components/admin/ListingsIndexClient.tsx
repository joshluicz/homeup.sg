"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "@/components/admin/DeleteListingButton";
import { FilterTabs } from "@/components/admin/FilterTabs";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  FLAT_TYPE_LABELS,
  formatDate,
  formatSGD,
} from "@/lib/listings/utils";
import type { Listing, ListingFilter } from "@/lib/listings/types";
import { Loader2, Pencil, Plus } from "lucide-react";

const PAGE_SIZE = 20;

export function ListingsIndexClient() {
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as ListingFilter) || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (filter === "active") query = query.eq("status", "active");
    if (filter === "draft") query = query.eq("status", "draft");
    if (filter === "sold") query = query.eq("is_sold", true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error: dbError } = await query;

    if (dbError) {
      setError(dbError.message);
      setListings([]);
      setTotalCount(0);
    } else {
      setListings(data ?? []);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Listings</h1>
          <p className="text-sm text-neutral-600">
            {totalCount} listing{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Listing
          </Link>
        </Button>
      </div>

      <FilterTabs />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Listed As</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Flat Type</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Created</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No listings found
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {listing.title}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={listing.status} isSold={listing.is_sold} />
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-700">
                      {listing.listed_as}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {formatSGD(Number(listing.price))}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {FLAT_TYPE_LABELS[listing.flat_type] ?? listing.flat_type}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(listing.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/listings/edit?id=${listing.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteListingButton
                          listingId={listing.id}
                          onDeleted={loadListings}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
