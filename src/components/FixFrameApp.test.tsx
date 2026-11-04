// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureIssue, getFixtureSegmentation } from "../data/fixtures";
import { FixFrameApp } from "./FixFrameApp";

const SENTINEL_KEY = "FF_SENTINEL_BYOK_not-a-real-key";
const SCENARIO_ID = "water-ingress-01";

type Reply = { status?: number; body: unknown };
let replies: Partial<Record<"segment" | "extract", Reply>>;
const fetchMock = vi.fn(async (url: string) => {
  const route = url.endsWith("segment") ? "segment" : "extract";
  const reply = replies[route] ?? { body: route === "segment" ? { ok: true, segmentation: getFixtureSegmentation(SCENARIO_ID) } : { ok: true, issue: getFixtureIssue(SCENARIO_ID) } };
  return new Response(typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body), { status: reply.status ?? 200 });
});

const headersOfCall = (index: number) => (fetchMock.mock.calls[index] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
const button = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

async function openScenario(user: ReturnType<typeof userEvent.setup>) {
  await user.click(button(/ceiling tile/i));
}
async function reachReview(user: ReturnType<typeof userEvent.setup>) {
  await openScenario(user);
  await user.click(button(/extract issue/i));
  await screen.findByLabelText("Title");
}

beforeEach(() => {
  replies = {};
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("synthetic disclosure", () => {
  it("stays visible with no scenario chosen", () => {
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    expect(screen.getByText(/SYNTHETIC DEMO DATA/)).toBeTruthy();
  });
});

describe("review gate", () => {
  it("blocks the work order until a person confirms, and confirming alone creates nothing", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await reachReview(user);
    expect(button(/create work order/i).disabled).toBe(true);

    await user.click(button(/confirm issue/i));
    expect(button(/create work order/i).disabled).toBe(false);
    expect(screen.queryByText(/WO-DEMO-/)).toBeNull();

    await user.click(button(/create work order/i));
    expect(screen.getByText("WO-DEMO-001")).toBeTruthy();
  });

  it("sends the issue back for review when a confirmed field changes", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await reachReview(user);
    await user.click(button(/confirm issue/i));
    await user.selectOptions(screen.getByLabelText("Urgency"), "routine");
    expect(button(/create work order/i).disabled).toBe(true);
  });
});

describe("provenance", () => {
  it("shows DEMO_FIXTURE on fixture output and USER_EDIT only after a correction", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await openScenario(user);
    await user.click(button(/run segmentation/i));
    await screen.findByText("DEMO_FIXTURE");
    await user.click(button(/extract issue/i));
    const title = await screen.findByLabelText("Title");
    expect(screen.queryByText("USER_EDIT")).toBeNull();
    expect(screen.queryByText("LIVE_META")).toBeNull();

    await user.clear(title);
    await user.type(title, "Corrected title");
    await user.tab();
    expect(screen.getAllByText("USER_EDIT").length).toBeGreaterThan(0);
  });

  it("labels a live result LIVE_META", async () => {
    const user = userEvent.setup();
    const issue = getFixtureIssue(SCENARIO_ID)!;
    replies.extract = {
      body: { ok: true, issue: { ...issue, provenance: [{ source: "LIVE_META", provider: "meta", model: "muse-spark-1.3", operation: "extraction", requestId: "req-1", createdAt: "2026-11-04T00:00:00.000Z" }] } },
    };
    render(<FixFrameApp providerMode="live" hasDeploymentKey />);
    await reachReview(user);
    expect(screen.getByText("LIVE_META")).toBeTruthy();
    expect(screen.queryByText("DEMO_FIXTURE")).toBeNull();
  });

  it("keeps a rejected blank title and reports it", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await reachReview(user);
    const title = screen.getByLabelText("Title") as HTMLInputElement;
    await user.clear(title);
    await user.tab();
    expect(title.value).toBe("Discoloured ceiling tile observed");
    expect(screen.getByRole("alert").textContent).toMatch(/edited/i);
  });
});

