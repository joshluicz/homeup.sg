/** Preloads the homepage hero image for faster LCP. Render on the home page only. */
export function HeroImagePreload() {
  return (
    <link
      rel="preload"
      href="/images/team-group.webp"
      as="image"
      type="image/webp"
      fetchPriority="high"
    />
  );
}
