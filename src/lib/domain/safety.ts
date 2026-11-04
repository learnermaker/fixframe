// ponytail: phrase matching catches obvious claims only, it is not a safety classifier. Humans
// still review everything; replace with a real policy check if this ever leaves the demo.
const UNSAFE_CLAIMS: ReadonlyArray<readonly [label: string, pattern: RegExp]> = [
  ["cause", /\b(caused by|root cause (is|was)|due to (a|an|the)\b|result of (a|an|the)\b|because of (a|an|the)\b)/i],
  ["diagnosis", /\b(is|was|indicates?( a| an)?|confirms?( a| an)?) (leak(ing)?|live|energi[sz]ed|short[- ]circuit(ed)?)\b/i],
  [
    "safety_certification",
    /\b(is|are|it's) (now )?(safe|hazard[- ]free|structurally sound)\b|\bsafe (to|for) (use|occupy|touch|load)\b|\bcertif(y|ies|ied)\b|\bno (safety )?(risk|hazard|danger)\b/i,
  ],
  [
    "repair_instruction",
    /\b(replace|rewire|re-?tighten|tighten|patch|seal|splice|solder|isolate|disconnect|unscrew|re-?attach) (the|this|that|a|an|its|it)\b|\b(turn|switch|shut) off the\b|\bstep[- ]by[- ]step\b/i,
  ],
];

/** Labels of the disallowed claim types found in the text. */
export function findUnsafeClaims(text: string): string[] {
  return UNSAFE_CLAIMS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
