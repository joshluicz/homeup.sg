import { revalidatePath } from "next/cache";
import { notifyPlaybookArticlesChanged } from "@/lib/seo/indexnow";
import { warmPlaybookUrlsInBackground } from "@/lib/playbook/warm-playbook";

/** Revalidate static playbook pages, warm cache, and ping IndexNow for article URLs. */
export function revalidatePlaybookPaths(slugs: string[] = []): void {
  revalidatePath("/playbook");
  revalidatePath("/playbook/articles");
  revalidatePath("/playbook/videos");
  revalidatePath("/playbook/[slug]", "page");
  revalidatePath("/playbook/watch/[slug]", "page");
  revalidatePath("/sitemap.xml");

  warmPlaybookUrlsInBackground(slugs);

  if (slugs.length > 0) {
    void notifyPlaybookArticlesChanged(slugs);
  }
}
