type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: GtagFn; dataLayer?: unknown[] };
  if (w.gtag) w.gtag(...args);
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  gtag("event", name, params);
}

export function trackVideoPlay(title: string, slug: string, category: string) {
  trackEvent("video_play", { video_title: title, video_slug: slug, category });
}

export function trackWhatsAppClick(sourcePage: string) {
  trackEvent("click_whatsapp", { source_page: sourcePage });
}

export function trackListingView(slug: string, listingType: string, price?: number) {
  trackEvent("listing_view", { listing_slug: slug, listing_type: listingType, price });
}

export function trackLead(sourcePage: string, listingSlug?: string) {
  trackEvent("generate_lead", { source_page: sourcePage, listing_slug: listingSlug });
}

export function trackButtonClick(label: string) {
  trackEvent("button_click", { button_label: label });
}
