/* Moisapula Facilities Solutions — site script
   1. Mobile menu   2. Copy buttons   3. Count-up stats
   4. Property selector (home)   5. Site assessment form (contact)
*/

// Paste a form endpoint here to receive assessment requests by email
// (for example a free Formspree or Web3Forms endpoint). Leave empty and the
// form shows the visitor a ready-to-send summary with your email address.
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "info@mfscentral.co.za";

(function () {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Navigation: full-screen menu on mobile, sliding pill, mega menus, logo pulse
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    const lbl = toggle.querySelector(".nt-label"); if (lbl) lbl.textContent = open ? "Close" : "Menu";
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
      document.querySelectorAll(".nav-item.has-mega").forEach(function (it) {
        if (it.contains(document.activeElement)) { it.classList.add("closed"); it.querySelector("a").focus(); }
      });
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }
  const links = document.querySelector(".nav-links");
  const pill = document.querySelector(".nav-pill");
  if (links && pill) {
    const current = links.querySelector('a[aria-current="page"]');
    function moveTo(a, isCurrent) {
      if (!a) { pill.style.setProperty("--o", "0"); return; }
      const row = pill.offsetParent || links;
      pill.style.setProperty("--x", (a.getBoundingClientRect().left - row.getBoundingClientRect().left - row.clientLeft) + "px");
      pill.style.setProperty("--w", a.offsetWidth + "px");
      pill.style.setProperty("--o", "1");
      pill.classList.toggle("is-current", !!isCurrent);
    }
    function home() { moveTo(current, true); }
    links.querySelectorAll(".nav-item > a").forEach(function (a) {
      a.addEventListener("pointerenter", function () { moveTo(a, a === current); });
      a.addEventListener("focus", function () { moveTo(a, a === current); });
    });
    links.addEventListener("pointerleave", home);
    links.addEventListener("focusout", function (e) { if (!links.contains(e.relatedTarget)) home(); });
    pill.style.transition = "none"; home(); void pill.offsetWidth; pill.style.transition = "";
    window.addEventListener("resize", home);
    const hdr = document.querySelector(".site-header");
    if (hdr && "MutationObserver" in window) {
      let t1 = 0, t2 = 0;
      new MutationObserver(function () {
        clearTimeout(t1); clearTimeout(t2);
        t1 = setTimeout(home, 120); t2 = setTimeout(home, 400);
      }).observe(hdr, { attributes: true, attributeFilter: ["class"] });
      document.querySelector(".nav-row").addEventListener("transitionend", function (e) { if (e.propertyName === "min-height") home(); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(home);
    document.querySelectorAll(".nav-item.has-mega").forEach(function (it) {
      it.addEventListener("pointerleave", function () { it.classList.remove("closed"); });
      it.addEventListener("focusout", function (e) { if (!it.contains(e.relatedTarget)) it.classList.remove("closed"); });
    });
  }
  const preview = document.querySelector(".mega-preview");
  if (preview) {
    const t = preview.querySelector(".mp-title"), sh = preview.querySelector(".mp-short"), rq = preview.querySelector(".mp-reqs");
    const envs = document.querySelectorAll(".mega-env");
    envs.forEach(function (a) {
      function show() {
        if (a.classList.contains("is-on")) return;
        envs.forEach(function (x) { x.classList.toggle("is-on", x === a); });
        t.textContent = a.dataset.title; sh.textContent = a.dataset.short;
        rq.innerHTML = "";
        a.dataset.reqs.split("|").forEach(function (r) { const li = document.createElement("li"); li.textContent = r; rq.appendChild(li); });
        if (!reduceMotion) { preview.classList.remove("swap"); void preview.offsetWidth; preview.classList.add("swap"); }
      }
      a.addEventListener("pointerenter", show); a.addEventListener("focus", show);
    });
  }
  const brand = document.querySelector(".brand");
  if (brand && !reduceMotion) setTimeout(function () { brand.classList.add("run"); setTimeout(function () { brand.classList.remove("run"); }, 2000); }, 700);

  // 2. Copy buttons
  function flash(button, text) {
    const label = button.querySelector("span") || button;
    const old = label.textContent;
    label.textContent = text;
    setTimeout(function () { label.textContent = old; }, 1800);
  }
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-copy], [data-copy-target]");
    if (!btn) return;
    const target = document.getElementById(btn.dataset.copyTarget || "");
    const text = btn.dataset.copy || (target ? target.textContent : "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn, "Copied"); }).catch(function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      if (target) {
        const range = document.createRange(); range.selectNodeContents(target);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        flash(btn, "Selected");
      } else { flash(btn, text); }
    }
  });

  // 3. Count-up stats (final values are already in the HTML)
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target; io.unobserve(el);
        const end = parseInt(el.dataset.count, 10); const start = performance.now(); const dur = 900;
        (function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c); });
  }

  // 4. Property selector
  const PROPS = {
    estate: { title: "Residential estates", noun: "Estate",
      intro: "Keep common areas clean, gardens green and the estate well maintained, with regular reporting to your trustees.",
      recs: [["clean", "Cleaning & Hygiene", "Clubhouses, entrances, walkways and ablutions"], ["grounds", "Grounds & Landscaping", "Lawns, verges, bush clearing and irrigation"], ["property", "Property Care & Building Works", "Paving, painting, repairs and inspections"]] },
    home: { title: "Residential homes", noun: "Home",
      intro: "Once-off or regular help for your home, from one vetted, uniformed team you can trust on your property.",
      recs: [["clean", "Cleaning & Hygiene", "Regular, spring and move-in or move-out cleans"], ["grounds", "Grounds & Landscaping", "Garden services, tree trimming, bush clearing and irrigation"], ["property", "Property Care & Building Works", "Painting, repairs, paving, rubble removal and building works via Ecotech"]] },
    office: { title: "Commercial offices", noun: "Office",
      intro: "A clean, hygienic and well-run workplace that makes the right impression on staff and visitors.",
      recs: [["clean", "Cleaning & Hygiene", "Daily office cleaning, washrooms and consumables"], ["property", "Property Care", "Repairs, painting and preventative maintenance"], ["support", "Support Services", "Event support and day-to-day facilities help"]] },
    retail: { title: "Retail centres", noun: "Centre",
      intro: "Spotless public areas and washrooms, and a centre that stays presentable through every trading peak.",
      recs: [["clean", "Cleaning & Hygiene", "Public areas, washrooms, glass and pressure washing"], ["property", "Property Care", "Repairs, paving and touch-ups between trading hours"], ["support", "Support Services", "Event support and waste coordination"]] },
    industrial: { title: "Industrial facilities", noun: "Facility",
      intro: "Safe, tidy and operational sites, from warehouse floors to yards, perimeters and civil works.",
      recs: [["clean", "Cleaning & Hygiene", "Heavy-duty cleaning and ablution hygiene"], ["grounds", "Grounds & Landscaping", "Yard, perimeter and bush clearing"], ["property", "Property Care & Building Works", "Maintenance, rubble removal and civil works via Ecotech"]] },
    education: { title: "Educational institutions", noun: "School",
      intro: "Healthy classrooms, safe grounds and maintenance planned around the school calendar.",
      recs: [["clean", "Cleaning & Hygiene", "Classrooms, ablutions and holiday deep cleans"], ["grounds", "Grounds & Landscaping", "Sports fields, gardens and grounds programmes"], ["property", "Property Care", "Repairs, painting and inspections"]] },
    government: { title: "Government and public sector", noun: "Site",
      intro: "Compliant facilities support with documented reporting.",
      recs: [["clean", "Cleaning & Hygiene", "Offices, public areas and washrooms"], ["grounds", "Grounds & Landscaping", "Grounds maintenance programmes"], ["property", "Property Care & Building Works", "Maintenance and infrastructure works via Ecotech"], ["support", "Support Services", "Site support and waste coordination"]] }
  };
  const tabs = document.querySelectorAll(".prop-tab");
  if (tabs.length) {
    const title = document.getElementById("prop-title");
    const intro = document.getElementById("prop-intro");
    const recs = document.getElementById("prop-recs");
    const cta = document.getElementById("prop-cta");
    const panel = document.getElementById("prop-panel");
    function show(key) {
      const p = PROPS[key]; if (!p) return;
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.prop === key ? "true" : "false"); });
      title.textContent = p.title; intro.textContent = p.intro;
      recs.innerHTML = "";
      p.recs.forEach(function (r) {
        const li = document.createElement("li"); li.className = "div-" + r[0];
        const b = document.createElement("b"); b.textContent = r[1];
        const s = document.createElement("span"); s.textContent = r[2];
        li.appendChild(b); li.appendChild(s); recs.appendChild(li);
      });
      cta.href = "contact.html#" + key;
      cta.querySelector(".lbl-lg").textContent = (key === "home" ? "Get a Quote for Your " : "Get a Proposal for Your ") + p.noun;
      if (!reduceMotion) { panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap"); }
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { show(t.dataset.prop); }); });
    show("estate");
  }

  // 5. Site assessment form: see contact.js
})();

