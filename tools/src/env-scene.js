// MFS "Choose your environment": low-poly buildings, one per environment.
// Built from boxes, cylinders, cones and extruded triangles (no model files).
// Bundled by tools/build-scene.mjs into site/assets/js/env-scene.js and loaded
// by site.js only on screens 768px+ with WebGL.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BoxGeometry, CylinderGeometry,
  ConeGeometry, SphereGeometry, ExtrudeGeometry, Shape, PlaneGeometry, MeshStandardMaterial,
  MeshBasicMaterial, CanvasTexture, PMREMGenerator, DirectionalLight, HemisphereLight,
  ACESFilmicToneMapping, SRGBColorSpace, Color
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const PAL = {
  wall: "#F4F2EC", wall2: "#E4E2DA", roof: "#1A5A43", roofDark: "#114B36",
  glass: "#A7C7BD", gold: "#D9A441", leaf: "#4C9A52", trunk: "#7A5A3A", pave: "#CFCBC0"
};

// Each model gets its own materials so it can fade independently.
function palette() {
  const m = (c, o = {}) => new MeshStandardMaterial({ color: new Color(c), roughness: 0.62, metalness: 0.05, flatShading: true, ...o });
  return {
    wall: m(PAL.wall), wall2: m(PAL.wall2), roof: m(PAL.roof, { roughness: 0.5 }), roofDark: m(PAL.roofDark),
    glass: m(PAL.glass, { roughness: 0.18, metalness: 0.35, emissive: new Color("#2F6B57"), emissiveIntensity: 0.18 }),
    gold: m(PAL.gold, { roughness: 0.32, metalness: 0.55, emissive: new Color(PAL.gold), emissiveIntensity: 0.12 }),
    leaf: m(PAL.leaf, { roughness: 0.8 }), trunk: m(PAL.trunk), pave: m(PAL.pave, { roughness: 0.9 })
  };
}

function kit(group, mats) {
  const add = (geo, mat, x = 0, y = 0, z = 0, ry = 0) => {
    const mesh = new Mesh(geo, mat); mesh.position.set(x, y, z); mesh.rotation.y = ry; group.add(mesh); return mesh;
  };
  // Boxes sit on y (their base), centred on x/z.
  const box = (w, h, d, mat, x, y, z, ry) => add(new BoxGeometry(w, h, d), mat, x, y + h / 2, z, ry);
  const cyl = (r, h, seg, mat, x, y, z, rt) => add(new CylinderGeometry(rt ?? r, r, h, seg), mat, x, y + h / 2, z);
  const cone = (r, h, seg, mat, x, y, z, ry = 0) => add(new ConeGeometry(r, h, seg), mat, x, y + h / 2, z, ry);
  const pyramid = (side, h, mat, x, y, z) => cone(side / Math.SQRT2, h, 4, mat, x, y, z, Math.PI / 4);
  // Gable roof: triangle (span w, height h) extruded along depth d.
  const gable = (w, h, d, mat, x, y, z, ry = 0) => {
    const s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
    return add(g, mat, x, y, z, ry);
  };
  // Sawtooth roof tooth: right triangle.
  const tooth = (w, h, d, mat, x, y, z) => {
    const s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.closePath();
    const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
    return add(g, mat, x, y, z);
  };
  const tree = (x, z, s = 1) => {
    cyl(0.04 * s, 0.22 * s, 5, mats.trunk, x, 0, z);
    cone(0.2 * s, 0.42 * s, 6, mats.leaf, x, 0.16 * s, z);
    cone(0.15 * s, 0.32 * s, 6, mats.leaf, x, 0.38 * s, z);
  };
  return { box, cyl, cone, pyramid, gable, tooth, tree, add };
}

