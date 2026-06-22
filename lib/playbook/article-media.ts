/** Editorial photo caption — ST-style credits shown under in-article images. */
export function articlePhotoCaption(alt?: string | null): string | null {
  const raw = alt?.trim();
  if (!raw || raw === "Article illustration") return null;
  if (/^HOMEUP\s+PHOTO:/i.test(raw)) return raw.toUpperCase();
  return `HOMEUP PHOTO: ${raw}`;
}
