/* Moisapula Facilities Solutions: services explorer (services page)
   - Property matcher highlights the divisions that suit each property type
   - Scroll moves the focus through the services; a gold line runs Client -> Outcome
   - Hover / focus a card: tilt, cursor light, chips unfold, panel updates
   - Configurator panel with the service ecosystem
*/
(function () {
  var root = document.querySelector(".svx");
  if (!root) return;
  var data = JSON.parse(document.getElementById("svx-data").textContent);
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7"/></svg>';
  var DASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 12h10"/></svg>';

  var cards = Array.prototype.slice.call(root.querySelectorAll(".svx-card"));
  var order = cards.map(function (c) { return c.dataset.slug; });
  var props = Array.prototype.slice.call(root.querySelectorAll(".svx-prop"));
  var nodes = Array.prototype.slice.call(root.querySelectorAll(".eco-node"));
  var lines = Array.prototype.slice.call(root.querySelectorAll(".eco-lines path"));
  var bento = root.querySelector(".svx-bento");
  var rail = root.querySelector(".svx-rail");
  var railLine = root.querySelector(".svx-rail-line");
  var el = function (id) { return document.getElementById(id); };
  var eyebrow = el("cfg-eyebrow"), title = el("cfg-title"), sub = el("cfg-sub"), label = el("cfg-label"),
      list = el("cfg-list"), pack = el("cfg-pack"), cta = el("cfg-cta"), ctaT = el("cfg-cta-t");

  var prop = "all", focus = order[0], hovering = null, dots = [];

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function render() {
    var matched = prop === "all" ? order : data.match[prop];
    var f = hovering || focus;
    cards.forEach(function (c) {
      var s = c.dataset.slug, inc = matched.indexOf(s) >= 0;
      c.classList.toggle("is-focus", s === f);
      c.classList.toggle("is-dim", !inc);
      c.classList.toggle("is-match", prop !== "all" && inc);
    });
    nodes.forEach(function (n) {
      var s = n.dataset.slug, inc = matched.indexOf(s) >= 0;
      n.classList.toggle("on", inc); n.classList.toggle("off", !inc); n.classList.toggle("focus", s === f && inc);
    });
    lines.forEach(function (l) {
      var s = l.dataset.slug, inc = matched.indexOf(s) >= 0;
      l.classList.toggle("on", inc); l.classList.toggle("focus", s === f && inc);
    });
  }

  function panel() {
    var f = hovering || focus;
    if (prop === "all") {
      var d = data.divs[f];
      eyebrow.textContent = "Service focus";
      title.textContent = d.name;
      sub.textContent = d.tagline;
      label.textContent = "Recommended for";
      list.className = "cfg-list serve";
      list.innerHTML = d.serve.map(function (t, i) { return '<li style="--i:' + i + '">' + esc(t) + "</li>"; }).join("");
      pack.hidden = true;
      cta.href = "contact.html#" + f;
      ctaT.textContent = d.cta;
    } else {
      var e = data.envs[prop], m = data.match[prop];
      eyebrow.textContent = "Recommended for your property";
      title.textContent = e.title;
      sub.textContent = m.length + " of 4 divisions, under one contract.";
      label.textContent = "Services included";
      list.className = "cfg-list incl";
      list.innerHTML = order.map(function (s, i) {
        var yes = m.indexOf(s) >= 0;
        return '<li style="--i:' + i + '" class="' + (yes ? "yes" : "no") + (s === f ? " focus" : "") + '">' + (yes ? CHECK : DASH) + esc(data.divs[s].name) + "</li>";
      }).join("");
      pack.hidden = false;
      pack.innerHTML = "Suggested package: <b>" + esc(e.pack) + "</b>";
      cta.href = "contact.html#" + prop;
      ctaT.textContent = e.cta;
    }
  }
  var lastPanelKey = "";
  function update() {
    render();
    var key = prop + "|" + (prop === "all" ? (hovering || focus) : "");
    if (key !== lastPanelKey) { lastPanelKey = key; panel(); }
    else if (prop !== "all") {
      var f = hovering || focus;
      Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle("focus", order[i] === f); });
    }
  }

  // Property matcher
  props.forEach(function (b) {
    b.addEventListener("click", function () {
      prop = b.dataset.k;
      props.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      update();
    });
  });

  // Hover / focus a card
  cards.forEach(function (c) {
    c.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hovering = c.dataset.slug; update(); } });
    c.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") { hovering = null; update(); }
      c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
    });
    c.addEventListener("focusin", function () { hovering = c.dataset.slug; update(); });
    c.addEventListener("focusout", function (e) { if (!c.contains(e.relatedTarget)) { hovering = null; update(); } });
    c.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      c.classList.toggle("is-open");
      focus = c.dataset.slug; update();
    });
    if (fine && !reduce) c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      c.style.setProperty("--ry", ((x - 0.5) * 6).toFixed(2) + "deg");
      c.style.setProperty("--rx", ((0.5 - y) * 5).toFixed(2) + "deg");
    });
  });

  // Cards animate only while on screen
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("in", e.isIntersecting); });
    }, { rootMargin: "0px 0px -10% 0px" });
    cards.forEach(function (c) { io.observe(c); });
  } else cards.forEach(function (c) { c.classList.add("in"); });

  // Gold rail dots, one per row of cards
  function placeDots() {
    if (!rail || !railLine) return;
    dots.forEach(function (d) { d.remove(); });
    dots = [];
    if (getComputedStyle(rail).display === "none") return;
    var top0 = bento.getBoundingClientRect().top, seen = {};
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect(), y = Math.round(r.top - top0 + r.height / 2);
      if (seen[y]) return; seen[y] = true;
      var d = document.createElement("span"); d.className = "svx-dot"; d.style.top = y + "px"; d.dataset.y = y;
      rail.appendChild(d); dots.push(d);
    });
  }

  // Scroll: the gold line fills and the focus moves through the services
  function onScroll() {
    var r = bento.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh * 0.55 - r.top) / r.height));
    if (railLine) railLine.style.setProperty("--p", p.toFixed(3));
    var lineY = p * r.height;
    dots.forEach(function (d) { d.classList.toggle("on", lineY >= +d.dataset.y - 2); });
    if (p <= 0 || p >= 1) return;
    var next = order[Math.min(order.length - 1, Math.floor(p * order.length))];
    if (next !== focus) { focus = next; if (!hovering) update(); }
  }
  var tick = false;
  window.addEventListener("scroll", function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; onScroll(); });
  }, { passive: true });
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { placeDots(); onScroll(); }, 150); });
  window.addEventListener("load", function () { placeDots(); onScroll(); });

  placeDots();
  update();
  onScroll();
})();
