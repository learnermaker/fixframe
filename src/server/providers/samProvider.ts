import { randomUUID } from "node:crypto";
import { decodeMaskToRaster, parseImageStream, recordsOfKind, type SegmentationMaskRecord } from "@meta-sam/parser";
import { SegmentationSchema, type Box } from "../../lib/contracts";
import { alphaPngDataUrl } from "./alphaPng";
import { loadScenarioImage } from "./demoImage";
import { createResponse } from "./metaClient";
import { fail, type SegmentationProvider } from "./types";

const MODEL = "sam-3.1";
const MAX_PROMPT_LENGTH = 200;
const INVALID = "SAM's output could not be read as a segmentation, so it was discarded.";

// The official parser reads response events; our call is not streamed, so it gets one complete text.
async function* eventsFor(text: string) {
  const lane = { item_id: "message", output_index: 0, content_index: 0 };
  yield { type: "response.output_text.delta", ...lane, delta: text };
  yield { type: "response.output_text.done", ...lane, text };
  yield { type: "response.completed" };
}

async function readMasks(text: string): Promise<readonly SegmentationMaskRecord[] | null> {
  if (text.trim() === "") return []; // how SAM says nothing matched
  const result = await parseImageStream(eventsFor(text)).finalResult;
  const masks = recordsOfKind(result.records, "mask");
  const damaged = result.outcome.status !== "completed" || result.diagnostics.some((d) => d.severity === "error");
  return damaged || masks.length === 0 ? null : masks;
}

/** Each SAM raster covers only its own box, so they are painted into one full-frame mask. */
function paint(masks: readonly SegmentationMaskRecord[], width: number, height: number): Uint8Array | null {
  const frame = new Uint8Array(width * height);
  for (const { mask, bounds } of masks) {
    const fits =
      bounds.right <= width &&
      bounds.bottom <= height &&
      bounds.right - bounds.left === mask.width &&
      bounds.bottom - bounds.top === mask.height;
    if (!fits) return null;
    const raster = decodeMaskToRaster(mask);
    for (let row = 0; row < mask.height; row++) {
      for (let column = 0; column < mask.width; column++) {
        if (raster[row * mask.width + column]) frame[(bounds.top + row) * width + bounds.left + column] = 1;
      }
    }
  }
  return frame;
}

export const samProvider = (key: string): SegmentationProvider => ({
  async segment(scenario, prompt) {
    if (prompt.length > MAX_PROMPT_LENGTH) return fail("UNSUPPORTED_INPUT", `Keep the description under ${MAX_PROMPT_LENGTH} characters.`);
    const image = await loadScenarioImage(scenario);
    const response = await createResponse(key, {
      model: MODEL,
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: prompt }, image.part] }],
    });
    if (!response.ok) return response;

    let frame: Uint8Array | null;
    let boxes: Box[];
    try {
      const masks = await readMasks(response.value.text);
      if (!masks) return fail("INVALID_RESPONSE", INVALID);
      frame = paint(masks, image.width, image.height);
      boxes = masks.map(({ bounds }) => ({ x: bounds.left, y: bounds.top, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top }));
    } catch {
      return fail("INVALID_RESPONSE", INVALID); // the parser and decoder throw on corrupt payloads
    }
    if (!frame) return fail("INVALID_RESPONSE", INVALID);

    const segmentation = SegmentationSchema.safeParse({
      id: `seg-${randomUUID()}`,
      imageWidth: image.width,
      imageHeight: image.height,
      mask: { format: "alpha-png-data-url", value: alphaPngDataUrl(frame, image.width, image.height) },
      boxes,
      provenance: {
        source: "LIVE_META",
        provider: "meta",
        model: MODEL,
        operation: "segmentation",
        requestId: response.value.requestId,
        createdAt: new Date().toISOString(),
      },
    });
    return segmentation.success ? { ok: true, value: segmentation.data } : fail("INVALID_RESPONSE", INVALID);
  },
});
