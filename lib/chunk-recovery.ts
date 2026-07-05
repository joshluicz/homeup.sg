/**
 * Recover from stale cached chunk 404s after deploy.
 * Retries failed script tags with a cache-busting query param instead of
 * redirecting to ?_cb= URLs (which never busts script disk cache).
 */
export const CHUNK_RECOVERY_BOOTSTRAP = `
(function () {
  var retried = {};
  var RELOAD_KEY = "homeup-chunk-reload";
  var MAX_RELOADS = 1;

  function isNextChunk(src) {
    return src && (src.indexOf("/_next/static/") !== -1 || src.indexOf("/_assets/") !== -1);
  }

  function bustUrl(src) {
    var u = new URL(src, location.origin);
    u.searchParams.set("v", String(Date.now()));
    return u.toString();
  }

  function retryScript(target) {
    var src = target.src || "";
    if (!isNextChunk(src) || retried[src]) return false;
    retried[src] = true;
    var retry = document.createElement("script");
    retry.src = bustUrl(src);
    retry.async = target.async;
    if (target.defer) retry.defer = true;
    if (target.crossOrigin) retry.crossOrigin = target.crossOrigin;
    (target.parentNode || document.head).appendChild(retry);
    return true;
  }

  function reloadClean() {
    var count = parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10);
    if (count >= MAX_RELOADS) return;
    sessionStorage.setItem(RELOAD_KEY, String(count + 1));
    var go = function () {
      location.replace(location.pathname + location.hash);
    };
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).finally(go);
    } else {
      go();
    }
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (!target || target.tagName !== "SCRIPT") return;
      var src = target.src || "";
      if (!isNextChunk(src)) return;
      if (retryScript(target)) return;
      reloadClean();
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      (reason && (reason.message || (reason.toString && reason.toString()))) || "";
    if (
      message.indexOf("ChunkLoadError") !== -1 ||
      message.indexOf("Loading chunk") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1
    ) {
      reloadClean();
    }
  });

  function cleanLegacyCbParam() {
    if (location.search.indexOf("_cb=") === -1) return;
    var url = new URL(location.href);
    url.searchParams.delete("_cb");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  if (document.readyState === "complete") cleanLegacyCbParam();
  else window.addEventListener("load", cleanLegacyCbParam);
})();
`;
