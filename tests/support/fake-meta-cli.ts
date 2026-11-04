// Runs the fake Meta upstream as a process for Playwright's webServer. Node 24 strips types natively.
import { startFakeMeta, type UpstreamMode } from "./fake-meta.ts";

const mode = (process.env.FAKE_META_MODE ?? "muse-valid") as UpstreamMode;
const fake = await startFakeMeta(mode, { port: Number(process.env.FAKE_META_PORT), rejectKey: process.env.FAKE_META_REJECT_KEY || undefined });
console.log(`fake meta (${mode}) listening on ${fake.url}`);
