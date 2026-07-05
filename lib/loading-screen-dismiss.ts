export const LOADING_SCREEN_ID = "homeup-loading-screen";
export const LOADING_MIN_MS = 1500;
export const LOADING_FADE_MS = 600;
export const LOADING_FALLBACK_MS = 6000;

/** Hides the splash overlay and signals hero animations. Safe to call multiple times. */
export function dismissLoadingScreenDom(): void {
  if (typeof window === "undefined") return;

  const win = window as unknown as Record<string, unknown>;
  if (win.__homeupLoaded) return;

  const el = document.getElementById(LOADING_SCREEN_ID);
  if (!el || el.dataset.dismissed === "1") return;

  el.dataset.dismissed = "1";
  el.classList.add("homeup-loading-done");
  el.style.opacity = "0";
  el.style.pointerEvents = "none";

  win.__homeupLoaded = true;
  window.dispatchEvent(new CustomEvent("homeup:loaded"));
}

/** Last-resort fallback if React never hydrates the splash component. */
export const LOADING_SCREEN_BOOTSTRAP = `
(function () {
  var MAX = ${LOADING_FALLBACK_MS};
  setTimeout(function () {
    if (window.__homeupLoaded) return;
    var el = document.getElementById("${LOADING_SCREEN_ID}");
    if (!el || el.dataset.dismissed === "1") return;
    el.dataset.dismissed = "1";
    el.classList.add("homeup-loading-done");
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    window.__homeupLoaded = true;
    window.dispatchEvent(new CustomEvent("homeup:loaded"));
  }, MAX);
})();
`;
