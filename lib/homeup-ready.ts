/** Signals hero counters and removes any legacy splash overlay from cached HTML. */
export const HOMEUP_READY_BOOTSTRAP = `
(function () {
  function signalReady() {
    if (window.__homeupLoaded) return;
    window.__homeupLoaded = true;
    window.dispatchEvent(new CustomEvent("homeup:loaded"));
  }

  function removeSplash() {
    var selectors = ["#homeup-loading-screen", ".loading-screen-logo"];
    for (var i = 0; i < selectors.length; i++) {
      var nodes = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        var overlay =
          node.id === "homeup-loading-screen"
            ? node
            : node.closest('[aria-hidden="true"]');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
    }
  }

  function boot() {
    removeSplash();
    signalReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
`;
