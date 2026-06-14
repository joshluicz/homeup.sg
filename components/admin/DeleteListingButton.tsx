"use client";

import { useState } from "react";
import { deleteListing } from "@/lib/listings/mutations";
import { Button } from "@/components/ui/Button";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteListingButton({
  listingId,
  onDeleted,
}: {
  listingId: string;
  onDeleted?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteListing(listingId);
      onDeleted?.();
      setConfirming(false);
    } catch {
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Delete?</span>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