const MODELS = {
  estate(g, m, k) {
    k.box(0.5, 0.01, 3.2, m.pave, 0, 0, 0.1);                       // central road
    const house = (x, z, ry, s = 1) => {
      const hg = new Group(); hg.position.set(x, 0, z); hg.rotation.y = ry; g.add(hg);
      const hk = kit(hg, m);
      hk.box(0.8 * s, 0.55 * s, 0.7 * s, m.wall, 0, 0, 0);
      hk.pyramid(0.98 * s, 0.42 * s, m.roof, 0, 0.55 * s, 0);
      hk.box(0.16 * s, 0.28 * s, 0.02, m.gold, 0, 0, 0.36 * s);
      hk.box(0.18 * s, 0.14 * s, 0.02, m.glass, -0.24 * s, 0.25 * s, 0.36 * s);
      hk.box(0.18 * s, 0.14 * s, 0.02, m.glass, 0.24 * s, 0.25 * s, 0.36 * s);
    };
    house(-0.85, -0.55, Math.PI / 2, 1); house(-0.85, 0.65, Math.PI / 2, 0.92);
    house(0.85, -0.55, -Math.PI / 2, 0.92); house(0.85, 0.65, -Math.PI / 2, 1);
    k.box(0.08, 0.32, 0.08, m.wall2, -0.32, 0, 1.55); k.box(0.08, 0.32, 0.08, m.wall2, 0.32, 0, 1.55);
    k.box(0.62, 0.035, 0.035, m.gold, 0.02, 0.24, 1.55);            // entrance boom
    k.tree(-1.55, 0.05, 0.9); k.tree(1.55, 0.05, 0.9); k.tree(-0.25, -1.45, 0.8); k.tree(0.3, -1.4, 1);
  },
  home(g, m, k) {
    k.box(1.6, 0.85, 1.05, m.wall, -0.2, 0, -0.1);
    k.gable(1.84, 0.62, 1.2, m.roof, -0.2, 0.85, -0.1);
    k.box(0.85, 0.55, 0.95, m.wall2, 1.0, 0, -0.15);                  // garage
    k.box(0.95, 0.06, 1.05, m.roofDark, 1.0, 0.55, -0.15);
    k.box(0.62, 0.42, 0.02, m.roofDark, 1.0, 0, 0.33);                // garage door
    k.box(0.24, 0.46, 0.02, m.gold, -0.2, 0, 0.43);                   // front door
    k.box(0.32, 0.26, 0.02, m.glass, -0.72, 0.35, 0.43); k.box(0.32, 0.26, 0.02, m.glass, 0.32, 0.35, 0.43);
    k.box(0.16, 0.5, 0.16, m.wall2, -0.65, 1.0, -0.35);               // chimney
    k.box(0.5, 0.01, 0.75, m.pave, -0.2, 0, 0.82);                    // path
    for (let i = 0; i < 9; i++) { const x = -1.6 + i * 0.16; if (Math.abs(x + 0.2) > 0.3) k.box(0.04, 0.2, 0.04, m.wall2, x, 0, 1.2); }
    k.box(1.3, 0.03, 0.03, m.wall2, -0.85, 0.15, 1.2);
    k.tree(-1.55, 0.5, 1.1); k.tree(1.6, 0.85, 0.85); k.tree(1.55, -1.05, 1);
  },
  office(g, m, k) {
    k.box(2.3, 0.32, 1.5, m.wall2, 0, 0, 0);                          // podium
    k.box(2.0, 0.12, 0.04, m.glass, 0, 0.08, 0.76);
    const floors = 9, fh = 0.27;
    k.box(1.0, floors * fh, 1.0, m.glass, -0.3, 0.32, -0.1);          // main tower glass core
    for (let i = 0; i <= floors; i++) k.box(1.06, 0.045, 1.06, m.wall, -0.3, 0.32 + i * fh - 0.02, -0.1);
    k.box(0.08, floors * fh, 1.07, m.wall, -0.81, 0.32, -0.1); k.box(0.08, floors * fh, 1.07, m.wall, 0.21, 0.32, -0.1);
    k.box(0.7, 0.18, 0.7, m.gold, -0.3, 0.32 + floors * fh + 0.02, -0.1); // crown
    k.box(0.62, 1.55, 0.62, m.wall, 0.7, 0.32, 0.2);                  // second tower
    for (let i = 0; i < 5; i++) k.box(0.64, 0.12, 0.64, m.glass, 0.7, 0.5 + i * 0.27, 0.2);
    k.box(0.4, 0.08, 0.4, m.roof, 0.7, 1.87, 0.2);
    k.box(0.5, 0.06, 0.25, m.gold, -0.3, 0.32, 0.55);                 // entrance canopy
    k.tree(-1.5, 1.05, 0.85); k.tree(1.45, 1.05, 0.85); k.tree(1.55, -0.8, 0.95);
  },
  industrial(g, m, k) {
    k.box(2.7, 0.75, 1.5, m.wall, -0.15, 0, -0.1);
    for (let i = 0; i < 5; i++) {
      const x = -1.5 + 0.27 + i * 0.54;
      k.tooth(0.54, 0.34, 1.5, m.roof, x, 0.75, -0.1);
      k.box(0.03, 0.3, 1.5, m.glass, x + 0.255, 0.77, -0.1);
    }
    for (let i = 0; i < 3; i++) k.box(0.42, 0.52, 0.02, m.roofDark, -0.95 + i * 0.6, 0, 0.66);
    k.box(2.7, 0.06, 0.02, m.gold, -0.15, 0.6, 0.66);                  // safety stripe
    k.cyl(0.3, 1.35, 10, m.wall2, 1.55, 0, -0.35); k.cone(0.32, 0.25, 10, m.roof, 1.55, 1.35, -0.35);
    k.cyl(0.3, 1.35, 10, m.wall2, 1.55, 0, 0.35); k.cone(0.32, 0.25, 10, m.roof, 1.55, 1.35, 0.35);
    k.cyl(0.08, 1.75, 8, m.wall2, -1.25, 0.75, -0.55); k.cyl(0.09, 0.08, 8, m.gold, -1.25, 2.3, -0.55);
    k.box(0.9, 0.01, 0.55, m.pave, -0.35, 0, 1.0);                    // loading yard
    k.box(0.5, 0.32, 0.3, m.gold, 0.55, 0, 1.05); k.box(0.2, 0.26, 0.3, m.roof, 0.92, 0, 1.05); // truck
  },
  retail(g, m, k) {
    k.box(2.9, 0.62, 1.45, m.wall, 0, 0, -0.15);
    k.box(2.7, 0.34, 0.03, m.glass, 0, 0.08, 0.59);                   // shopfront glazing
    k.box(2.95, 0.06, 0.32, m.gold, 0, 0.46, 0.72);                   // canopy
    k.box(0.85, 0.95, 1.5, m.wall2, 0, 0, -0.12);                     // entrance block
    k.box(0.6, 0.55, 0.03, m.glass, 0, 0, 0.64);
    k.box(0.7, 0.1, 0.03, m.gold, 0, 0.75, 0.64);                     // sign band
    k.box(2.9, 0.05, 1.45, m.roof, 0, 0.62, -0.15);
    k.box(0.12, 1.4, 0.12, m.roof, 1.6, 0, 1.0); k.box(0.36, 0.42, 0.06, m.gold, 1.6, 1.25, 1.0); // pylon sign
    for (let i = 0; i < 6; i++) k.box(0.025, 0.012, 0.32, m.wall, -1.3 + i * 0.36, 0, 1.15); // parking bays
    k.tree(-1.6, 0.75, 0.85); k.tree(-0.25, 1.45, 0.75); k.tree(1.65, -0.6, 0.95);
  },
  education(g, m, k) {
    k.box(1.3, 0.85, 0.9, m.wall, 0, 0, -0.2);
    k.gable(1.45, 0.48, 1.0, m.roof, 0, 0.85, -0.2);
    k.box(0.95, 0.58, 0.8, m.wall2, -1.1, 0, -0.15); k.box(1.0, 0.06, 0.86, m.roof, -1.1, 0.58, -0.15);
    k.box(0.95, 0.58, 0.8, m.wall2, 1.1, 0, -0.15); k.box(1.0, 0.06, 0.86, m.roof, 1.1, 0.58, -0.15);
    for (let i = 0; i < 3; i++) { k.box(0.18, 0.16, 0.02, m.glass, -1.38 + i * 0.28, 0.28, 0.26); k.box(0.18, 0.16, 0.02, m.glass, 0.82 + i * 0.28, 0.28, 0.26); }
    k.box(0.28, 0.42, 0.02, m.gold, 0, 0, 0.26);
    k.box(0.36, 1.75, 0.36, m.wall, 0, 0, -0.75);                     // clock tower
    k.cyl(0.11, 0.03, 12, m.gold, 0, 1.45, -0.56);
    k.pyramid(0.46, 0.42, m.gold, 0, 1.75, -0.75);
    k.box(1.2, 0.012, 0.7, m.leaf, -0.75, 0, 1.0);                    // sports field
    k.box(0.02, 0.014, 0.7, m.wall, -0.75, 0, 1.0);
    k.cyl(0.015, 1.1, 5, m.wall2, 0.95, 0, 0.85); k.box(0.26, 0.15, 0.015, m.gold, 1.08, 0.92, 0.85);
    k.tree(1.6, 0.95, 0.8); k.tree(1.65, -0.95, 0.9);
  },
  government(g, m, k) {
    for (let i = 0; i < 3; i++) k.box(2.5 - i * 0.14, 0.08, 1.7 - i * 0.12, m.wall2, 0, i * 0.08, 0);
    const base = 0.24, colH = 0.95;
    k.box(2.1, colH, 0.9, m.wall2, 0, base, -0.3);                     // hall behind columns
    for (let i = 0; i < 6; i++) k.cyl(0.07, colH, 8, m.wall, -0.9 + i * 0.36, base, 0.38);
    k.box(2.24, 0.14, 1.42, m.wall, 0, base + colH, -0.05);            // entablature
    k.gable(2.24, 0.42, 0.14, m.roof, 0, base + colH + 0.14, 0.6);     // pediment
    k.box(2.24, 0.06, 1.3, m.roof, 0, base + colH + 0.14, -0.1);
    k.cyl(0.42, 0.3, 12, m.wall, 0, base + colH + 0.2, -0.35);          // drum
    const dome = k.add(new SphereGeometry(0.44, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.gold, 0, base + colH + 0.5, -0.35);
    dome.scale.y = 0.9;
    k.cyl(0.015, 0.25, 5, m.gold, 0, base + colH + 0.88, -0.35);
    k.cyl(0.015, 1.25, 5, m.wall2, -1.45, 0, 0.75); k.box(0.26, 0.15, 0.015, m.gold, -1.32, 1.07, 0.75);
    k.cyl(0.015, 1.25, 5, m.wall2, 1.45, 0, 0.75); k.box(0.26, 0.15, 0.015, m.roof, 1.58, 1.07, 0.75);
    k.tree(-1.55, -0.85, 0.85); k.tree(1.55, -0.85, 0.85);
  }
};

function shadowTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const g = cv.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grd.addColorStop(0, "rgba(4,10,24,0.55)"); grd.addColorStop(0.6, "rgba(4,10,24,0.18)"); grd.addColorStop(1, "rgba(4,10,24,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(cv);
}

export function createEnvScene(canvas, opts = {}) {
  const reduced = !!opts.reduced;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lite ? 1.25 : 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(28, 1, 0.1, 60);
  scene.add(new HemisphereLight(new Color("#E3EEE8"), new Color("#0B3325"), 0.55));
  const key = new DirectionalLight(new Color("#FFE6B8"), 1.7); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new DirectionalLight(new Color("#A7C7BD"), 0.7); rim.position.set(5, 2, -4); scene.add(rim);

  const rig = new Group(); scene.add(rig);
  // Shared plinth: a low octagonal platform with a gold edge.
  const plinthMat = new MeshStandardMaterial({ color: new Color("#ECE9E1"), roughness: 0.7, flatShading: true });
  const plinth = new Mesh(new CylinderGeometry(2.2, 2.32, 0.2, 8), plinthMat); plinth.position.y = -0.1; plinth.rotation.y = Math.PI / 8;
  const edge = new Mesh(new CylinderGeometry(2.215, 2.215, 0.035, 8), new MeshStandardMaterial({ color: new Color(PAL.gold), metalness: 0.6, roughness: 0.3, flatShading: true }));
  edge.position.y = -0.005; edge.rotation.y = Math.PI / 8;
  const shadow = new Mesh(new PlaneGeometry(6.4, 6.4), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.55;
  rig.add(shadow, plinth, edge);

  const built = {};
  function model(name) {
    if (built[name]) return built[name];
    const g = new Group(); const mats = palette();
    MODELS[name](g, mats, kit(g, mats));
    g.userData.mats = Object.values(mats);
    g.visible = false; rig.add(g);
    return (built[name] = g);
  }
  function setOpacity(g, a) {
    g.userData.mats.forEach(mt => { mt.transparent = a < 1; mt.opacity = a; });
  }

  // Transition state
  let current = null, leaving = null, enterAt = 0, leaveAt = 0;
  const ENTER = reduced ? 420 : 800, LEAVE = reduced ? 300 : 560, ENTER_DELAY = reduced ? 0 : 120;
  const ease = t => 1 - Math.pow(1 - t, 3);

  let pointerX = 0, pointerY = 0, rotX = 0, rotY = 0, active = false, raf = 0;
  const t0 = performance.now();
  const BASE_Y = -0.35;

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const F = opts.fit || 1;
    const dist = Math.max(4.7 * F / (2 * tan), 5.7 * F / (2 * tan * camera.aspect));
    camera.position.set(0, dist * 0.42, dist);
    camera.lookAt(0, 0.3, 0);
    camera.updateProjectionMatrix();
    if (!active) render(performance.now());
  }
  const ro = new ResizeObserver(size); ro.observe(canvas);

  function render(now) {
    const t = (now - t0) / 1000;
    // Leaving model: moves back and fades.
    if (leaving) {
      const p = Math.min(1, (now - leaveAt) / LEAVE), e = ease(p);
      if (!reduced) { leaving.position.z = -1.3 * e; leaving.position.y = 0.15 * e; leaving.scale.setScalar(1 - 0.12 * e); }
      setOpacity(leaving, 1 - e);
      if (p >= 1) { leaving.visible = false; leaving.position.set(0, 0, 0); leaving.scale.setScalar(1); leaving = null; }
    }
    // Entering model: rises, turns slightly and settles.
    if (current) {
      const p = Math.max(0, Math.min(1, (now - enterAt - ENTER_DELAY) / ENTER)), e = ease(p);
      if (!reduced) { current.position.y = -0.9 * (1 - e); current.rotation.y = -0.5 * (1 - e); current.scale.setScalar(0.92 + 0.08 * e); }
      setOpacity(current, e);
    }
    if (!reduced) {
      rig.position.y = BASE_Y + Math.sin(t) * 0.08;
      rotY += (pointerX * 0.15 + Math.sin(t * 0.35) * 0.06 - rotY) * 0.06;
      rotX += (pointerY * 0.08 - rotX) * 0.06;
    } else rig.position.y = BASE_Y;
    rig.rotation.set(rotX, -0.55 + rotY, 0);
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0; render(now);
    if (active) raf = requestAnimationFrame(frame);
  }
  function busy() { const now = performance.now(); return leaving || (current && now - enterAt < ENTER + ENTER_DELAY + 50); }
  function kick() {
    if (active && !raf) raf = requestAnimationFrame(frame);
    else if (!active && !raf) {
      // Static mode (reduced motion or off screen): still play the fade, then stop.
      const step = now => { render(now); raf = busy() ? requestAnimationFrame(step) : 0; };
      raf = requestAnimationFrame(step);
    }
  }

  size();
  return {
    show(name, immediate) {
      const next = model(name);
      if (next === current) return;
      if (leaving) { leaving.visible = false; leaving = null; }
      if (current) { leaving = current; leaveAt = performance.now(); }
      current = next; current.visible = true; current.position.set(0, 0, 0); current.rotation.y = 0; current.scale.setScalar(1);
      enterAt = immediate ? -1e6 : performance.now();
      setOpacity(current, immediate ? 1 : 0);
      kick();
    },
    pointer(x, y) { pointerX = x; pointerY = y; },
    setActive(on) {
      on = on && !reduced;
      if (on === active) return;
      active = on;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      kick();
    },
    destroy() { active = false; if (raf) cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); }
  };
}

