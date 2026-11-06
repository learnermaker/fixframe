# Meta Global AI Developer Hackathon — FixFrame Submission 

Prepared: 4 November 2026  
Track: Indie Developer  
Project: FixFrame  
Repository: https://github.com/learnermaker/fixframe


## Team

- Team name shown in the supplied form: `jims`
- Team member shown in the supplied form: Jim S
- Participation: Solo

## Track

**Indie Developer**

## Problem statement / theme

**Recommended selection: Push the Frontier.**

Rationale: FixFrame applies multimodal AI to a physical-world workflow involving visual inspection, industrial/structural maintenance observations and accountable action. This aligns with the event's description of pushing AI into manufacturing, energy and physical systems.

If the form's available choices differ from the two themes in the event material, use the closest exact option. Do not invent a problem-statement title.

## Project description

FixFrame turns visual inspection evidence into human-verified maintenance work orders. It combines Meta SAM 3.1, which segments relevant regions in an inspection image, with Muse Spark, which interprets the image and inspection context to produce structured issue drafts with supporting evidence and explicit unknowns. A reviewer can inspect, edit or reject the AI-generated findings, preserve provenance, and must explicitly confirm a finding before a work order can be created. The work order then supports checklist updates, status tracking and reviewer feedback.

The complete workflow is **Observe → Understand → Verify → Act**. Rather than stopping at image classification, FixFrame connects visual grounding and multimodal interpretation to a human-reviewed, traceable operational task. The five scenarios use fictional site and asset records, with credited photographs and authored illustrations as visual inputs. FixFrame is a human-supervised hackathon demonstration, not an autonomous diagnostic or safety-certification system.

## Public GitHub repository and licensing

https://github.com/learnermaker/fixframe

The repository's original FixFrame source code and project documentation are licensed under MIT. This licence does not relicense third-party material. In particular, the `@meta-sam/parser` dependency is under Meta's separate SAM License, and the bundled demo photographs retain their individual licences (CC BY 3.0, Unsplash License, and CC BY 2.0). The SAM License text is included in the repository at [licenses/SAM-LICENSE.txt](../licenses/SAM-LICENSE.txt). See [LICENSE](../LICENSE), [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), and the [photo provenance register](../assets/demo-evidence/README.md). Do not describe third-party assets or dependencies as MIT-licensed.

## Three-minute demo video

**Replace with final public URL:** `[PASTE YOUTUBE OR OTHER PUBLIC VIDEO URL]`

Target duration: 2:50–2:58. Confirm that the link is accessible without sign-in and that the video demonstrates actual model calls wherever it claims to show live AI behaviour.

## Describe your use of Meta products to build the submitted project

FixFrame uses Meta's models as complementary components in a multimodal inspection workflow. Meta SAM 3.1 is called through Meta Model API to segment image regions relevant to a text prompt. Muse Spark is called to interpret the inspection image together with its accompanying context and return structured issue information for review. The application validates and normalises provider responses into its domain model, preserves provenance and unknowns, and presents the result as a draft rather than an authoritative diagnosis.

The reviewer can inspect, edit or reject findings. A separate explicit human confirmation is required before a maintenance work order is created. The application supports live Meta mode and a clearly distinguished deterministic fixture mode for repeatable demos and tests; live failures are not silently replaced with fixtures. It also supports request-scoped BYOK without exposing the key to the browser's application bundle.

## Why are Meta's models important to your solution?

The workflow needs two different capabilities that complement one another. SAM 3.1 provides prompt-driven visual segmentation, connecting an inspection prompt to a specific image region. Muse Spark provides multimodal interpretation of the image and inspection context, turning observations into structured issue drafts with supporting evidence and unknowns. Together, they move FixFrame beyond a generic chatbot or a single image classifier toward a grounded review workflow. Human validation, provenance and explicit approval remain essential: the models assist the reviewer but do not make safety or maintenance decisions autonomously.



Answer according to your actual hands-on experience. Do not select the highest rating merely to optimise the submission.

## Additional feedback questions


### What was the biggest obstacle your team hit while building this project?

The main challenge was making two different model capabilities behave as one reliable, evidence-grounded workflow. SAM segmentation and Muse Spark's multimodal interpretation have different response structures, latency and failure modes. We had to normalise and validate their outputs, preserve provenance and unknowns, handle BYOK securely, and ensure that model failures never silently become fixture results. We also had to keep the human approval boundary explicit so an AI-generated observation could not automatically become a maintenance action.

### Compared with other AI models your team has used for the same kind of work, how did Meta's models perform on this project?

SAM 3.1 provided prompt-driven visual segmentation, while Muse Spark added image-and-context interpretation that could be converted into structured issue drafts. Their complementary roles were valuable for this workflow. The latest photo integration work reports successful live responses for all five scenarios, with one run per model/scenario. Performance was scenario-dependent and outputs require human review; these smoke tests do not establish comparative or real-world accuracy. Avoid numerical or superiority claims without a controlled benchmark.

### When your team chooses an AI model or coding tool, what matters most?

Task-level quality, reliability, latency, predictable structured outputs, clear documentation, data handling and security, ease of integration, transparent pricing and the ability to evaluate model behaviour. For physical-world workflows, traceability and the ability to preserve uncertainty are particularly important.

### What makes it hardest for your team to switch to a different AI model or coding tool?

Reworking provider integrations, prompts, structured-output schemas, evaluation datasets and safety checks. A model change can alter response formats, latency, failure modes and output quality, so the integration and regression effort can be significant.

### If your team took this project to production, what would most likely stop you from using Meta's models?

Production decisions would depend on verified performance on representative real-world data, latency and availability guarantees, rate limits, cost at expected volume, data-governance requirements, regional availability and the ability to monitor and evaluate model changes. FixFrame's current synthetic/curated demonstration is not sufficient to establish production readiness.

