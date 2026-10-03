/* MFS motion system: shared by every page.
   - Scroll reveals with staggered groups (opacity + transform only)
   - Word-by-word heading reveals
   - Count-up stats with a drawing gold rule
   - Scroll progress bar, header state, gentle image parallax
   - Cursor spotlight on cards and magnetic primary buttons (mouse only)
   Everything is skipped for visitors who prefer reduced motion, and nothing is
   hidden unless this script runs, so content is never lost if it fails to load.
*/
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) {
    doc.classList.remove("motion");
    document.querySelectorAll(".blueprint").forEach(function (b) { b.classList.add("is-built"); });
    return;
  }
  doc.classList.add("motion");

  var STAGGER = 80;        // ms, matches --stagger-normal
  var SETTLE = 1700;       // ms: the longest reveal (photo) plus its stagger

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function inView(el) { var r = el.getBoundingClientRect(); return r.top < window.innerHeight * 0.92 && r.bottom > 0; }

  /* ---------- 1. Reveal groups ----------
     [selector, effect]; siblings matched by the same selector inside one parent
     are staggered 70 ms apart (capped), so grids cascade instead of popping. */
  var GROUPS = [
    [".section-head > .bar, .process-head > .bar, .stack > .bar, .prose > .eyebrow", "bar"],
    [".section-head > .eyebrow, .process-head > .eyebrow, .stack > .eyebrow", "fade"],
    [".section-head > .lead, .process-head > .lead, .process-head > .process-note, .process-head > .btn", "up"],
    [".glance .stat", "stat"],
    [".prop-tabs .prop-tab, .prop-tab", "up"],
    [".prop-panel", "panel"],
    [".bento .tile", "alt"],
    [".vm .card", "flip"],
    [".choose .choose-card", "up"],
    [".commit li, .closing-checks li, .checks li", "left"],
    [".chips .chip", "pop"],
    [".ind-grid .ind-card", "up"],
    [".grid > .card, .grid > article, .svc", "up"],
    [".founder > img", "photo"],
    [".founder .prose > p, .founder .prose > .btn-row", "up"],
    [".founder-strip", "up"],
    [".exist-words span", "word"],
    [".two-col > *, .partner-band, .after-steps, .eco-banner", "up"],
    [".closing-actions > *", "up"],
    [".footer-grid > *", "fade"],
    [".form-wrap > *", "up"]
  ];
  var tagged = [];
  GROUPS.forEach(function (g) {
    $$(g[0]).forEach(function (el) {
      if (el.hasAttribute("data-r") || el.closest(".hero, .acm, [data-tl]")) return;
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(g[0]); });
      var i = Math.min(sibs.indexOf(el), 8);
      if (inView(el)) { return; }                 // already on screen: leave it be, no flash
      var effect = g[1] === "alt" ? (i % 2 === 0 ? "from-left" : "from-right") : g[1];
      el.setAttribute("data-r", effect);
      el.style.setProperty("--d", (i * STAGGER) + "ms");
      tagged.push(el);
    });
  });

  /* ---------- 2. Word-by-word headings ---------- */
  $$(".section-head h2, .process-head h2, .stack > h2, .prose > h2, .closing h2, .founder-strip .fq").forEach(function (h) {
    if (h.closest(".hero") || inView(h) || h.querySelector("*:not(br)")) return;
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--wi:' + i + '">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span></span>";
    }).join(" ");
    h.setAttribute("data-r", "words");
    tagged.push(h);
  });

  /* ---------- 3. Reveal on scroll ---------- */
  // Once an element has arrived, drop its reveal state so hover and tilt respond instantly.
  function settle(el) {
    setTimeout(function () { el.removeAttribute("data-r"); el.style.removeProperty("--d"); }, SETTLE);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
        settle(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    tagged.forEach(function (el) {
      if (el.getAttribute("data-r") !== "photo") { io.observe(el); return; }
      // A fully clipped image can't report its own visibility, so watch its section instead.
      var pio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { el.classList.add("is-in"); settle(el); pio.disconnect(); }
      }, { rootMargin: "0px 0px -15% 0px" });
      pio.observe(el.parentNode);
    });
    // Colour strip and closing section get a class when they arrive
    $$(".strip, .closing, .glance").forEach(function (el) {
      if (inView(el)) { el.classList.add("is-in"); return; }
      io.observe(el);
    });
  } else {
    tagged.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 4. Scroll progress, header state, parallax ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var header = document.querySelector(".site-header");
  var parallax = $$(".founder > img, .page-hero .wrap");
  var ticking = false;
  function frame() {
    ticking = false;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
    if (header) header.classList.toggle("is-scrolled", y > 8);
    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // -1..1
      var amt = el.tagName === "IMG" ? -22 : 18;
      el.style.setProperty("--py", (c * amt).toFixed(1) + "px");
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  /* ---------- 5. Ecotech blueprint: grid -> wireframe -> structure ---------- */
  $$(".blueprint").forEach(function (bp) {
    if (inView(bp)) { bp.classList.add("is-built"); return; }
    bp.classList.add("bp-pending");
    var stages = $$(".bp-stages span", bp);
    var bio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      bio.disconnect();
      bp.classList.remove("bp-pending");
      [200, 900, 1700].forEach(function (t, i) { setTimeout(function () { if (stages[i]) stages[i].classList.add("is-on"); }, t); });
      setTimeout(function () { bp.classList.add("is-built"); }, 2400);
    }, { threshold: 0.35 });
    bio.observe(bp);
  });

  /* ---------- 6. Dark sections open up as they arrive (not on phones) ---------- */
  var clipped = window.innerWidth >= 768 ? $$(".section--navy, .closing").filter(function (el) { return !inView(el) && !el.closest(".hero"); }) : [];
  clipped.forEach(function (el) { el.classList.add("clip-in"); el.style.setProperty("--cp", 1); });

  /* ---------- 7. Chapter rail: a gold line that fills as you travel down the page ---------- */
  var chapters = [];
  $$("main > section").forEach(function (sec) {
    var label = sec.getAttribute("data-chapter");
    if (!label) {
      if (sec.classList.contains("hero") || sec.classList.contains("page-hero")) label = "Overview";
      else if (sec.classList.contains("closing")) label = "Get started";
      else {
        var eb = sec.querySelector(".section-head .eyebrow, .process-head .eyebrow, .stack > .eyebrow, .prose > .eyebrow");
        if (eb) label = eb.textContent.trim();
      }
    }
    if (label) chapters.push({ el: sec, label: label.length > 28 ? label.slice(0, 26) + "…" : label });
  });
  if (chapters.length > 7) chapters = chapters.slice(0, 6).concat(chapters.slice(-1));
  var rail = null, railLinks = [];
  if (chapters.length >= 3) {
    rail = document.createElement("nav");
    rail.className = "chapters"; rail.setAttribute("aria-label", "Page sections");
    rail.innerHTML = '<div class="rail" aria-hidden="true"><i></i></div>' + chapters.map(function (c, i) {
      return '<a href="#" data-i="' + i + '"><span><b>' + String(i + 1).padStart(2, "0") + "</b>" + c.label.replace(/</g, "&lt;") + "</span></a>";
    }).join("");
    document.body.appendChild(rail);
    railLinks = $$("a", rail);
    railLinks.forEach(function (a) {
      a.setAttribute("aria-label", chapters[+a.dataset.i].label);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        chapters[+a.dataset.i].el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  var lastCurrent = -1, flashT;
  function placeRail() {
    if (!rail) return;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    chapters.forEach(function (c, i) {
      var top = c.el.getBoundingClientRect().top + window.scrollY;
      c.at = Math.min(1, Math.max(0, (top - 80) / max));
      railLinks[i].style.top = (c.at * 100).toFixed(2) + "%";
    });
  }
  function updateExtras() {
    var vh = window.innerHeight;
    clipped.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var cp = Math.max(0, Math.min(1, (r.top - vh * 0.3) / (vh * 0.7)));
      el.style.setProperty("--cp", cp.toFixed(3));
    });
    if (!rail) return;
    var max = Math.max(1, doc.scrollHeight - vh);
    var prog = Math.min(1, window.scrollY / max);
    rail.style.setProperty("--prog", prog.toFixed(4));
    var cur = 0;
    chapters.forEach(function (c, i) { if (c.el.getBoundingClientRect().top <= vh * 0.4) cur = i; });
    railLinks.forEach(function (a, i) {
      a.classList.toggle("is-past", i < cur);
      a.classList.toggle("is-current", i === cur);
      if (i === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    if (cur !== lastCurrent && lastCurrent !== -1) {   // briefly show the new section's name
      var link = railLinks[cur];
      link.classList.add("flash"); clearTimeout(flashT);
      flashT = setTimeout(function () { link.classList.remove("flash"); }, 1400);
    }
    lastCurrent = cur;
  }
  var tick2 = false;
  function onScroll2() { if (!tick2) { tick2 = true; requestAnimationFrame(function () { tick2 = false; updateExtras(); }); } }
  window.addEventListener("scroll", onScroll2, { passive: true });
  window.addEventListener("resize", function () { placeRail(); onScroll2(); });
  window.addEventListener("load", function () { placeRail(); onScroll2(); });
  placeRail(); updateExtras();

  /* ---------- 8. Buttons: a soft ripple from the press point ---------- */
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".btn, .dock a");
    if (!b) return;
    var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
    var dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = (e.clientX - r.left - size / 2) + "px";
    dot.style.top = (e.clientY - r.top - size / 2) + "px";
    b.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 650);
  });

  if (!fine) return;

  /* ---------- 9. Service tiles tilt toward the cursor (2°, mouse only) ---------- */
  $$(".bento .tile").forEach(function (t) {
    t.classList.add("tilt");
    t.addEventListener("pointermove", function (e) {
      var r = t.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.style.setProperty("--ry", (x * 4).toFixed(2) + "deg");
      t.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
    });
    t.addEventListener("pointerleave", function () { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); });
  });

  /* ---------- 5. Cursor spotlight on cards ---------- */
  $$(".card, .choose-card, .ind-card, .tl-card, .prop-tab, .prop-recs, .stat").forEach(function (el) {
    el.classList.add("spot");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- 6. Magnetic primary buttons (max 4 px) ---------- */
  $$(".btn-sun, .dock-go, .tile--dark .tile-cta").forEach(function (b) {
    b.classList.add("magnetic");
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      b.style.setProperty("--tx", (dx * 4).toFixed(1) + "px");
      b.style.setProperty("--ty", (dy * 3).toFixed(1) + "px");
    });
    b.addEventListener("pointerleave", function () { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
  });
})();
