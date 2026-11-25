// Shared behavior for every page: links, theme switching, the live clock.
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // Your links, in one place. Paste your LinkedIn profile URL here and it
  // appears everywhere on the site. While it's empty, LinkedIn links stay hidden.
  // ------------------------------------------------------------------
  var LINKS = {
    linkedin: "",
    github: "https://github.com/Amir-icstars",
  };

  document.querySelectorAll("[data-link]").forEach(function (link) {
    var url = LINKS[link.getAttribute("data-link")];
    if (url) {
      link.href = url;
      link.hidden = false;
      var item = link.closest("li");
      if (item) item.hidden = false;
    } else {
      link.hidden = true;
      var parent = link.closest("li");
      if (parent) parent.hidden = true;
    }
  });

  // ------------------------------------------------------------------
  // Theme: light / dark, remembered between visits.
  // ------------------------------------------------------------------
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeLabels() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", "Switch to " + next + " mode");
      button.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
    });
    document.querySelectorAll("[data-theme-next]").forEach(function (label) {
      label.textContent = next;
    });
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      /* private mode: the choice just isn't remembered */
    }
    updateThemeLabels();
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });
  updateThemeLabels();

  // ------------------------------------------------------------------
  // Live clock (Milwaukee time) for elements with data-clock.
  // ------------------------------------------------------------------
  var clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    var zone = "America/Chicago";
    var dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: zone });
    var timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone });

    var tick = function () {
      var now = new Date();
      clocks.forEach(function (clock) {
        var day = clock.querySelector("[data-clock-day]");
        var time = clock.querySelector("[data-clock-time]");
        if (day) day.textContent = dayFormat.format(now);
        if (time) {
          time.textContent = timeFormat.format(now);
          time.setAttribute("datetime", now.toISOString());
        }
      });
    };
    tick();
    setInterval(tick, 15000);
  }

  // ------------------------------------------------------------------
  // "My daily stack": scrolls by itself in an endless loop. Visitors can also
  // drag it, swipe it or use the mouse wheel; it carries on 2s after they stop.
  // ------------------------------------------------------------------
  document.querySelectorAll(".stack-marquee").forEach(function (box) {
    var list = box.querySelector(".stack-list");
    if (!list) return;

    // Copy the items once so the loop joins seamlessly (copies hidden from screen readers).
    Array.prototype.slice.call(list.children).forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      list.appendChild(copy);
    });

    var SPEED = 0.035; // pixels per millisecond
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var resumeAt = 0;
    var hovering = false;
    var position = 0;
    var last = performance.now();

    function loopWidth() {
      return list.scrollWidth / 2;
    }

    // Keep the position inside one copy of the list, so it never runs out.
    function wrap() {
      var width = loopWidth();
      if (!width) return;
      if (box.scrollLeft >= width) box.scrollLeft -= width;
      else if (box.scrollLeft <= 0) box.scrollLeft += width;
      position = box.scrollLeft;
    }

    function pause(ms) {
      resumeAt = performance.now() + ms;
    }

    function frame(now) {
      var dt = Math.min(64, now - last);
      last = now;
      var animating = document.documentElement.classList.contains("sim-live");
      if (!reduceMotion && !hovering && !animating && now >= resumeAt && !dragging) {
        position += SPEED * dt;
        box.scrollLeft = position;
        if (Math.abs(box.scrollLeft - position) > 2) position = box.scrollLeft;
        wrap();
      }
      requestAnimationFrame(frame);
    }

    // Native scrolling (touch swipe, trackpad, shift + wheel).
    box.addEventListener("scroll", function () {
      if (Math.abs(box.scrollLeft - position) > 1) {
        pause(2000);
        wrap();
      }
    }, { passive: true });

    // A normal vertical mouse wheel scrolls the strip sideways.
    box.addEventListener("wheel", function (event) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      box.scrollLeft += event.deltaY;
      wrap();
      pause(2000);
    }, { passive: false });

    // Drag with the mouse.
    var dragging = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    box.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartScroll = box.scrollLeft;
      box.classList.add("is-dragging");
      box.setPointerCapture(event.pointerId);
    });
    box.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      box.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
      wrap();
      dragStartScroll = box.scrollLeft + (event.clientX - dragStartX);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      box.classList.remove("is-dragging");
      pause(2000);
    }
    box.addEventListener("pointerup", endDrag);
    box.addEventListener("pointercancel", endDrag);

    box.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") hovering = true;
    });
    box.addEventListener("pointerleave", function () {
      hovering = false;
    });

    box.scrollLeft = 1;
    position = 1;
    requestAnimationFrame(frame);
  });

  // ------------------------------------------------------------------
  // Opening the HTML files straight from disk (file://) doesn't open a
  // folder's index.html automatically, so point folder links at it.
  // On the live site and on a local server the clean URLs are kept.
  // ------------------------------------------------------------------
  if (location.protocol === "file:") {
    // The Tap Track demo needs a web address (it loads a database engine),
    // so explain that instead of opening a page that can't start.
    document.querySelectorAll('a[href*="tap-track/"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        showNotice("The Tap Track demo needs a web server. It works on the live site, or run \"npx serve -l 8000 .\" in this folder and open http://localhost:8000.");
      });
    });

    document.querySelectorAll("a[href]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (/^(https?:|mailto:|#)/.test(href)) return;
      var parts = href.split("#");
      if (parts[0] === "" || /\/$/.test(parts[0])) {
        parts[0] = (parts[0] || "./") + "index.html";
        link.setAttribute("href", parts.join("#"));
      }
    });
  }

  function showNotice(message) {
    var old = document.querySelector(".site-notice");
    if (old) old.remove();
    var notice = document.createElement("div");
    notice.className = "site-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    document.body.appendChild(notice);
    setTimeout(function () {
      notice.remove();
    }, 7000);
  }

  // ------------------------------------------------------------------
  // Current year in the footer.
  // ------------------------------------------------------------------
  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
