import { revalidatePath } from "next/cache";
import { notifyListingsChanged } from "@/lib/seo/indexnow";

/**
 * Public routes whose rendered content depends on the `listings` table.
 * Call after any mutation that changes which listings are live (publish,
 * archive, edit, delete, create) so the ISR cache doesn't serve stale data.
 */
export function revalidateListingPaths(slugs: string[] = []): void {
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/listings/[slug]", "page");
  revalidatePath("/sell");
  revalidatePath("/about");
  revalidatePath("/sitemap.xml");

  void notifyListingsChanged(slugs);
}
