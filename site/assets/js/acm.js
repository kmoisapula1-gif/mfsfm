/* MFS Connection Model: home hero interaction.
   Client needs -> MFS -> Successful outcome.
   - Lines, nodes and labels: SVG + CSS (cheap, sharp, responsive)
   - Centre logo: real 3D extrusion (acm-scene.js, Three.js), lazy-loaded
     only on desktops with a mouse, WebGL and no reduced-motion preference
   - Below 768px: a static card flow, no WebGL at all
*/
(function () {
  "use strict";
  var root = document.querySelector("[data-acm]");
  if (!root) return;
  var hero = root.closest(".hero");
  var stage = root.querySelector(".acm-stage");
  var svg = root.querySelector(".acm-lines");
  var l1 = root.querySelector(".acm-line.l1");
  var l2 = root.querySelector(".acm-line.l2");
  var pulseDot = root.querySelector(".acm-pulse:not(.halo)");
  var pulseHalo = root.querySelector(".acm-pulse.halo");
  var nClient = root.querySelector(".n-client");
  var nOutcome = root.querySelector(".n-outcome");
  var core = root.querySelector(".acm-core");
  var canvas = root.querySelector(".acm-canvas");
  var glow = hero.querySelector(".acm-glow");
  var roles = root.querySelector(".acm-roles");
  var cue = hero.querySelector(".acm-cue");
  var tips = { client: root.querySelector("#tip-client"), mfs: root.querySelector("#tip-mfs"), outcome: root.querySelector("#tip-outcome") };

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var scriptSrc = (document.currentScript && document.currentScript.src) || "assets/js/acm.js";
  var t0 = performance.now();

  var W = 0, H = 0, mode = "v", scrolly = false, reduce = mqReduce.matches;
  var p = 0, pTarget = 0;                 // 0 = vertical, 1 = Client -> MFS -> Outcome
  var mx = 0, my = 0, mxT = 0, myT = 0;   // pointer, -1..1
  var gx = 0, gy = 0, gxT = 0, gyT = 0;   // glow position in hero
  var pos = { client: [0, 0], outcome: [0, 0], core: [0, 0] };
  var visible = true, raf = 0, scene = null, glState = "none";
  var openTip = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function measure() {
    var vw = window.innerWidth;
    reduce = mqReduce.matches;
    mode = vw < 768 ? "flow" : vw <= 960 ? "h" : "v";
    scrolly = mode === "v" && !reduce && window.innerHeight >= 640;
    hero.classList.toggle("is-scrolly", scrolly);
    var header = document.querySelector(".site-header");
    if (header) hero.style.setProperty("--hdr", header.offsetHeight + "px");
    W = stage.clientWidth; H = stage.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    if (!scrolly) pTarget = p = mode === "h" ? 1 : 0;
    syncGL();
  }

  function scrollProgress() {
    if (!scrolly) return;
    var r = hero.getBoundingClientRect();
    var pin = hero.querySelector(".hero-pin").offsetHeight;
    var travel = r.height - pin;
    // Finish turning a little before the pin releases so the end state can be read.
    pTarget = travel > 0 ? clamp(-r.top / (travel * 0.8), 0, 1) : 0;
  }

  function linePath(a, b, bend) {
    var mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    var cx = mxp - (dy / len) * bend, cy = myp + (dx / len) * bend;
    return "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + "Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + b[0].toFixed(1) + " " + b[1].toFixed(1);
  }

  function layout(t) {
    var e = ease(p);
    var coreW = core.offsetWidth;
    // The logo's two dots sit slightly above its centre: align the horizontal line with them.
    var cx = W / 2, cy = H / 2, ly = -coreW * 0.004 * e;
    var rv = H / 2 - (mode === "h" ? 0 : 96);
    // When horizontal, the client and outcome dots merge into the two dots of the MFS logo itself.
    var rh = coreW * 0.40;
    var R = rv + (rh - rv) * e;
    var th = (-90 - 90 * e) * Math.PI / 180;      // client swings from top to the left
    var ux = Math.cos(th), uy = Math.sin(th);
    pos.core = [cx, cy];
    pos.client = [cx + R * ux, cy + ly + R * uy];
    pos.outcome = [cx - R * ux, cy + ly - R * uy];
    nClient.style.transform = "translate3d(" + pos.client[0].toFixed(1) + "px," + pos.client[1].toFixed(1) + "px,40px)";
    nOutcome.style.transform = "translate3d(" + pos.outcome[0].toFixed(1) + "px," + pos.outcome[1].toFixed(1) + "px,40px)";
    core.style.transform = "translate3d(" + cx + "px," + cy + "px,10px)";
    // Lines stop at the logo: its top/bottom when vertical, its two dots when horizontal.
    var gap = (core.offsetHeight * 0.36) + (coreW * 0.40 - core.offsetHeight * 0.36) * e;
    var bend = (reduce ? 0 : mx * 14 + Math.sin(t * 1.1) * 2.2) * (1 - 0.4 * e);
    l1.setAttribute("d", linePath([pos.client[0] - ux * 18, pos.client[1] - uy * 18], [cx + ux * gap, cy + ly + uy * gap], bend));
    l2.setAttribute("d", linePath([cx - ux * gap, cy + ly - uy * gap], [pos.outcome[0] + ux * 18, pos.outcome[1] + uy * 18], bend));
    root.classList.toggle("is-h", e > 0.5);
    nClient.style.setProperty("--merge", e.toFixed(3));
    nOutcome.style.setProperty("--merge", e.toFixed(3));
    svg.style.opacity = String(1 - e);
    // Once horizontal, lift the role chips up under the logo.
    if (roles && mode === "v") roles.style.transform = "translateY(" + (-e * Math.max(0, H / 2 - 150)).toFixed(1) + "px)";
    else if (roles) roles.style.transform = "";
    if (cue) cue.style.opacity = String(clamp(1 - p * 3, 0, 1) * (performance.now() - t0 > 2600 ? 1 : 0));
  }

  // Gold pulse: client -> MFS -> outcome, every 4.5 s after the intro.
  var lastHit = -1;
  function pulse(t) {
    if (reduce) return;
    var start = 2.0, cycle = 4.5;
    if (t < start) return;
    var k = (t - start) % cycle, n = Math.floor((t - start) / cycle);
    var seg = null, f = 0;
    if (k < 0.7) { seg = l1; f = k / 0.7; }
    else if (k < 1.0) { seg = null; if (lastHit !== n * 3 + 1) { lastHit = n * 3 + 1; hit(core); if (scene) scene.pulse(); } }
    else if (k < 1.7) { seg = l2; f = (k - 1.0) / 0.7; }
    else if (lastHit !== n * 3 + 2) { lastHit = n * 3 + 2; hit(nOutcome); }
    if (k < 0.05 && lastHit !== n * 3) { lastHit = n * 3; hit(nClient); }
    if (seg) {
      var L = seg.getTotalLength(), pt = seg.getPointAtLength(L * ease(f));
      var o = Math.min(1, f * 6, (1 - f) * 6);
      pulseDot.setAttribute("cx", pt.x); pulseDot.setAttribute("cy", pt.y); pulseDot.style.opacity = o;
      pulseHalo.setAttribute("cx", pt.x); pulseHalo.setAttribute("cy", pt.y); pulseHalo.style.opacity = o;
    } else { pulseDot.style.opacity = 0; pulseHalo.style.opacity = 0; }
  }
  function hit(el) { el.classList.add("is-hit"); setTimeout(function () { el.classList.remove("is-hit"); }, 650); }

  function frame(now) {
    raf = 0;
    var t = (now - t0) / 1000;
    scrollProgress();
    p += (pTarget - p) * (reduce ? 1 : 0.12);
    if (Math.abs(pTarget - p) < 0.0005) p = pTarget;
    mx += (mxT - mx) * 0.08; my += (myT - my) * 0.08;
    if (mode !== "flow") {
      layout(t);
      // Whole system turns gently with the pointer: about 8.6 deg yaw, 2.9 deg pitch.
      if (!reduce && mqFine.matches) stage.style.transform = "rotateX(" + (-my * 2.9).toFixed(2) + "deg) rotateY(" + (mx * 8.6).toFixed(2) + "deg)";
      pulse(t);
      if (openTip) placeTip(openTip);
    }
    if (glow && hero.classList.contains("has-pointer")) {
      gx += (gxT - gx) * 0.12; gy += (gyT - gy) * 0.12;
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
    }
    if (scene) scene.setPointer(mx, -my);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  // Pointer: parallax + gold glow following the cursor
  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || reduce) return;
    var r = hero.getBoundingClientRect();
    mxT = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    myT = clamp(((e.clientY - r.top) / Math.min(r.height, window.innerHeight)) * 2 - 1, -1, 1);
    gxT = e.clientX - r.left; gyT = e.clientY - r.top;
    if (!hero.classList.contains("has-pointer")) { gx = gxT; gy = gyT; hero.classList.add("has-pointer"); }
    kick();
  });
  hero.addEventListener("pointerleave", function () { mxT = myT = 0; hero.classList.remove("has-pointer"); });

  // Glass tooltips: hover, keyboard focus and tap
  function placeTip(key) {
    var tip = tips[key]; if (!tip) return;
    var tw = tip.offsetWidth, th = tip.offsetHeight, x, y;
    var at = key === "mfs" ? pos.core : pos[key];
    var horizontal = root.classList.contains("is-h");
    var room = window.innerWidth - root.getBoundingClientRect().right - 8;
    if (key === "mfs") {
      x = at[0] + core.offsetWidth * 0.38; y = at[1] - th / 2;
      if (horizontal || x + tw > W + room) { x = at[0] - tw / 2; y = at[1] + core.offsetHeight * 0.4; }
      else { tip.style.setProperty("--tx", x.toFixed(0) + "px"); tip.style.setProperty("--ty", y.toFixed(0) + "px"); return; }
    }
    else if (horizontal) { x = at[0] - tw / 2; y = at[1] + (key === "client" ? 34 : 78); }
    else {
      // Beside the dot, on the side away from its label so the label stays readable.
      // Prefer the open space to the right of the model, away from the headline.
      x = at[0] + 36;
      if (x + tw > W + room) x = at[0] - tw - 36;
      y = key === "client" ? at[1] - 14 : at[1] - th + 14;
      tip.style.setProperty("--tx", x.toFixed(0) + "px");
      tip.style.setProperty("--ty", y.toFixed(0) + "px");
      return;
    }
    x = clamp(x, -24, W - tw + 24);
    tip.style.setProperty("--tx", x.toFixed(0) + "px");
    tip.style.setProperty("--ty", y.toFixed(0) + "px");
  }
  function show(key) {
    if (openTip && openTip !== key) tips[openTip].classList.remove("is-open");
    openTip = key; placeTip(key); tips[key].classList.add("is-open");
  }
  function hide(key) { if (!key || openTip === key) { if (openTip) tips[openTip].classList.remove("is-open"); openTip = null; } }
  [[nClient, "client"], [core, "mfs"], [nOutcome, "outcome"]].forEach(function (pair) {
    var el = pair[0], key = pair[1], btn = el.querySelector("button");
    el.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") show(key); });
    el.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hide(key); });
    btn.addEventListener("focus", function () { show(key); });
    btn.addEventListener("blur", function () { hide(key); });
    btn.addEventListener("click", function () { if (openTip === key) hide(key); else show(key); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openTip) hide(); });
  document.addEventListener("pointerdown", function (e) { if (openTip && !e.target.closest(".acm-node, .acm-core")) hide(); });

  // 3D logo: only where it will run smoothly
  function glCapable() {
    if (mode !== "v" || reduce || !mqFine.matches || (navigator.connection && navigator.connection.saveData)) return false;
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  function syncGL() {
    if (glState === "ready") {
      var on = mode === "v" && !reduce;
      root.classList.toggle("is-gl", on);
      scene.setActive(on && visible);
      return;
    }
    if (glState !== "none" || !glCapable()) return;
    glState = "loading";
    root.classList.add("gl-pending");
    var riseAt = 1200;                      // logo rises from depth at 1.2 s
    var giveUp = setTimeout(fallback, 3200); // slow network: keep the flat logo
    import(new URL("acm-scene.js", scriptSrc).href).then(function (m) {
      if (glState !== "loading") return;
      clearTimeout(giveUp);
      scene = m.createScene(canvas);
      glState = "ready";
      root.classList.remove("gl-pending");
      root.classList.add("is-gl");
      var wait = Math.max(0, riseAt - (performance.now() - t0));
      setTimeout(function () { scene.rise(); scene.setActive(visible); }, wait);
    }).catch(fallback);
    function fallback() {
      if (glState !== "loading") return;
      glState = "failed";
      root.classList.remove("gl-pending");
    }
  }

  // Run only while the hero is on screen and the tab is visible
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting && !document.hidden;
      if (scene && glState === "ready") scene.setActive(visible && root.classList.contains("is-gl"));
      if (visible) kick();
    }, { rootMargin: "100px" }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    if (scene && glState === "ready") scene.setActive(visible && root.classList.contains("is-gl"));
    if (visible) kick();
  });
  window.addEventListener("scroll", kick, { passive: true });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { measure(); kick(); }, 120); });
  if (mqReduce.addEventListener) mqReduce.addEventListener("change", function () { measure(); kick(); });

  measure();
  root.classList.add("is-ready");
  kick();
})();
