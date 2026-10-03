// MFS Connection Model: the 3D centre logo.
// Built from the real mark's path data (no image textures), extruded and
// rendered in brushed metallic gold. Bundled by tools/build-scene.mjs into
// site/assets/js/acm-scene.js, which site.js loads only on capable desktops.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Shape, Path,
  ExtrudeGeometry, MeshStandardMaterial, CanvasTexture, RepeatWrapping,
  PMREMGenerator, DirectionalLight, ACESFilmicToneMapping, SRGBColorSpace,
  Color, Box3, Vector3
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// The MFS mark from mark.svg, in SVG units: the letters with the knock-out gap
// around the bar already cut (one subpath per piece), the bar itself, and the dot centres.
const LETTERS_PATH = "M417.74 177.78 L424.54 177.00 L430.96 175.70 L436.98 173.88 L439.81 172.76 L445.02 170.07 L447.39 168.50 L451.67 164.90 L455.34 160.70 L458.27 155.85 L460.37 150.33 L461.63 144.12 L461.95 140.77 L462.00 135.24 L461.33 129.72 L459.84 124.91 L457.86 121.21 L433.34 118.56 L411.68 116.52 L382.81 114.25 L359.71 112.80 L361.91 115.68 L365.32 118.97 L370.55 122.60 L374.86 124.85 L381.03 127.29 L387.47 129.26 L409.06 134.03 L416.33 136.12 L419.99 137.80 L422.00 139.28 L423.22 141.13 L423.63 143.36 L423.38 145.38 L422.34 147.37 L420.65 148.85 L418.42 149.89 L415.36 150.69 L412.05 151.07 L405.80 151.17 L401.98 150.95 L398.47 150.46 L395.32 149.67 L392.71 148.38 L390.65 146.59 L389.61 145.08 L388.60 142.26 L388.27 138.77 L388.44 136.39 L352.91 136.39 L352.74 138.60 L353.02 144.22 L353.37 146.84 L354.50 151.70 L356.19 156.07 L357.25 158.06 L361.10 163.39 L362.60 164.95 L365.92 167.75 L369.66 170.13 L375.94 173.03 L382.95 175.20 L390.65 176.67 L398.87 177.59 L407.55 178.01ZM393.04 89.93 L393.69 87.70 L394.73 86.32 L396.26 85.09 L398.28 84.08 L400.81 83.28 L403.80 82.75 L407.25 82.52 L411.09 82.61 L415.46 83.46 L417.25 84.20 L419.49 85.62 L421.22 87.32 L422.10 88.62 L423.03 90.71 L423.47 92.49 L449.13 95.08 L458.82 95.08 L458.72 90.74 L458.14 86.39 L456.37 80.45 L453.50 75.23 L451.08 72.12 L448.27 69.32 L445.09 66.81 L441.53 64.60 L437.70 62.68 L433.59 61.04 L429.23 59.69 L424.61 58.63 L414.87 57.30 L404.56 57.03 L397.00 57.51 L392.11 58.15 L387.34 59.04 L382.75 60.21 L378.41 61.67 L374.33 63.44 L370.50 65.50 L367.00 67.88 L363.90 70.60 L361.18 73.66 L358.86 77.06 L357.00 80.82 L355.67 84.96 L355.16 87.51ZM105.73 176.00 L105.62 118.14 L72.58 121.70 L72.58 176.00ZM111.18 117.70 L127.15 176.00 L155.20 176.00 L172.27 112.95 L147.96 114.53 L144.32 129.59 L142.96 129.59 L139.50 115.16ZM176.96 112.78 L176.79 176.00 L212.66 176.00 L212.66 111.12 L187.91 112.12ZM212.66 59.04 L162.17 59.04 L154.37 89.02 L186.68 87.15 L212.66 86.10ZM124.94 59.04 L72.58 59.04 L72.58 96.53 L106.09 92.97 L133.15 90.59ZM327.75 134.01 L327.75 111.32 L303.41 110.60 L281.75 110.27 L241.22 110.42 L241.22 176.00 L278.79 176.00 L278.79 134.01ZM335.74 59.04 L241.22 59.04 L241.22 85.42 L267.29 85.21 L289.27 85.35 L311.31 85.79 L335.74 86.61Z";
const BAR_PATH = "M35.47 120.44 L64.46 116.63 L93.44 113.34 L115.18 111.20 L144.16 108.79 L165.89 107.31 L194.87 105.79 L216.60 104.99 L245.58 104.35 L281.80 104.27 L310.78 104.78 L339.76 105.79 L368.74 107.31 L404.96 109.93 L433.94 112.59 L462.92 115.76 L499.16 120.44 L500.44 120.49 L501.69 120.29 L502.89 119.85 L503.98 119.18 L504.91 118.32 L505.66 117.28 L506.19 116.13 L506.49 114.89 L506.54 113.61 L506.34 112.36 L505.90 111.16 L505.23 110.07 L504.37 109.14 L503.33 108.39 L502.18 107.86 L500.94 107.56 L471.76 103.73 L449.86 101.19 L427.96 98.94 L406.05 96.98 L369.52 94.34 L347.64 93.14 L325.74 92.23 L289.20 91.35 L267.33 91.21 L245.43 91.35 L216.19 91.99 L186.99 93.14 L157.78 94.80 L121.30 97.60 L84.77 101.19 L62.87 103.73 L40.97 106.56 L33.69 107.56 L32.45 107.86 L31.30 108.39 L30.26 109.14 L29.40 110.07 L28.73 111.16 L28.29 112.36 L28.09 113.61 L28.14 114.89 L28.44 116.13 L28.97 117.28 L29.72 118.32 L30.65 119.18 L31.74 119.85 L32.94 120.29 L34.19 120.49Z";
const DOTS = [[34.58, 114.00], [500.05, 114.00]];

