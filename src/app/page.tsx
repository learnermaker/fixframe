import { FixFrameApp } from "../components/FixFrameApp";
import { deploymentMetaKey, providerMode } from "../server/env";

// Provider mode is a runtime setting, so this page must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  return <FixFrameApp providerMode={providerMode()} hasDeploymentKey={deploymentMetaKey() !== null} />;
}
