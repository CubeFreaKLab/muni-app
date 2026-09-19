// Presentation events only: never persisted into progress or emitted during hydration.
let pending: { sessionId: string; at: number } | null = null;
const celebrated = new Set<string>();
export function offerMissionCelebration(sessionId: string) {
  if (!celebrated.has(sessionId)) pending = { sessionId, at: Date.now() };
}
export function takeMissionCelebration(sessionId: string): boolean {
  if (pending?.sessionId !== sessionId) return false;
  const recent = Date.now() - pending.at < 30000;
  pending = null;
  if (!recent || celebrated.has(sessionId)) return false;
  celebrated.add(sessionId); // Claimed before the player mounts, including cancelled effects.
  return true;
}
