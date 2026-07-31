/* The Ledger — theme toggle, hex-scramble name, email assembly */

(function () {
  "use strict";

  /* Theme toggle. The inline script in head.html applies a stored theme
     before first paint; this only handles the button. */
  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var osDark = matchMedia("(prefers-color-scheme: dark)").matches;
      var cur = document.documentElement.dataset.theme || (osDark ? "dark" : "light");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
  }

  /* Hex-scramble: the name resolves left-to-right out of hex noise.
     The element ships with the real name, so no-JS and reduced-motion
     visitors simply see it. Spaces and periods never scramble, keeping
     the silhouette stable. */
  function scrambleName() {
    var el = document.getElementById("scramble-name");
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = el.textContent;
    var HEX = "0123456789abcdef";
    var frame = 0;
    (function tick() {
      var out = "";
      var done = true;
      for (var i = 0; i < target.length; i++) {
        if (target[i] === " " || target[i] === "." || frame >= i * 2 + 4) {
          out += target[i];
        } else {
          out += HEX[(Math.random() * 16) | 0];
          done = false;
        }
      }
      el.textContent = out;
      frame++;
      if (!done) requestAnimationFrame(tick);
    })();
  }

  /* Email: assembled at runtime so the address never appears in the HTML. */
  function initEmail() {
    var links = document.querySelectorAll("a[data-u][data-d]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var addr = a.dataset.u + "@" + a.dataset.d;
      a.href = "mailto:" + addr;
      if (a.dataset.show === "address") a.textContent = addr;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    scrambleName();
    initEmail();
  });
})();
