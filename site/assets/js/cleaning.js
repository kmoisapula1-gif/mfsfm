/* Moisapula Facilities Solutions: Cleaning & Hygiene page
   1. Service cards: small staggered entrance, once
   2. Tabs: "What we clean" areas and "Where we clean" property types (keyboard friendly)
   3. Photo break: gentle parallax on desktop
   4. Safety & quality: the blue line fills as you scroll through the four standards
   5. FAQ: answers slide open
*/
(function () {
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mm("(prefers-reduced-motion: reduce)").matches;
  var fine = mm("(hover: hover) and (pointer: fine)").matches;
  var desk = mm("(min-width: 961px)").matches;
  var hasIO = "IntersectionObserver" in window;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  document.documentElement.classList.add("js-cl");

  // ---------- 1. Cards ----------
  var cards = $$(".cl-card");
  if (!reduce && hasIO) {
    var grid = document.querySelector(".cl-cards");
    var r = grid && grid.getBoundingClientRect();
    if (grid && r.top > window.innerHeight * 0.9) {
      cards.forEach(function (c, i) { c.classList.add("pre"); c.style.setProperty("--d", Math.min(i, 9) * 50 + "ms"); });
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        cards.forEach(function (c) {
          c.classList.add("in");
          setTimeout(function () { c.classList.remove("pre", "in"); c.style.removeProperty("--d"); }, 1100);
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      io.observe(grid);
    }
  }

  // ---------- 2. Tabs ----------
  function tabs(listSel, tabSel) {
    var list = document.querySelector(listSel);
    if (!list) return;
    var ts = $$(tabSel, list);
    function select(t, focus) {
      ts.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      if (list.scrollWidth > list.clientWidth) {
        var left = t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
      }
    }
    ts.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = ts[(i + 1) % ts.length];
        else if (e.key === "ArrowLeft") n = ts[(i - 1 + ts.length) % ts.length];
        else if (e.key === "Home") n = ts[0];
        else if (e.key === "End") n = ts[ts.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }
  tabs(".cl-tabs", ".cl-tab");
  tabs(".cl-env-bar", ".cl-env-b");

  // ---------- 3 & 4. Scroll effects ----------
  var brk = document.querySelector(".cl-break");
  var img = brk && brk.querySelector(".cl-break-img");
  var stds = document.querySelector(".cl-stds");
  var items = stds ? $$("li", stds) : [];
  var parallax = img && desk && fine && !reduce;
  var tick = false;
  function upd() {
    tick = false;
    var vh = window.innerHeight;
    if (parallax) {
      var b = brk.getBoundingClientRect();
      if (b.bottom > 0 && b.top < vh) {
        var p = (b.top + b.height / 2 - vh / 2) / (vh / 2 + b.height / 2); // -1..1
        img.style.setProperty("--py", (p * b.height * 0.05).toFixed(1) + "px");
      }
    }
    if (stds) {
      var r = stds.getBoundingClientRect();
      var q = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.75 - r.top) / (vh * 0.45)));
      stds.style.setProperty("--p", q.toFixed(3));
      var last = items.length - 1;
      items.forEach(function (li, i) { li.classList.toggle("on", reduce || q >= (last ? i / last : 0) - 0.02 && q > 0.02); });
    }
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  window.addEventListener("resize", upd);
  upd();

  // ---------- 5. FAQ ----------
  $$(".cl-faq-i").forEach(function (d) {
    var sum = d.querySelector("summary"), body = d.querySelector(".cl-faq-a");
    if (!body || reduce || !body.animate) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = "1";
      if (!d.open) {
        d.open = true;
        var h = body.scrollHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 250, easing: "cubic-bezier(.22,1,.36,1)" })
          .onfinish = function () { delete d.dataset.busy; };
      } else {
        var h2 = body.scrollHeight;
        body.animate([{ height: h2 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 220, easing: "ease-in" })
          .onfinish = function () { d.open = false; delete d.dataset.busy; };
      }
    });
  });
})();
