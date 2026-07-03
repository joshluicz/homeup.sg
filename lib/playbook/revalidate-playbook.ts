import { revalidatePath } from "next/cache";
import { notifyPlaybookArticlesChanged } from "@/lib/seo/indexnow";

/** Revalidate ISR-cached playbook pages and ping IndexNow for article URLs. */
export function revalidatePlaybookPaths(slugs: string[] = []): void {
  revalidatePath("/playbook");
  revalidatePath("/playbook/articles");
  revalidatePath("/playbook/videos");
  revalidatePath("/playbook/[slug]", "page");
  revalidatePath("/playbook/watch/[slug]", "page");
  revalidatePath("/sitemap.xml");

  if (slugs.length > 0) {
    void notifyPlaybookArticlesChanged(slugs);
  }
}
