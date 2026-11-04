// Renders public/demo-assets/src/**/*.svg to the committed PNGs and prints each mask's bounding
// box (the values hard-coded in fixtures.ts). See assets/README.md for how to run it.
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const root = new URL("../../public/demo-assets/", import.meta.url);

for (const name of ["cable-sheath", "handrail-bracket"]) {
  for (const dir of ["", "masks/"]) {
    const svg = readFileSync(new URL(`src/${dir}${name}.svg`, root), "utf8");
    const rendered = new Resvg(svg, { font: { loadSystemFonts: true } }).render();
    writeFileSync(new URL(`${dir}${name}.png`, root), rendered.asPng());
    if (dir) {
      const { pixels, width, height } = rendered;
      let [minX, minY, maxX, maxY] = [width, height, -1, -1];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] > 127) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      console.log(name, { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
    }
  }
}
