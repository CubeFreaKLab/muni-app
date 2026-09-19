import type { Session } from "../content/types";
import { getLesson, lexicon } from "../content/course";
import { targetWords } from "../exercises/engine";
import { economy } from "./config";

export type Completion = { completedAt: string; firstCorrect: number; total: number; sessionId: string };
export type Progress = {
  version: 2; onboarded: boolean; languageId: string; name: string; goal: number;
  reduceMotion: boolean; vibration: boolean;
  completed: Record<string, Completion>; learned: string[]; bookmarks: string[];
  review: Record<string, { mistakes: number; addedAt: string }>;
  active: Session | null; recovery: Session | null;
  lastResult: (Completion & { lessonId: string; kind: Session["kind"]; newWords: number; rewarded: boolean; helped: number; errors: number; seeds: number }) | null;
  finishedSessions: string[]; practiceDays: Record<string, string[]>;
  missionDays: Record<string, string[]>;
  lives: number; regenerateAt: number | null; seeds: number;
  operations: Record<string, { at: string; seeds: number; lives: number; reason: string }>;
  migration?: { from: number; at: string; economy: string };
};
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
export const initial = (): Progress => ({
  version: 2, onboarded: false, languageId: "quh-BO", name: "Invitado", goal: 1,
  reduceMotion: false, vibration: false, completed: {}, learned: [], bookmarks: [], review: {}, active: null, recovery: null,
  lastResult: null, finishedSessions: [], practiceDays: {}, missionDays: {},
  lives: economy.initialLives, seeds: economy.initialSeeds, regenerateAt: null, operations: {},
});
export function migrate(raw: unknown): Progress {
  const d = raw as Record<string, any>;
  if (!d || ![1,2].includes(d.version) || !d.completed || !Array.isArray(d.learned) || !Array.isArray(d.bookmarks)) throw new Error("Formato de progreso desconocido");
  if (d.version === 2) return { ...initial(), ...d } as Progress;
  const next: Progress = { ...initial(), ...d, version: 2 };
  next.migration = { from: 1, at: new Date().toISOString(), economy: "Cinco vidas; cero semillas. Sin premios retroactivos. Se conservan las finalizaciones anteriores." };
  for (const [day, ids] of Object.entries(next.practiceDays)) {
    const valid = ids.filter(id => !!getLesson(id));
    if (valid.length) next.missionDays[day] = [...new Set(valid)];
  }
  for (const [id, c] of Object.entries(next.completed)) {
    if (getLesson(id) && Number.isFinite(Date.parse(c.completedAt))) {
      const day = localDate(new Date(c.completedAt));
      next.missionDays[day] = [...new Set([...(next.missionDays[day] || []), id])];
    }
  }
  if (next.lastResult) next.lastResult = { ...next.lastResult, errors: Math.max(0,next.lastResult.total-next.lastResult.firstCorrect), seeds: 0 };
  if (next.active) {
    const s = next.active;
    const e = s.exercises[s.index];
    s.phase = s.feedback ? "feedback" : "answering";
    s.answers = s.answers.map(a => ({...a, outcome: a.firstTry ? "correct" : "assisted", errors: a.firstTry ? 0 : 1}));
    // A v1 error already shown becomes a confirmed answer without a retroactive life loss.
    if (e && s.feedback === "incorrect" && !s.answers.some(a => a.exerciseId === e.id)) s.answers.push({exerciseId:e.id, firstTry:false, helped:s.helped, wordIds:targetWords(e), outcome:"incorrect", errors:1});
    s.pairResults = {};
    if (e?.type === "match_pairs") for (const id of s.draft.matched || []) s.pairResults[id] = { chosen:id, correct:true };
  }
  return next;
}
export function regenerate(d: Progress, now = Date.now()): Progress {
  if (!d.regenerateAt || now < d.regenerateAt || d.lives >= economy.maxLives) return d;
  const gained = Math.min(economy.maxLives-d.lives, Math.floor((now-d.regenerateAt)/economy.regenerationMs)+1);
  const lives = d.lives+gained;
  return {...d, lives, regenerateAt: lives === economy.maxLives ? null : d.regenerateAt+gained*economy.regenerationMs};
}
export function operation(d: Progress, id: string, seeds: number, lives: number, reason: string): Progress {
  if (d.operations[id] || d.seeds+seeds < 0) return d;
  const count = Math.max(0, Math.min(economy.maxLives,d.lives+lives));
  return {...d, seeds:d.seeds+seeds, lives:count,
    regenerateAt: count === economy.maxLives ? null : d.regenerateAt ?? Date.now()+economy.regenerationMs,
    operations:{...d.operations,[id]:{at:new Date().toISOString(), seeds,lives:count-d.lives,reason}}};
}
export function queueMistakes(d: Progress, ids: string[]): Progress {
  const review = {...d.review};
  for (const id of new Set(ids.filter(id => lexicon[id]))) review[id] = { mistakes:(review[id]?.mistakes || 0)+1, addedAt:review[id]?.addedAt || new Date().toISOString() };
  return {...d,review};
}
export function streak(d: Progress, now = new Date()): number {
  const date = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  if (!d.missionDays[localDate(date)]?.length) date.setDate(date.getDate()-1);
  let count=0;
  while (d.missionDays[localDate(date)]?.length) { count++; date.setDate(date.getDate()-1); }
  return count;
}