describe("error states", () => {
  it.each([
    ["UNCONFIGURED", { body: { ok: false, error: { code: "UNCONFIGURED", message: "Live provider is not configured." } }, status: 503 }, /no meta api key/i],
    ["TIMEOUT", { body: { ok: false, error: { code: "TIMEOUT", message: "Provider did not respond." } }, status: 504 }, /did not answer in time/i],
    ["INVALID_RESPONSE", { body: { ok: false, error: { code: "INVALID_RESPONSE", message: "Bad output." } }, status: 502 }, /failed validation/i],
    ["a malformed issue", { body: { ok: true, issue: { id: 7, status: "bogus" } } }, /failed validation/i],
    ["a non-JSON reply", { body: "<html>gateway error</html>", status: 502 }, /failed validation/i],
  ])("shows %s with no review form and no fixture data", async (_name, reply, message) => {
    const user = userEvent.setup();
    replies.extract = reply;
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await openScenario(user);
    await user.click(button(/extract issue/i));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(message);
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.queryByText("Discoloured ceiling tile observed")).toBeNull();
    expect(screen.queryByRole("button", { name: /create work order/i })).toBeNull();
  });

  it("recovers through Retry", async () => {
    const user = userEvent.setup();
    replies.extract = { body: { ok: false, error: { code: "TIMEOUT", message: "Provider did not respond." } }, status: 504 };
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await openScenario(user);
    await user.click(button(/extract issue/i));
    await screen.findByRole("alert");
    delete replies.extract;
    await user.click(button(/^retry$/i));
    await screen.findByLabelText("Title");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("BYOK key", () => {
  const keyField = () => screen.getByLabelText("Meta API key") as HTMLInputElement;
  async function addKey(user: ReturnType<typeof userEvent.setup>) {
    await user.type(keyField(), SENTINEL_KEY);
    await user.click(button(/use for this session/i));
  }

  it("is not offered in fixture mode, and no key header is sent", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    expect(screen.queryByLabelText("Meta API key")).toBeNull();
    await openScenario(user);
    await user.click(button(/run segmentation/i));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(headersOfCall(0)["X-FixFrame-Meta-Key"]).toBeUndefined();
  });

  it("is masked, discloses server forwarding, and leaves the field after use", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="live" hasDeploymentKey={false} />);
    expect(keyField().type).toBe("password");
    expect(screen.getByText(/forwards it to Meta/)).toBeTruthy();
    expect(screen.getByText(/whoever runs this server could read it/)).toBeTruthy();
    await addKey(user);
    expect(keyField().value).toBe("");
    expect(document.documentElement.outerHTML).not.toContain(SENTINEL_KEY);
  });

  it("goes only to same-origin routes, in its header, and stops after Clear key", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="live" hasDeploymentKey={false} />);
    await addKey(user);
    await openScenario(user);
    await user.click(button(/run segmentation/i));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/segment");
    expect(headersOfCall(0)["X-FixFrame-Meta-Key"]).toBe(SENTINEL_KEY);
    expect(String(init.body)).not.toContain(SENTINEL_KEY);

    await user.click(button(/clear key/i));
    await user.click(button(/run segmentation/i));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(headersOfCall(1)["X-FixFrame-Meta-Key"]).toBeUndefined();
  });

  it("is gone after a refresh and never reaches browser storage or cookies", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FixFrameApp providerMode="live" hasDeploymentKey={false} />);
    await addKey(user);
    await openScenario(user);
    await user.click(button(/extract issue/i));
    await screen.findByLabelText("Title");
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie + location.href;
    expect(stored).not.toContain(SENTINEL_KEY);

    unmount(); // a fresh mount is what a page refresh does to in-memory state
    render(<FixFrameApp providerMode="live" hasDeploymentKey={false} />);
    await openScenario(user);
    await user.click(button(/run segmentation/i));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(headersOfCall(1)["X-FixFrame-Meta-Key"]).toBeUndefined();
  });
});

describe("work order", () => {
  it("records checklist, status and feedback on the audit timeline", async () => {
    const user = userEvent.setup();
    render(<FixFrameApp providerMode="fixture" hasDeploymentKey={false} />);
    await reachReview(user);
    await user.click(button(/confirm issue/i));
    await user.click(button(/create work order/i));
    const timeline = () => screen.getByRole("list", { name: /audit timeline/i }).querySelectorAll("li").length;
    const before = timeline();

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.selectOptions(screen.getByLabelText("Status"), "in_progress");
    await user.type(screen.getByLabelText("Feedback"), "Synthetic reviewer note.");
    await user.click(button(/add feedback/i));

    expect(screen.getByText("Synthetic reviewer note.")).toBeTruthy();
    expect(timeline()).toBe(before + 3);
    const options = Array.from((screen.getByLabelText("Status") as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(["in_progress", "blocked", "completed"]);
  });
});
