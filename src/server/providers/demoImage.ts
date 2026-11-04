import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Scenario } from "../../lib/contracts";

/** The scenario's PNG as Meta's input part, plus its size from the IHDR chunk. */
export async function loadScenarioImage(scenario: Scenario) {
  const png = await readFile(path.join(process.cwd(), "public", scenario.image.path));
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    part: { type: "input_image", image_url: `data:image/png;base64,${png.toString("base64")}` },
  };
}
