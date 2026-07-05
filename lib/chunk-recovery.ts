/** Auto-reload once when a Next.js chunk 404s (stale HTML after deploy). */
export const CHUNK_RECOVERY_BOOTSTRAP = `
(function () {
  var KEY = "homeup-chunk-reload";
  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (!target || target.tagName !== "SCRIPT") return;
      var src = target.src || "";
      if (src.indexOf("/_next/static/") === -1) return;
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
      var url = new URL(window.location.href);
      url.searchParams.set("_cb", String(Date.now()));
      window.location.replace(url.toString());
    },
    true
  );
})();
`;