function parsePath(d) {
  // Minimal parser for the M/L/H/V/Q/Z commands used by the mark.
  const tokens = d.match(/[MLHVQZ]|-?\d*\.?\d+/gi);
  const paths = []; let cur = null; let cmd = null; let x = 0, y = 0; let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === "M") { cur = new Path(); paths.push(cur); x = num(); y = num(); cur.moveTo(x, -y); cmd = "L"; }
    else if (cmd === "L") { x = num(); y = num(); cur.lineTo(x, -y); }
    else if (cmd === "H") { x = num(); cur.lineTo(x, -y); }
    else if (cmd === "V") { y = num(); cur.lineTo(x, -y); }
    else if (cmd === "Q") { const cx = num(), cy = num(); x = num(); y = num(); cur.quadraticCurveTo(cx, -cy, x, -y); }
    else if (cmd === "Z") { cur.closePath(); }
  }
  return paths;
}

function dotShape(cx, cy, r) { const s = new Shape(); s.absarc(cx, -cy, r, 0, Math.PI * 2, false); return s; }

function brushedTexture() {
  // Procedural brushed-metal streaks: no download, ~0 KB.
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 900; k++) {
    const y = Math.random() * 256, v = 110 + Math.random() * 40;
    g.strokeStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`;
    g.lineWidth = Math.random() * 1.2 + 0.2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + (Math.random() - 0.5) * 2); g.stroke();
  }
  const tex = new CanvasTexture(cv);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(0.012, 0.012);
  return tex;
}

export function createScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 9);

  const key = new DirectionalLight(new Color("#FFE2A8"), 1.6); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new DirectionalLight(new Color("#CFE0D6"), 0.9); rim.position.set(4, -2, -3); scene.add(rim);

  const brushed = brushedTexture();
  // Spec: thickness 0.15, roughness 0.18, metalness 0.65, brushed gold.
  const gold = new MeshStandardMaterial({ color: new Color("#D2A045"), metalness: 0.65, roughness: 0.18, bumpMap: brushed, bumpScale: 0.6, roughnessMap: brushed, envMapIntensity: 1.15 });
  const glowGold = new MeshStandardMaterial({ color: new Color("#D9A441"), metalness: 0.5, roughness: 0.22, emissive: new Color("#D9A441"), emissiveIntensity: 0.25, envMapIntensity: 1.1 });

  const SCALE = 0.008;                  // the 500-unit-wide MFS mark ≈ 4 world units
  const depth = 0.15 / SCALE;           // 0.15 world units thick
  const bevel = { bevelEnabled: true, bevelThickness: 1.2, bevelSize: 0.9, bevelSegments: 2, curveSegments: 6 };

  const mShapes = parsePath(LETTERS_PATH).map(p => new Shape(p.getPoints()));
  const aMesh = new Mesh(new ExtrudeGeometry(mShapes, { depth, ...bevel }), gold);
  const barMesh = new Mesh(new ExtrudeGeometry(parsePath(BAR_PATH).map(p => new Shape(p.getPoints())), { depth: depth * 0.7, ...bevel }), gold);
  barMesh.position.z = depth * 0.65;
  const dotGeo = new ExtrudeGeometry(DOTS.map(([x, y]) => dotShape(x, y, 17)), { depth: depth * 0.9, ...bevel, curveSegments: 14 });
  const dots = new Mesh(dotGeo, glowGold); dots.position.z = depth * 0.8;

  const logo = new Group(); logo.add(aMesh, barMesh, dots);
  const box = new Box3().setFromObject(logo); const centre = box.getCenter(new Vector3());
  logo.children.forEach(m => { m.position.x -= centre.x; m.position.y -= centre.y; m.position.z -= centre.z; });
  logo.scale.setScalar(SCALE);

  const rig = new Group(); rig.add(logo); scene.add(rig);

  // Animation state
  let pointerX = 0, pointerY = 0, rotX = 0, rotY = 0;
  let riseStart = -1, pulseAt = -10, active = true, raf = 0, started = false;
  const t0 = performance.now();
  rig.visible = false;

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the logo (≈3.4 × 2.3 world units) with breathing room.
    const fitH = Math.max(1.7, 4.9 / camera.aspect);
    camera.position.z = fitH / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(size); ro.observe(canvas); size();

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    // Rise from depth over 0.9 s.
    let r = 1;
    if (riseStart >= 0) r = Math.min(1, (now - riseStart) / 900);
    const er = easeOut(r);
    rig.position.z = -4 * (1 - er);
    canvas.style.opacity = String(er);
    // Float: y = sin(t) * 0.08
    rig.position.y = Math.sin(t) * 0.08;
    // Pointer parallax: rotation.y = x * 0.15, rotation.x = y * 0.05 (eased), plus a slow idle sway so the depth reads.
    rotY += (pointerX * 0.15 + Math.sin(t * 0.45) * 0.07 - rotY) * 0.06;
    rotX += (pointerY * 0.05 - rotX) * 0.06;
    rig.rotation.set(rotX, rotY, 0);
    // Gold pulse on the two dots.
    const since = t - pulseAt;
    glowGold.emissiveIntensity = 0.25 + (since >= 0 && since < 1.2 ? Math.sin((since / 1.2) * Math.PI) * 1.1 : 0);
    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }
  function loop() { if (!raf && active && started) raf = requestAnimationFrame(frame); }

  return {
    rise() { started = true; rig.visible = true; riseStart = performance.now(); loop(); },
    show() { started = true; rig.visible = true; riseStart = -1; canvas.style.opacity = "1"; loop(); },
    setPointer(x, y) { pointerX = x; pointerY = y; },
    pulse() { pulseAt = (performance.now() - t0) / 1000; },
    setActive(on) { active = on; if (on) loop(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    dispose() { this.setActive(false); ro.disconnect(); renderer.dispose(); }
  };
}