/* 6. Contract timeline   7. Service tile parallax   8. Floating contact dock */
(function () {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // 6. Gold progress line grows as you scroll; each step lights up when the line reaches it.
  const timelines = Array.prototype.slice.call(document.querySelectorAll("[data-tl]"));
  timelines.forEach(function (tl) {
    const steps = Array.prototype.slice.call(tl.querySelectorAll(".tl-step"));
    if (reduceMotion) { tl.style.setProperty("--tl", 1); steps.forEach(function (s) { s.classList.add("is-on", "is-seen"); }); return; }
    tl.classList.add("is-live");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-seen"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -12% 0px" });
      steps.forEach(function (s) { io.observe(s); });
    } else { steps.forEach(function (s) { s.classList.add("is-seen"); }); }
  });
  function updateTimelines() {
    if (reduceMotion) return;
    const mark = window.innerHeight * 0.6;              // the line fills up to 60% down the screen
    timelines.forEach(function (tl) {
      const rail = tl.querySelector(".tl-rail");
      const r = rail.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      tl.style.setProperty("--tl", p.toFixed(4));
      tl.querySelectorAll(".tl-step").forEach(function (s) {
        const node = s.querySelector(".tl-node").getBoundingClientRect();
        s.classList.toggle("is-on", node.top + node.height / 2 <= mark);
      });
    });
  }

  // 7. The floating object in each tile drifts slightly toward the cursor.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tile").forEach(function (tile) {
      const art = tile.querySelector(".tile-art");
      if (!art) return;
      tile.addEventListener("pointermove", function (e) {
        const r = tile.getBoundingClientRect();
        art.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 18).toFixed(1) + "px");
        art.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 14).toFixed(1) + "px");
      });
      tile.addEventListener("pointerleave", function () { art.style.setProperty("--px", "0px"); art.style.setProperty("--py", "0px"); });
    });
  }

  // 8. Dock appears after 30% of the page (or a screen and a half on long pages),
  //    and steps aside when the closing call to action or the footer is on screen.
  const dock = document.querySelector("[data-dock]");
  let endVisible = false;
  if (dock && "IntersectionObserver" in window) {
    const ends = document.querySelectorAll(".closing, .site-footer, footer, .env, .ca-assess, .ca-director");
    const seen = new Set();
    const eio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      endVisible = seen.size > 0; updateDock();
    });
    ends.forEach(function (el) { eio.observe(el); });
  }
  function updateDock() {
    if (!dock) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const threshold = Math.min(max * 0.3, window.innerHeight * 1.5);
    const show = max > 0 && window.scrollY >= threshold && !endVisible;
    if (show !== dock.classList.contains("is-shown")) {
      dock.classList.toggle("is-shown", show);
      if (show) dock.removeAttribute("inert"); else dock.setAttribute("inert", "");
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; updateTimelines(); updateDock(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
