/* Moisapula Facilities Solutions: contact page (guided site assessment)
   1. Hero: line reveal, spotlight, 3D property cluster (desktop, WebGL)
   2. How it works: gold line fills with scroll (pinned on large desktops)
   3. Wizard: sliding steps, smart progress, auto-advance on single choices
   4. Live assessment preview with a 3D view of the selected property
   5. Submission and the "What happens next" screen
   Uses FORM_ENDPOINT and CONTACT_EMAIL from site.js.
*/
(function () {
  var scriptSrc = (document.currentScript && document.currentScript.src) || "assets/js/contact.js";
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; };
  var reduce = mm("(prefers-reduced-motion: reduce)").matches;
  var mqDesk = mm("(min-width: 1024px)");
  var mqFine = mm("(hover: hover) and (pointer: fine)");
  var endpoint = typeof FORM_ENDPOINT !== "undefined" ? FORM_ENDPOINT : "";
  var email = typeof CONTACT_EMAIL !== "undefined" ? CONTACT_EMAIL : "info@mfscentral.co.za";

  function glOK() {
    if (navigator.connection && navigator.connection.saveData) return false;
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  var scenePromise = null;
  function loadScenes() {
    if (!scenePromise) scenePromise = import(new URL("env-scene.js", scriptSrc).href);
    return scenePromise;
  }
  function watch(el, cb, margin) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { rootMargin: margin || "80px 0px" }).observe(el);
  }

  // ---------- 1. Hero ----------
  var hero = document.querySelector(".ca-hero");
  if (hero) {
    if (!reduce) { hero.classList.add("intro"); setTimeout(function () { hero.classList.remove("intro"); }, 2400); }
    var cluster = null, heroIn = true;
    if (mqFine.matches && !reduce) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
        hero.style.setProperty("--my", (e.clientY - r.top) + "px");
        hero.classList.add("spot-on");
        if (cluster) cluster.pointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      });
      hero.addEventListener("pointerleave", function () { hero.classList.remove("spot-on"); });
    }
    var heroCanvas = hero.querySelector(".ca-canvas");
    if (heroCanvas && mqDesk.matches && glOK()) {
      loadScenes().then(function (m) {
        cluster = m.createClusterScene(heroCanvas, { reduced: reduce });
        hero.classList.add("is-gl");
        cluster.rise();
        cluster.setActive(heroIn && !document.hidden);
      }).catch(function () {});
    }
    watch(hero, function (on) { heroIn = on; if (cluster) cluster.setActive(on && !document.hidden); });
    document.addEventListener("visibilitychange", function () { if (cluster) cluster.setActive(heroIn && !document.hidden); });
  }

  // ---------- 2. How it works ----------
  var how = document.querySelector(".ca-how");
  if (how) {
    var track = how.querySelector(".how-track");
    var stepsEl = how.querySelector(".how-steps");
    var hsteps = Array.prototype.slice.call(how.querySelectorAll(".how-step"));
    var mqPin = mm("(min-width: 1024px) and (min-height: 680px)");
    var pinned = false, hstep = 0;
    var hdr = function () { var h = document.querySelector(".site-header"); return h ? h.offsetHeight : 77; };
    function setupHow() {
      pinned = mqPin.matches && !reduce;
      how.classList.toggle("is-pinned", pinned);
      if (pinned) { hstep = Math.round(window.innerHeight * 0.32); track.style.height = (window.innerHeight - hdr() + hsteps.length * hstep) + "px"; }
      else track.style.height = "";
      updHow();
    }
    function updHow() {
      var p;
      if (reduce) p = 1;
      else if (pinned) p = (hdr() - track.getBoundingClientRect().top) / (hsteps.length * hstep);
      else {
        var r = stepsEl.getBoundingClientRect(), vh = window.innerHeight;
        p = (vh * 0.75 - r.top) / (r.height + vh * 0.25);
      }
      // The line reaches the last step a little before the end of the scroll.
      p = Math.max(0, Math.min(1, p / 0.85));
      stepsEl.style.setProperty("--p", p.toFixed(3));
      var last = hsteps.length - 1;
      hsteps.forEach(function (s, i) { s.classList.toggle("is-on", reduce || (p > 0.01 && p >= i / last - 0.01)); });
    }
    var hTick = false;
    window.addEventListener("scroll", function () {
      if (hTick) return; hTick = true;
      requestAnimationFrame(function () { hTick = false; updHow(); });
    }, { passive: true });
    window.addEventListener("resize", function () { setupHow(); });
    if (mqPin.addEventListener) mqPin.addEventListener("change", setupHow);
    setupHow();
  }

  // ---------- 3. Wizard ----------
  var form = document.getElementById("quote-form");
  if (!form) return;
  var panels = Array.prototype.slice.call(form.querySelectorAll(".step-panel"));
  var back = document.getElementById("step-back");
  var next = document.getElementById("step-next");
  var submit = document.getElementById("step-submit");
  var fill = document.getElementById("progress-fill");
  var dot = document.getElementById("progress-dot");
  var ptext = document.getElementById("progress-text");
  var ppct = document.getElementById("progress-pct");
  var plist = Array.prototype.slice.call(form.querySelectorAll(".progress-steps li"));
  var error = document.getElementById("form-error");
  var result = document.getElementById("form-result");
  var summary = document.getElementById("quote-summary");
  var mailLink = document.getElementById("mail-link");
  var names = plist.map(function (li) { return li.textContent; });
  var n = panels.length, step = 1, advanceT = 0;

  function go(to, opts) {
    opts = opts || {};
    to = Math.max(1, Math.min(n, to));
    var dir = to >= step ? 1 : -1;
    step = to;
    panels.forEach(function (p) {
      var on = parseInt(p.dataset.step, 10) === step;
      p.hidden = !on;
      p.classList.remove("in-fwd", "in-back");
      if (on && !opts.instant && !reduce) { void p.offsetWidth; p.classList.add(dir > 0 ? "in-fwd" : "in-back"); }
      else if (on && !opts.instant) { void p.offsetWidth; p.classList.add("in-fade"); }
    });
    back.hidden = step === 1;
    next.hidden = step === n;
    submit.hidden = step !== n;
    var pct = Math.round(step / n * 100);
    fill.style.width = pct + "%";
    dot.style.left = pct + "%";
    if (!opts.instant && !reduce) { dot.classList.remove("hop"); void dot.offsetWidth; dot.classList.add("hop"); }
    ptext.textContent = "Step " + step + " of " + n + " · " + names[step - 1];
    ppct.textContent = pct + "%";
    plist.forEach(function (li, i) { li.classList.toggle("done", i + 1 < step); li.classList.toggle("now", i + 1 === step); });
    error.hidden = true;
    if (opts.focus) {
      var first = panels[step - 1].querySelector("input, textarea");
      var top = form.getBoundingClientRect().top;
      if (top < 0) form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (first && first.type !== "radio" && first.type !== "checkbox") setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 350);
    }
  }
  back.addEventListener("click", function () { clearTimeout(advanceT); go(step - 1, { focus: true }); });
  next.addEventListener("click", function () { clearTimeout(advanceT); go(step + 1, { focus: true }); });
  plist.forEach(function (li, i) {
    li.addEventListener("click", function () { if (i + 1 < step) go(i + 1, { focus: true }); });
  });

  // Single-choice steps (property, size) move on by themselves after a beat
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.type === "radio" && (t.name === "property" || t.name === "size") && e.isTrusted !== false) {
      clearTimeout(advanceT);
      var at = step;
      advanceT = setTimeout(function () { if (step === at) go(step + 1, { focus: true }); }, reduce ? 250 : 650);
    }
  });

  var ta = document.getElementById("message");
  if (ta) ta.addEventListener("input", function () { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });

  // ---------- 4. Live preview ----------
  var preview = document.querySelector(".ca-preview");
  var capFill = document.getElementById("cap-fill");
  var capPct = document.getElementById("cap-pct");
  var capArts = Array.prototype.slice.call(document.querySelectorAll(".cap-art"));
  var capCanvas = document.querySelector(".cap-canvas");
  var visual = null, visualKey = null, prevIn = false, visLoading = false;
  var rows = {};
  Array.prototype.slice.call(document.querySelectorAll(".cap-row")).forEach(function (r) { rows[r.dataset.row] = r.querySelector("dd"); });
  var last = {};

  function setRow(k, val) {
    var dd = rows[k]; if (!dd) return;
    var text = val || dd.dataset.empty;
    if (last[k] === text) return;
    last[k] = text;
    dd.textContent = text;
    dd.parentNode.classList.toggle("is-set", !!val);
    if (!reduce) { dd.parentNode.classList.remove("flash"); void dd.offsetWidth; dd.parentNode.classList.add("flash"); }
  }
  function labelsOf(sel) {
    return Array.prototype.slice.call(form.querySelectorAll(sel)).map(function (i) { return i.dataset.label; });
  }
  function ensureVisual() {
    if (visual || visLoading || !capCanvas || !mqDesk.matches || !glOK()) return;
    visLoading = true;
    loadScenes().then(function (m) {
      visual = m.createEnvScene(capCanvas, { reduced: reduce, lite: true, fit: 1.3 });
      preview.classList.add("is-gl");
      if (visualKey) visual.show(visualKey, true);
      visual.setActive(prevIn && !document.hidden);
    }).catch(function () {});
  }
  function updatePreview() {
    var prop = form.querySelector('input[name="property"]:checked');
    var services = labelsOf('input[name="services"]:checked');
    var size = form.querySelector('input[name="size"]:checked');
    var freq = form.querySelector('input[name="frequency"]:checked');
    var loc = document.getElementById("location").value.trim();
    var name = document.getElementById("name").value.trim();
    var co = document.getElementById("company").value.trim();
    setRow("property", prop && prop.dataset.label);
    setRow("services", services.join(", "));
    setRow("size", size && size.dataset.label);
    setRow("location", loc);
    setRow("frequency", freq && freq.dataset.label);
    setRow("contact", name ? name + (co ? ", " + co : "") : "");
    var parts = [prop, services.length, size, loc, freq, name && (document.getElementById("phone").value.trim() || document.getElementById("email").value.trim())];
    var pct = Math.round(parts.filter(Boolean).length / parts.length * 100);
    capFill.style.width = pct + "%";
    capPct.textContent = pct === 100 ? "Ready to submit" : pct + "% complete";
    var key = prop ? prop.dataset.key : null;
    if (key !== visualKey) {
      visualKey = key;
      preview.classList.toggle("has-prop", !!key);
      capArts.forEach(function (a) { a.classList.toggle("is-active", a.dataset.k === key); });
      if (key) { ensureVisual(); if (visual) visual.show(key, false); }
    }
  }
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  if (preview) {
    watch(preview, function (on) { prevIn = on; if (visual) visual.setActive(on && !document.hidden); });
    document.addEventListener("visibilitychange", function () { if (visual) visual.setActive(prevIn && !document.hidden); });
    if (mqFine.matches && !reduce) window.addEventListener("pointermove", function (e) {
      if (visual && prevIn) visual.pointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  // Pre-select from the link, e.g. contact.html#cleaning or contact.html#estate
  var preset = (location.hash || "").replace("#", "");
  var svcMap = { cleaning: "cleaning", grounds: "grounds", property: "property", support: "support", building: "building", hygiene: "hygiene" };
  if (svcMap[preset]) { var box = document.getElementById("svc-" + svcMap[preset]); if (box) box.checked = true; }
  var propBox = form.querySelector('input[name="property"][data-key="' + preset + '"]');
  if (propBox) propBox.checked = true;
  go(1, { instant: true });
  updatePreview();
  if (propBox || svcMap[preset]) {
    var assess = document.getElementById("assess");
    if (assess) requestAnimationFrame(function () { assess.scrollIntoView(); });
  }

  // ---------- 5. Submit ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = (data.get("name") || "").toString().trim();
    var mail = (data.get("email") || "").toString().trim();
    var phone = (data.get("phone") || "").toString().trim();
    if (!name || (!mail && !phone)) {
      error.textContent = "Please add your name and a mobile number or email address so a director can contact you.";
      error.hidden = false;
      return;
    }
    var services = labelsOf('input[name="services"]:checked');
    var prop = form.querySelector('input[name="property"]:checked');
    var text = [
      "Name: " + name,
      "Company / estate: " + (data.get("company") || "-"),
      "Mobile: " + (phone || "-"),
      "Email: " + (mail || "-"),
      "Property type: " + (prop ? prop.dataset.label : "-"),
      "Services: " + (services.length ? services.join(", ") : "Not sure yet"),
      "Site size: " + (data.get("size") || "-"),
      "Location: " + (data.get("location") || "-"),
      "How often: " + (data.get("frequency") || "-"),
      "",
      "Requirements:",
      (data.get("message") || "-").toString()
    ].join("\n");
    summary.textContent = text;
    mailLink.href = "mailto:" + email + "?subject=" + encodeURIComponent("Site assessment request: " + name) + "&body=" + encodeURIComponent(text);

    function done(sent) {
      panels.forEach(function (p) { p.hidden = true; });
      back.hidden = next.hidden = submit.hidden = true;
      form.querySelector(".progress").hidden = true;
      form.querySelector(".step-nav").hidden = true;
      var first = name.split(" ")[0];
      document.getElementById("result-title").textContent = sent ? "Assessment request submitted" : "Your assessment request is ready";
      document.getElementById("result-text").textContent = sent
        ? "Thank you, " + first + ". Your request is with a director, who will review it and contact you within one working day."
        : "Thank you, " + first + ". One last step: email this request to " + email + " and a director will contact you within one working day.";
      document.getElementById("fr-send").hidden = sent;
      result.hidden = false;
      result.classList.add("is-shown");
      if (preview) preview.classList.add("is-done");
      capPct.textContent = sent ? "Submitted" : "Ready to send";
      result.focus({ preventScroll: true });
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }

    if (!endpoint) { done(false); return; }
    submit.disabled = true; submit.firstChild.textContent = "Sending… ";
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(Object.assign({}, Object.fromEntries(data.entries()), { services: services.join(", "), _subject: "Site assessment request: " + name }))
    }).then(function (res) { if (!res.ok) throw new Error(); done(true); })
      .catch(function () { done(false); })
      .finally(function () { submit.disabled = false; submit.firstChild.textContent = "Submit Assessment Request "; });
  });
})();