// ---------------------------------------------------------------------------
// Contact hero: four properties (office, estate, retail, industrial) on small
// platforms, joined to a central MFS hub by gold pathways with travelling pulses.
export function createClusterScene(canvas, opts = {}) {
  const reduced = !!opts.reduced;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const camera = new PerspectiveCamera(26, 1, 0.1, 80);
  scene.add(new HemisphereLight(new Color("#E3EEE8"), new Color("#0B3325"), 0.55));
  const key = new DirectionalLight(new Color("#FFE6B8"), 1.7); key.position.set(-4, 7, 5); scene.add(key);
  const rim = new DirectionalLight(new Color("#A7C7BD"), 0.7); rim.position.set(5, 2, -4); scene.add(rim);

  const rig = new Group(); scene.add(rig);
  const goldMat = new MeshStandardMaterial({ color: new Color(PAL.gold), metalness: 0.6, roughness: 0.3, emissive: new Color(PAL.gold), emissiveIntensity: 0.2, flatShading: true });
  const padMat = new MeshStandardMaterial({ color: new Color("#ECE9E1"), roughness: 0.7, flatShading: true });
  const R = 1.9;   // distance of each property from the hub
  const spots = [["office", 0, -R], ["estate", -R, 0], ["retail", R, 0], ["industrial", 0, R]];
  const S = 0.36;  // model scale
  const items = [];
  spots.forEach(([name, x, z], i) => {
    const holder = new Group(); holder.position.set(x, 0, z); rig.add(holder);
    const pad = new Mesh(new CylinderGeometry(2.25 * S, 2.35 * S, 0.12, 8), padMat); pad.position.y = -0.06; pad.rotation.y = Math.PI / 8;
    const ring = new Mesh(new CylinderGeometry(2.26 * S, 2.26 * S, 0.025, 8), goldMat); ring.position.y = 0.002; ring.rotation.y = Math.PI / 8;
    const g = new Group(); const mats = palette(); MODELS[name](g, mats, kit(g, mats)); g.scale.setScalar(S);
    holder.add(pad, ring, g);
    items.push({ holder, phase: i * 1.6 });
    // Pathway from the hub to this platform
    const len = R - 2.3 * S - 0.32, ang = Math.atan2(x, z);
    const path = new Mesh(new BoxGeometry(0.05, 0.02, len), goldMat);
    path.position.set(Math.sin(ang) * (0.32 + len / 2), -0.04, Math.cos(ang) * (0.32 + len / 2)); path.rotation.y = ang;
    rig.add(path);
  });
  // Central hub
  const hub = new Mesh(new CylinderGeometry(0.3, 0.34, 0.1, 10), goldMat); hub.position.y = -0.05; rig.add(hub);
  const hubTop = new Mesh(new CylinderGeometry(0.14, 0.14, 0.05, 16), new MeshStandardMaterial({ color: new Color("#FFFFFF"), emissive: new Color(PAL.gold), emissiveIntensity: 0.6, roughness: 0.3 }));
  hubTop.position.y = 0.02; rig.add(hubTop);
  // Pulses travelling hub -> property
  const pulseMat = new MeshBasicMaterial({ color: new Color("#FFE3A3") });
  const pulses = spots.map(([, x, z], i) => { const m = new Mesh(new SphereGeometry(0.045, 8, 6), pulseMat); rig.add(m); return { m, x, z, off: i * 0.25 }; });
  const shadow = new Mesh(new PlaneGeometry(9, 9), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.4; rig.add(shadow);

  let pointerX = 0, pointerY = 0, rotX = 0, rotY = 0, active = false, raf = 0, riseAt = performance.now();
  const t0 = performance.now();
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.max(3.9 / (2 * tan), 5.4 / (2 * tan * camera.aspect));
    camera.position.set(0, dist * 0.55, dist); camera.lookAt(0, 0.1, 0); camera.updateProjectionMatrix();
    if (!active) render(performance.now());
  }
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const ease = t => 1 - Math.pow(1 - t, 3);
  function render(now) {
    const t = (now - t0) / 1000;
    const r = reduced ? 1 : ease(Math.min(1, (now - riseAt) / 1100));
    items.forEach((it, i) => {
      const local = reduced ? 1 : ease(Math.max(0, Math.min(1, (now - riseAt - i * 140) / 900)));
      it.holder.position.y = (reduced ? 0 : Math.sin(t + it.phase) * 0.04) - 0.6 * (1 - local);
    });
    pulses.forEach(p => {
      const f = reduced ? 0.5 : ((t * 0.35 + p.off) % 1);
      const d = 0.32 + f * (R - 2.3 * S - 0.32);
      const ang = Math.atan2(p.x, p.z);
      p.m.position.set(Math.sin(ang) * d, 0.0, Math.cos(ang) * d);
      p.m.visible = !reduced;
    });
    if (!reduced) {
      rotY += (pointerX * 0.12 + Math.sin(t * 0.25) * 0.05 - rotY) * 0.05;
      rotX += (pointerY * 0.05 - rotX) * 0.05;
    }
    rig.rotation.set(rotX, -0.62 + rotY, 0);
    rig.position.y = -0.1 * (1 - r);
    renderer.render(scene, camera);
  }
  function frame(now) { raf = 0; render(now); if (active) raf = requestAnimationFrame(frame); }
  size();
  return {
    pointer(x, y) { pointerX = x; pointerY = y; },
    rise() { riseAt = performance.now(); },
    setActive(on) {
      on = on && !reduced;
      if (on === active) { if (!on) render(performance.now()); return; }
      active = on;
      if (on && !raf) raf = requestAnimationFrame(frame);
      if (!on) { if (raf) cancelAnimationFrame(raf); raf = 0; render(performance.now()); }
    },
    destroy() { active = false; if (raf) cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); }
  };
}
