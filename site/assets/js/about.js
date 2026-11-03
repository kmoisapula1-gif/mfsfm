/* Moisapula Facilities Solutions: About page
   1. Hero: a small 3D property model that turns gently with the pointer (desktop, WebGL)
   2. Timeline, logo story and safety steps play once when they come into view
   3. Safety steps: the line fills green as you scroll through the list
*/
(function () {
  var scriptSrc = (document.currentScript && document.currentScript.src) || "assets/js/about.js";
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mm("(prefers-reduced-motion: reduce)").matches;
  var desk = mm("(min-width: 961px)").matches;
  var fine = mm("(hover: hover) and (pointer: fine)").matches;

  function glOK() {
    if (navigator.connection && navigator.connection.saveData) return false;
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }

  // ---------- 1. Hero model ----------
  var hero = document.querySelector(".ab-hero");
  var canvas = hero && hero.querySelector(".ab-canvas");
  if (canvas && desk && glOK()) {
    import(new URL("env-scene.js", scriptSrc).href).then(function (m) {
      var scene = m.createEnvScene(canvas, { reduced: reduce, lite: !fine, fit: 0.98 });
      var keys = ["estate", "office", "retail", "industrial"], k = 0, inView = true, timer = 0;
      hero.classList.add("is-gl");
      scene.show(keys[0], true);
      function sync() {
        var on = inView && !document.hidden;
        scene.setActive(on);
        if (on && !timer && !reduce) timer = setInterval(function () { k = (k + 1) % keys.length; scene.show(keys[k], false); }, 5000);
        if (!on && timer) { clearInterval(timer); timer = 0; }
      }
      if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }).observe(hero);
      document.addEventListener("visibilitychange", sync);
      if (fine && !reduce) hero.addEventListener("pointermove", function (e) {
        scene.pointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      });
      sync();
    }).catch(function () {});
  }

  // ---------- 2. Play once in view ----------
  var plays = Array.prototype.slice.call(document.querySelectorAll(".ab-timeline, .ab-logo, .ab-idea-words, .ab-num"));
  if (reduce || !("IntersectionObserver" in window)) {
    plays.forEach(function (el) { el.classList.add("play"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("play"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -15% 0px" });
    plays.forEach(function (el) { io.observe(el); });
  }

  // ---------- 3. Safety steps ----------
  var steps = document.querySelector(".ab-steps");
  if (steps) {
    var items = Array.prototype.slice.call(steps.querySelectorAll("li"));
    var line = steps.querySelector(".ab-steps-line i");
    var tick = false;
    function upd() {
      tick = false;
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
      line.style.transform = "scaleY(" + p.toFixed(3) + ")";
      var y = r.top + p * r.height;
      items.forEach(function (li) { var b = li.getBoundingClientRect(); li.classList.toggle("on", reduce || b.top + 12 <= y); });
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }
})();
