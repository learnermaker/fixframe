// Asset/mask consistency for every scenario (ADR 0003: photos are JPEG, some illustrations PNG): the fixture mask must be
// the same size as the source image, be non-empty, and agree with the fixture's bounding box. Decoded in the browser.
import { expect, test } from "@playwright/test";
import { SCENARIOS } from "../../src/data/scenarios";

const TOLERANCE_PX = 3;

for (const s of SCENARIOS) {
  test(`fixture mask matches image size and fixture box: ${s.id}`, async ({ page, request }) => {
    const res = await request.post("/api/segment", { data: { scenarioId: s.id, prompt: s.segmentationPrompt } });
    const body = await res.json();
    expect(body.ok, JSON.stringify(body)).toBe(true);
    const seg = body.segmentation;
    expect(seg.mask.format).toBe("public-path");
    expect((await request.get(seg.mask.value)).ok(), "mask file is served").toBe(true);

    await page.goto("/");
    const stats = await page.evaluate(async ({ maskUrl, imageUrl }) => {
      const load = (u: string) => new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error(u)); i.src = u; });
      const [mask, image] = await Promise.all([load(maskUrl), load(imageUrl)]);
      const c = document.createElement("canvas");
      c.width = mask.naturalWidth; c.height = mask.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(mask, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, on = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if ((d[(y * c.width + x) * 4 + 3] ?? 0) > 0) { on++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      return { mw: mask.naturalWidth, mh: mask.naturalHeight, iw: image.naturalWidth, ih: image.naturalHeight, minX, minY, maxX, maxY, on };
    }, { maskUrl: seg.mask.value as string, imageUrl: s.image.path });

    expect([stats.mw, stats.mh]).toEqual([seg.imageWidth, seg.imageHeight]);
    expect([stats.iw, stats.ih]).toEqual([seg.imageWidth, seg.imageHeight]);
    expect(stats.on, "mask has painted pixels").toBeGreaterThan(0);
    expect(seg.boxes.length).toBeGreaterThan(0);
    const box = seg.boxes[0] as { x: number; y: number; width: number; height: number };
    expect(Math.abs(box.x - stats.minX)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(Math.abs(box.y - stats.minY)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(Math.abs(box.x + box.width - 1 - stats.maxX)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(Math.abs(box.y + box.height - 1 - stats.maxY)).toBeLessThanOrEqual(TOLERANCE_PX);
  });
}
