import { FixFrameApp } from "../components/FixFrameApp";

// Provider mode is a runtime setting, so this page must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <FixFrameApp
      providerMode={process.env.FIXFRAME_PROVIDER_MODE === "live" ? "live" : "fixture"}
      hasDeploymentKey={Boolean(process.env.META_API_TOKEN?.trim())}
    />
  );
}
