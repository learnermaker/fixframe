import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Scenario } from "../../lib/contracts";

/** The scenario's committed image as Meta's input part, plus its size. */
export async function loadScenarioImage(scenario: Scenario) {
  const { path: publicPath, width, height } = scenario.image;
  const bytes = await readFile(path.join(process.cwd(), "public", publicPath));
  const mime = publicPath.endsWith(".jpg") ? "image/jpeg" : "image/png";
  return {
    width,
    height,
    part: { type: "input_image", image_url: `data:${mime};base64,${bytes.toString("base64")}` },
  };
}
