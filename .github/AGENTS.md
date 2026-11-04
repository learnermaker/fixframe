# Repository-wide coding-agent instructions

1. Read README.md, PLAN.md, and ARCHITECTURE.md before changing code.
2. Treat all data as synthetic. Preserve synthetic labels in UI and fixtures.
3. Do not invent Meta API endpoints, model IDs, parameters, or response formats. Verify current official docs before implementation and document the source/date.
4. Never send secrets to the browser or commit them.
5. Keep model providers behind typed interfaces. Fixture and live modes must be explicit.
6. Never silently switch from live to fixture after failure.
7. Human confirmation is required before creating a work order.
8. Do not generate hazardous repair instructions or safety certifications.
9. Add tests for each new contract/state transition and report what was actually run.
10. Keep changes small and reviewable. Do not expand beyond the hackathon critical path.
11. Do not claim customer validation, accuracy, ROI, safety improvement, or real-world deployment.
12. Before public release, check licenses for code, assets, dependencies, and the full commit history.
