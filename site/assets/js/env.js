/* Moisapula Facilities Solutions: "Choose your environment" (industries page)
   - Selector drives the info card, the 3D building and the gold connection line
   - Desktop (1100px+, tall enough): the section pins and scrolling cycles environments
   - Tablet / short desktop: click to switch, gentle auto-cycle until the visitor interacts
   - Mobile: swipeable cards, no WebGL
   - Reduced motion: fades only, no pinning, no auto-cycle
*/
(function () {
  var root = document.querySelector(".env");
  if (!root) return;
  var scriptSrc = (document.currentScript && document.currentScript.src) || "assets/js/env.js";
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; };
  var reduce = mm("(prefers-reduced-motion: reduce)").matches;
  var mqMobile = mm("(max-width: 767px)");
  var mqPin = mm("(min-width: 1100px) and (min-height: 700px)");
  var mqFine = mm("(hover: hover) and (pointer: fine)");

  var track = root.querySelector(".env-track");
  var sticky = root.querySelector(".env-sticky");
  var tablist = root.querySelector(".env-tabs");
  var tabs = Array.prototype.slice.call(root.querySelectorAll(".env-tab"));
  var cards = Array.prototype.slice.call(root.querySelectorAll(".env-card"));
  var arts = Array.prototype.slice.call(root.querySelectorAll(".env-art"));
  var dots = Array.prototype.slice.call(root.querySelectorAll(".env-dots i"));
  var panels = root.querySelector(".env-panels");
  var ind = root.querySelector(".env-ind");
  var link = root.querySelector(".env-link");
  var client = root.querySelector(".env-client");
  var canvas = root.querySelector(".env-canvas");
  var keys = tabs.map(function (t) { return t.dataset.k; });
  var n = keys.length;

  var idx = 0, scene = null, glState = "none", inView = false, touched = false, cycle = 0;
  var pinned = false, step = 0, lockUntil = 0;

  // Word-by-word headline for the intro
  var h1 = root.querySelector(".env-head h1");
  if (h1 && !reduce) {
    var words = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = words.map(function (w, i) { return '<span class="w" style="--w:' + i + '">' + w + "</span>"; }).join(" ");
    root.classList.add("intro");
    setTimeout(function () { root.classList.remove("intro"); }, 2200);
  }

  function placeIndicator() {
    var t = tabs[idx];
    if (!ind || !t || mqMobile.matches) return;
    ind.style.setProperty("--y", t.offsetTop + "px");
    ind.style.setProperty("--h", t.offsetHeight + "px");
  }

  function select(i, how) {
    i = Math.max(0, Math.min(n - 1, i));
    var changed = i !== idx;
    idx = i;
    var k = keys[i];
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    cards.forEach(function (c, j) { c.classList.toggle("is-active", j === i); });
    arts.forEach(function (a, j) { a.classList.toggle("is-active", j === i); });
    dots.forEach(function (d, j) { d.classList.toggle("on", j === i); });
    if (client) client.textContent = "Your " + (tabs[i].dataset.noun || "site");
    placeIndicator();
    // Indicator height changes as the active tab expands; re-place after the transition.
    setTimeout(placeIndicator, 420);
    if (changed && link) { link.classList.remove("run"); void link.offsetWidth; link.classList.add("run"); }
    if (scene) scene.show(k, !changed && how === "init");
    if (mqMobile.matches) {
      if (how !== "swipe" && panels) {
        var c = cards[i];
        panels.scrollTo({ left: c.offsetLeft - 20, behavior: how === "init" || reduce ? "auto" : "smooth" });
      }
      var t = tabs[i];
      tablist.scrollTo({ left: Math.max(0, t.offsetLeft - 8), behavior: reduce ? "auto" : "smooth" });
    }
  }

  // ---------- Input: clicks and keyboard ----------
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      touch();
      if (pinned) { scrollToIndex(i); }
      select(i, "tab");
    });
  });
  tablist.addEventListener("keydown", function (e) {
    var map = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    var next = null;
    if (e.key in map) next = (idx + map[e.key] + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault(); touch();
    tabs[next].focus();
    if (pinned) scrollToIndex(next);
    select(next, "tab");
  });

  // ---------- Pinned scroll story (desktop) ----------
  function hdr() { return parseFloat(getComputedStyle(root).getPropertyValue("--hdr")) || 77; }
  function trackTop() { return track.getBoundingClientRect().top + window.scrollY; }
  function setupPin() {
    pinned = mqPin.matches && !reduce;
    root.classList.toggle("is-pinned", pinned);
    if (pinned) {
      step = Math.round(window.innerHeight * 0.42);
      track.style.height = (window.innerHeight - hdr() + n * step) + "px";
    } else {
      track.style.height = "";
      root.style.removeProperty("--p");
    }
    placeIndicator();
  }
  function scrollToIndex(i) {
    lockUntil = performance.now() + 900;
    window.scrollTo({ top: trackTop() - hdr() + i * step + Math.round(step * 0.25), behavior: reduce ? "auto" : "smooth" });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!pinned) return;
      var scrolled = hdr() - track.getBoundingClientRect().top;
      var p = Math.max(0, Math.min(1, scrolled / (n * step)));
      tablist.style.setProperty("--p", p.toFixed(3));
      if (performance.now() < lockUntil) return;
      var i = Math.max(0, Math.min(n - 1, Math.floor(scrolled / step)));
      if (i !== idx) select(i, "scroll");
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Mobile swipe ----------
  var swipeTick = false;
  if (panels) panels.addEventListener("scroll", function () {
    if (!mqMobile.matches || swipeTick) return; swipeTick = true;
    requestAnimationFrame(function () {
      swipeTick = false;
      var mid = panels.scrollLeft + 20, best = 0, bestD = Infinity;
      cards.forEach(function (c, j) { var d = Math.abs(c.offsetLeft - mid); if (d < bestD) { bestD = d; best = j; } });
      if (best !== idx) select(best, "swipe");
    });
  }, { passive: true });

  // ---------- Gentle auto-cycle (unpinned desktop and tablet) ----------
  function touch() { touched = true; stopCycle(); }
  function stopCycle() { if (cycle) { clearInterval(cycle); cycle = 0; } }
  function syncCycle() {
    var want = inView && !touched && !pinned && !reduce && !mqMobile.matches && !document.hidden;
    if (want && !cycle) cycle = setInterval(function () { select((idx + 1) % n, "auto"); }, 6000);
    else if (!want) stopCycle();
  }
  root.addEventListener("pointerdown", touch);
  root.addEventListener("focusin", touch);
  root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") stopCycle(); });
  root.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") syncCycle(); });

  // ---------- 3D (768px+ with WebGL) ----------
  function glCapable() {
    if (mqMobile.matches || (navigator.connection && navigator.connection.saveData)) return false;
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  function syncGL() {
    if (glState === "ready") { scene.setActive(inView && !document.hidden && !mqMobile.matches); return; }
    if (glState !== "none" || !glCapable()) return;
    glState = "loading";
    import(new URL("env-scene.js", scriptSrc).href).then(function (m) {
      scene = m.createEnvScene(canvas, { reduced: reduce, lite: !mqFine.matches });
      glState = "ready";
      root.classList.add("is-gl");
      scene.show(keys[idx], false);
      scene.setActive(inView && !document.hidden);
    }).catch(function () { glState = "failed"; });
  }
  if (!reduce) window.addEventListener("pointermove", function (e) {
    if (!scene || !mqFine.matches) return;
    scene.pointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  // ---------- Visibility ----------
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      syncGL(); syncCycle();
    }, { rootMargin: "100px 0px" }).observe(root);
  } else { inView = true; }
  document.addEventListener("visibilitychange", function () { syncGL(); syncCycle(); });

  function onLayout() { setupPin(); syncGL(); syncCycle(); onScroll(); }
  [mqMobile, mqPin, mqFine].forEach(function (q) { if (q.addEventListener) q.addEventListener("change", onLayout); });
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { setupPin(); onScroll(); }, 150); });

  // ---------- Start ----------
  setupPin();
  var start = keys.indexOf((location.hash || "").slice(1));
  if (start >= 0) {
    touched = true;
    select(start, "init");
    if (pinned) requestAnimationFrame(function () { window.scrollTo(0, trackTop() - hdr() + start * step + Math.round(step * 0.25)); });
    else root.scrollIntoView();
  } else select(0, "init");
  syncGL(); syncCycle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);
})();
