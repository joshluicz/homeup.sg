export function labelToClipSlug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "room"
  );
}

export function clipFileNameForSlug(slug: string): string {
  return `room_clip_${slug}.mp4`;
}

export function clipFileNameForLabel(label: string): string {
  return clipFileNameForSlug(labelToClipSlug(label));
}

export function clipR2KeyForSlug(blueprintId: string, slug: string): string {
  return `room-clips/${blueprintId}/${slug}.mp4`;
}

/** Assign stable unique slugs when labels normalize to the same slug. */
export function assignUniqueClipSlugs(labels: string[]): string[] {
  const seen = new Map<string, number>();

  return labels.map((label) => {
    const base = labelToClipSlug(label);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}
