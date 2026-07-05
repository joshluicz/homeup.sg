/** Auto-reload when Next.js chunks fail (stale HTML or cached 404 after deploy). */
export const CHUNK_RECOVERY_BOOTSTRAP = `
(function () {
  var KEY = "homeup-chunk-reload";
  var MAX = 2;

  function shouldReload() {
    var count = parseInt(sessionStorage.getItem(KEY) || "0", 10);
    if (count >= MAX) return false;
    sessionStorage.setItem(KEY, String(count + 1));
    return true;
  }

  function reloadFresh() {
    if (!shouldReload()) return;
    var url = new URL(window.location.href);
    url.searchParams.set("_cb", String(Date.now()));
    window.location.replace(url.toString());
  }

  function isChunkFailure(src, message) {
    if (src && src.indexOf("/_next/static/") !== -1) return true;
    if (!message) return false;
    return (
      message.indexOf("ChunkLoadError") !== -1 ||
      message.indexOf("Loading chunk") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1
    );
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      var src = target && target.tagName === "SCRIPT" ? target.src || "" : "";
      if (isChunkFailure(src, event.message)) reloadFresh();
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      (reason && (reason.message || reason.toString && reason.toString())) || "";
    if (isChunkFailure("", message)) reloadFresh();
  });
})();
`;
