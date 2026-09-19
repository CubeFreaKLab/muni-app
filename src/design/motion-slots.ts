import { characterAssetIds, providedIllustrations } from "./illustration-assets";

export type CharacterState = "idle" | "success" | "error";
// Supplied static poses; idle still comes from the original Figma character.
export const characterStates: Partial<Record<CharacterState, string>> = Object.fromEntries(
  Object.entries(characterAssetIds).map(([state, id]) => [state, providedIllustrations[id].xml]),
);
export const characterAspectRatios: Partial<Record<CharacterState, number>> = Object.fromEntries(
  Object.entries(characterAssetIds).map(([state, id]) => [state, providedIllustrations[id].aspectRatio]),
);
// Presentation only; static character poses and a supplied silent completion effect.
export const motionSlots = {
  missionComplete: { durationMs: 4400, deduplicateBy: "lastResult.sessionId", reducedMotion: "omit" },
  levelUnlocked: { reducedMotion: "omit" },
} as const;
