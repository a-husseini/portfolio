// Warms up the Tap Track demo in the background so it opens faster.
// Skipped on slow connections or when the visitor has Data Saver on.
(function () {
  "use strict";

  var FILES = ["tap-track/", "tap-track/assets/pglite.wasm", "tap-track/assets/pglite.data", "tap-track/assets/initdb.wasm"];
  var done = false;

  function warm() {
    if (done) return;
    done = true;
    FILES.forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  document.querySelectorAll('a[href^="tap-track/"]').forEach(function (link) {
    link.addEventListener("pointerenter", warm);
    link.addEventListener("touchstart", warm, { passive: true });
    link.addEventListener("focus", warm);
  });

  var connection = navigator.connection;
  var slow = connection && (connection.saveData || /(^|-)2g|3g/.test(connection.effectiveType || ""));
  if (!slow) {
    window.addEventListener("load", function () {
      setTimeout(warm, 2500);
    });
  }
})();
