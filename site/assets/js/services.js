/* Moisapula Facilities Solutions: Services page
   1. Service navigator: compact bar that follows you down the page and highlights the section you are in
   2. Capabilities: always open on desktop, accordions on phones
   3. Photos: one-time reveal, gentle pointer depth on desktop
   4. Ecotech line, How it works line: play once in view
   5. Properties grid: tap to show the services that apply
*/
(function () {
  var root = document.documentElement;
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; };
  var reduce = mm("(prefers-reduced-motion: reduce)").matches;
  var fine = mm("(hover: hover) and (pointer: fine)").matches;
  var phone = mm("(max-width: 700px)");
  var hasIO = "IntersectionObserver" in window;
  root.classList.add("js-sv");

  // ---------- 1. Navigator ----------
  var heroNav = document.querySelector(".sv-nav--hero");
  var bar = document.querySelector(".sv-nav--sticky");
  var secs = Array.prototype.slice.call(document.querySelectorAll("[data-sv-sec]"));
  var header = document.querySelector(".site-header .nav-row") || document.querySelector(".site-header");
  var current = "";
  function place() {
    if (!bar || !header) return;
    var b = header.getBoundingClientRect().bottom;
    bar.style.setProperty("--sv-top", Math.max(8, Math.round(b + 8)) + "px");
  }
  function update() {
    ticking = false;
    if (!bar || !heroNav || !secs.length) return;
    var vh = window.innerHeight;
    var navGone = heroNav.getBoundingClientRect().bottom < 60;
    var last = secs[secs.length - 1].getBoundingClientRect();
    var show = navGone && last.bottom > vh * 0.35;
    bar.classList.toggle("is-on", show);
    bar.setAttribute("aria-hidden", show ? "false" : "true");
    Array.prototype.forEach.call(bar.querySelectorAll("a"), function (a) { a.tabIndex = show ? 0 : -1; });
    var id = "";
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * 0.4) id = s.getAttribute("data-sv-sec"); });
    if (id !== current) {
      current = id;
      Array.prototype.forEach.call(bar.querySelectorAll(".sv-pill"), function (a) {
        var on = a.getAttribute("data-sv") === id;
        a.classList.toggle("is-active", on);
        if (on) { a.setAttribute("aria-current", "true"); if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: a.offsetLeft - 12, behavior: reduce ? "auto" : "smooth" }); }
        else a.removeAttribute("aria-current");
      });
    }
    place();
  }
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();

  // ---------- 2. Capabilities ----------
  var caps = Array.prototype.slice.call(document.querySelectorAll(".sv-cap"));
  function setCaps() {
    caps.forEach(function (d, i) { d.open = !phone.matches || (d.dataset.userOpen === "1"); });
  }
  caps.forEach(function (d) {
    d.querySelector("summary").addEventListener("click", function (e) {
      if (!phone.matches) { e.preventDefault(); return; }
      d.dataset.userOpen = d.open ? "0" : "1";
    });
  });
  setCaps();
  if (phone.addEventListener) phone.addEventListener("change", setCaps);

  // ---------- 3 & 4. Play once in view ----------
  var plays = Array.prototype.slice.call(document.querySelectorAll(".sv-photo, .sv-link-line, .sv-how-steps"));
  if (reduce || !hasIO) plays.forEach(function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -18% 0px" });
    plays.forEach(function (el) { io.observe(el); });
  }

  // Pointer depth (desktop only, max 4px)
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll(".sv-photo[data-depth]"), function (f) {
      var raf = 0, x = 0, y = 0;
      function apply() { raf = 0; f.style.setProperty("--dx", x.toFixed(2) + "px"); f.style.setProperty("--dy", y.toFixed(2) + "px"); }
      f.addEventListener("pointermove", function (e) {
        var r = f.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width - 0.5) * -8;
        y = ((e.clientY - r.top) / r.height - 0.5) * -8;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      f.addEventListener("pointerleave", function () { x = 0; y = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }

  // ---------- 5. Properties grid ----------
  var props = Array.prototype.slice.call(document.querySelectorAll(".sv-prop"));
  props.forEach(function (p) {
    p.addEventListener("click", function () {
      if (fine) return;
      var was = p.classList.contains("is-open");
      props.forEach(function (q) { q.classList.remove("is-open"); });
      if (!was) p.classList.add("is-open");
    });
  });
})();
