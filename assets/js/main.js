/* =========================================================
   Biswarup — 3D parallax portfolio
   Vanilla JavaScript. No dependencies, no build step.
   Modules: theme, header, nav, scroll activation,
            parallax engine, particle field, tilt, cursor,
            clipboard, form, active section.
   ========================================================= */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReduced = reduceQuery.matches;
  var supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------
     1. Theme
     --------------------------------------------------------- */
  (function theme() {
    var root = document.documentElement;
    var toggle = $("#themeToggle");
    var stored = null;

    try { stored = window.localStorage.getItem("portfolio-theme"); } catch (e) { stored = null; }

    var initial = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    apply(initial);

    function apply(theme) {
      root.setAttribute("data-theme", theme);
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "light" ? "#f6f7fb" : "#05060a");
      if (toggle) {
        var light = theme === "light";
        toggle.setAttribute("aria-pressed", String(light));
        toggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      }
    }

    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      apply(next);
      try { window.localStorage.setItem("portfolio-theme", next); } catch (e) { /* storage blocked */ }
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    });
  })();

  /* ---------------------------------------------------------
     2. Header state + scroll progress
     --------------------------------------------------------- */
  (function header() {
    var headerEl = $("#siteHeader");
    var bar = $("#scrollBar");
    if (!headerEl && !bar) return;

    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (headerEl) {
        headerEl.classList.toggle("is-stuck", y > 20);
        var goingDown = y > lastY && y > 420;
        headerEl.classList.toggle("is-hidden", goingDown && !document.body.classList.contains("nav-open"));
      }

      if (bar) bar.style.setProperty("--progress", clamp(max > 0 ? (y / max) * 100 : 0, 0, 100) + "%");

      lastY = y;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    update();
  })();

  /* ---------------------------------------------------------
     3. Mobile navigation
     --------------------------------------------------------- */
  (function navigation() {
    var toggle = $("#menuToggle");
    var nav = $("#primaryNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) setOpen(false);
    });
  })();

  /* ---------------------------------------------------------
     4. Scroll activation: reveals, counters and skill bars
     ---------------------------------------------------------
     A single rAF-throttled sweep rather than three observers, so
     a fast scroll, anchor jump or restored scroll position can
     never leave an element stuck in its "before" state.
     --------------------------------------------------------- */
  (function activation() {
    var groups = [
      { items: $$(".reveal"), activate: activateReveal },
      { items: $$(".count"), activate: runCounter },
      { items: $$(".bar > i"), activate: activateBar }
    ].filter(function (group) { return group.items.length > 0; });

    if (!groups.length) return;

    var running = false;
    var settleTimer = null;

    function revealIndex(el) {
      var index = 0;
      var node = el;
      while (node.previousElementSibling) {
        node = node.previousElementSibling;
        if (node.classList && node.classList.contains("reveal")) index++;
      }
      return Math.min(index, 6);
    }

    function activateReveal(el) {
      el.style.setProperty("--reveal-delay", revealIndex(el) * 70 + "ms");
      el.classList.add("is-in");
    }

    function runCounter(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      if (prefersReduced) { el.textContent = String(target); return; }

      var duration = 1400;
      var start = null;

      function step(now) {
        if (start === null) start = now;
        var t = clamp((now - start) / duration, 0, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    function activateBar(el) {
      var column = el.parentNode && el.parentNode.parentNode;
      var all = column ? Array.prototype.slice.call(column.querySelectorAll(".bar > i")) : [el];
      el.style.transitionDelay = (Math.max(0, all.indexOf(el)) % 3) * 120 + "ms";
      el.classList.add("is-filled");
    }

    function allDone() {
      return groups.every(function (group) { return group.items.length === 0; });
    }

    function sweep() {
      running = false;
      var limit = window.innerHeight * 0.88;

      groups.forEach(function (group) {
        group.items = group.items.filter(function (el) {
          if (el.getBoundingClientRect().top >= limit) return true;
          group.activate(el);
          return false;
        });
      });

      if (allDone()) {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      }
    }

    function schedule() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(sweep);
    }

    if (prefersReduced) {
      groups.forEach(function (group) {
        group.items.forEach(group.activate);
        group.items = [];
      });
      return;
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    document.addEventListener("visibilitychange", schedule);

    // Late layout shifts (webfonts, images, theme swap) are re-checked too.
    var ticks = 0;
    settleTimer = window.setInterval(function () {
      ticks++;
      if (allDone() || document.hidden || ticks > 20) { window.clearInterval(settleTimer); return; }
      schedule();
    }, 900);

    schedule();
  })();

  /* ---------------------------------------------------------
     5. Parallax engine (single loop, lerped)
     --------------------------------------------------------- */
  var parallax = (function () {
    var depthNodes = $$("[data-depth]");
    if (!depthNodes.length || prefersReduced) return { start: function () {} };

    var pointer = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var scrollNorm = 0;
    var easedScroll = 0;
    var active = false;
    var running = false;

    function readPointer(event) {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!active) { active = true; start(); }
    }

    function readScroll() {
      scrollNorm = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 2.2);
    }

    function frame() {
      eased.x = lerp(eased.x, pointer.x, 0.075);
      eased.y = lerp(eased.y, pointer.y, 0.075);
      easedScroll = lerp(easedScroll, scrollNorm, 0.1);

      depthNodes.forEach(function (node) {
        var depth = parseFloat(node.getAttribute("data-depth")) || 0.1;
        var tx = -eased.x * depth * 90;
        var ty = -eased.y * depth * 60 + easedScroll * depth * 70;
        var tz = depth * 40 - easedScroll * depth * 30;
        node.style.setProperty("--tx", tx.toFixed(2) + "px");
        node.style.setProperty("--ty", ty.toFixed(2) + "px");
        node.style.setProperty("--tz", tz.toFixed(2) + "px");
        node.style.setProperty("--rx", (-eased.y * depth * 5).toFixed(3) + "deg");
        node.style.setProperty("--ry", (eased.x * depth * 5).toFixed(3) + "deg");
      });

      if (running) window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    function stop() { running = false; }

    window.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return;
      readPointer(event);
    }, { passive: true });

    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();
    start();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    return { start: start, stop: stop };
  })();

  /* ---------------------------------------------------------
     6. Particle field (2D canvas with fake depth)
     --------------------------------------------------------- */
  (function field() {
    var canvas = $("#scene");
    if (!canvas) return;
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var stars = [];
    var pointer = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var running = false;
    var scrollY = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var density = clamp(Math.round((width * height) / 16000), 40, 150);
      stars = [];
      for (var i = 0; i < density; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: 0.18 + Math.random() * 0.82,
          r: 0.5 + Math.random() * 1.7,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.12 + Math.random() * 0.5
        });
      }
    }

    function draw(dt) {
      var cs = window.getComputedStyle(document.documentElement);
      var accent = (cs.getPropertyValue("--accent") || "#6ee7ff").trim();
      var accent2 = (cs.getPropertyValue("--accent-2") || "#a78bfa").trim();
      var dark = document.documentElement.getAttribute("data-theme") !== "light";

      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        if (!prefersReduced) {
          star.twinkle += dt * 0.0016;
          star.y += star.speed * star.z * (dt * 0.012);
          if (star.y - 8 > height) { star.y = -8; star.x = Math.random() * width; }
        }

        var px = star.x + (-eased.x * 60 - scrollY * 0.045) * star.z;
        var py = star.y + (-eased.y * 40) * star.z;
        var size = star.r * (0.5 + star.z);
        var alpha = (dark ? 0.24 : 0.3) + star.z * (dark ? 0.5 : 0.42);
        var twinkle = prefersReduced ? 1 : (0.72 + Math.sin(star.twinkle) * 0.28);

        ctx.beginPath();
        ctx.fillStyle = i % 4 === 0 ? accent2 : accent;
        ctx.globalAlpha = clamp(alpha * twinkle, 0, 1);
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    var last = 0;
    function loop(now) {
      var dt = last ? now - last : 16;
      last = now;
      eased.x = lerp(eased.x, pointer.x, 0.05);
      eased.y = lerp(eased.y, pointer.y, 0.05);
      draw(dt);
      if (running) window.requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      window.requestAnimationFrame(loop);
    }
    function stop() { running = false; }

    window.addEventListener("pointermove", function (event) {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    window.addEventListener("scroll", function () {
      scrollY = window.scrollY;
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    resize();
    if (prefersReduced) { draw(16); } else { start(); }
  })();

  /* ---------------------------------------------------------
     7. 3D tilt for cards
     --------------------------------------------------------- */
  (function tilt() {
    var cards = $$(".tilt-card, .tilt");
    if (!cards.length || prefersReduced || !supportsFinePointer) return;

    cards.forEach(function (card) {
      var raf = null;
      var target = { rx: 0, ry: 0, mx: 50, my: 50 };

      function render() {
        raf = null;
        card.style.setProperty("--rx", target.rx.toFixed(2) + "deg");
        card.style.setProperty("--ry", target.ry.toFixed(2) + "deg");
        card.style.setProperty("--mx", target.mx.toFixed(1) + "%");
        card.style.setProperty("--my", target.my.toFixed(1) + "%");
      }

      function schedule() { if (!raf) raf = window.requestAnimationFrame(render); }

      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        var py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        target.ry = (px - 0.5) * 12;
        target.rx = (0.5 - py) * 10;
        target.mx = px * 100;
        target.my = py * 100;
        schedule();
      });

      card.addEventListener("pointerleave", function () {
        target.rx = 0; target.ry = 0; target.mx = 50; target.my = 50;
        schedule();
      });

      card.addEventListener("focusin", function () {
        target.rx = 3; target.ry = -4;
        schedule();
      });
      card.addEventListener("focusout", function () {
        target.rx = 0; target.ry = 0;
        schedule();
      });
    });
  })();

  /* ---------------------------------------------------------
     8. Magnetic buttons + cursor glow
     --------------------------------------------------------- */
  (function pointerExtras() {
    if (!supportsFinePointer || prefersReduced) return;

    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        var rect = el.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = "translate3d(" + (x * 10).toFixed(2) + "px," + (y * 8 - 2).toFixed(2) + "px,0)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    var glow = $(".cursor-glow");
    if (!glow) return;
    var gx = 0, gy = 0, tx = 0, ty = 0, raf = null;

    function loop() {
      gx = lerp(gx, tx, 0.12);
      gy = lerp(gy, ty, 0.12);
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      raf = window.requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", function (event) {
      tx = event.clientX;
      ty = event.clientY;
      if (!glow.classList.contains("is-active")) {
        glow.classList.add("is-active");
        gx = tx; gy = ty;
        raf = window.requestAnimationFrame(loop);
      }
    }, { passive: true });

    window.addEventListener("pointerdown", function () {
      glow.style.filter = "brightness(1.5)";
      window.setTimeout(function () { glow.style.filter = ""; }, 180);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) { window.cancelAnimationFrame(raf); raf = null; }
    });
  })();

  /* ---------------------------------------------------------
     9. Copy email
     --------------------------------------------------------- */
  (function copyEmail() {
    var btn = $("#copyEmail");
    var emailLink = $("#emailLink");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy") || "";
      var restore = btn.textContent;

      function selectAddress() {
        if (!emailLink) return;
        try {
          var range = document.createRange();
          range.selectNodeContents(emailLink);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) { /* selection unavailable */ }
      }

      function done(ok) {
        if (!ok) selectAddress();
        btn.textContent = ok ? "Copied" : "Press Ctrl+C";
        window.setTimeout(function () { btn.textContent = restore; }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
      } else {
        var temp = document.createElement("textarea");
        temp.value = value;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(temp);
        done(ok);
      }
    });
  })();

  /* ---------------------------------------------------------
     10. Contact form (mailto handoff with validation)
     --------------------------------------------------------- */
  (function contactForm() {
    var form = $("#contactForm");
    if (!form) return;
    var status = $("#formStatus");
    var emailLink = $("#emailLink");

    function fieldOf(input) { return input.closest ? input.closest(".field") : null; }
    function mark(input, invalid) {
      var wrap = fieldOf(input);
      if (wrap) wrap.classList.toggle("has-error", invalid);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = $("#name");
      var email = $("#email");
      var message = $("#message");
      var errors = [];

      if (!name.value.trim()) { mark(name, true); errors.push("your name"); } else { mark(name, false); }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        mark(email, true); errors.push("a valid email");
      } else { mark(email, false); }
      if (message.value.trim().length < 10) { mark(message, true); errors.push("a short brief"); } else { mark(message, false); }

      if (errors.length) {
        status.textContent = "Please add " + errors.join(", ") + ".";
        status.classList.add("is-error");
        (errors[0].indexOf("email") > -1 ? email : name).focus();
        return;
      }

      var to = emailLink ? (emailLink.textContent || "").trim() : "hello@example.com";
      var subject = "New project enquiry from " + name.value.trim();
      var body = message.value.trim() + "\n\n— " + name.value.trim() + "\n" + email.value.trim();
      status.classList.remove("is-error");
      status.textContent = "Opening your mail client…";
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });

    $$("input, textarea", form).forEach(function (input) {
      input.addEventListener("input", function () {
        if (input.value.trim()) mark(input, false);
      });
    });
  })();

  /* ---------------------------------------------------------
     11. Active navigation link
     --------------------------------------------------------- */
  (function activeSection() {
    var links = $$("[data-nav]");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      var section = id ? document.getElementById(id) : null;
      if (section) map[id] = link;
    });

    var ids = Object.keys(map);
    if (!ids.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.classList.remove("is-active"); });
        var link = map[entry.target.id];
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    ids.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  })();

  /* ---------------------------------------------------------
     12. Misc: footer year
     --------------------------------------------------------- */
  (function misc() {
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  })();

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (event) {
      prefersReduced = event.matches;
    });
  }
})();
