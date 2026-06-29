import { revalidatePath } from "next/cache";

/**
 * Public routes whose rendered content depends on the `listings` table.
 * Call after any mutation that changes which listings are live (publish,
 * archive, edit, delete, create) so the ISR cache doesn't serve stale data.
 */
export function revalidateListingPaths(): void {
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/listings/[slug]", "page");
  revalidatePath("/sell");
  revalidatePath("/about");
  revalidatePath("/sitemap.xml");
}
