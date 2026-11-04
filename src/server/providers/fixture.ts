import { getFixtureIssue, getFixtureSegmentation } from "../../data/fixtures";
import { fail, type Providers } from "./types";

const NO_FIXTURE = "No demo fixture exists for this scenario.";

export const fixtureProviders: Providers = {
  segmentation: {
    async segment(scenario) {
      const value = getFixtureSegmentation(scenario.id);
      return value ? { ok: true, value } : fail("UNSUPPORTED_INPUT", NO_FIXTURE);
    },
  },
  extraction: {
    async extract(scenario) {
      const value = getFixtureIssue(scenario.id);
      return value ? { ok: true, value } : fail("UNSUPPORTED_INPUT", NO_FIXTURE);
    },
  },
};
