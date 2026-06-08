import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/listings/types";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-primary-100 text-primary-800",
  draft: "bg-neutral-100 text-neutral-700",
  archived: "bg-amber-100 text-amber-800",
};

export function StatusBadge({
  status,
  isSold,
}: {
  status: ListingStatus;
  isSold?: boolean;
}) {
  if (isSold) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        Sold
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
