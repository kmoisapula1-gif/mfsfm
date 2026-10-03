// Bundles the 3D scenes (tree-shaken Three.js) into the static site.
// Run from this folder:  npm install && node build-scene.mjs
import { build } from "esbuild";
for (const name of ["acm-scene", "env-scene"]) {
  await build({
    entryPoints: [`src/${name}.js`], bundle: true, format: "esm", minify: true,
    target: "es2020", outfile: `../site/assets/js/${name}.js`, legalComments: "eof"
  });
  console.log(`Built site/assets/js/${name}.js`);
}
