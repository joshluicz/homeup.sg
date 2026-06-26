/** Matches the slug convention used by the Playbook sheet sync (lib/data/playbook-sheet-videos.ts). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Appends -2, -3, ... until `candidate` isn't in `taken`. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || "video";
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}
