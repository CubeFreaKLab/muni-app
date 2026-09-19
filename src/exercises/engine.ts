import type { Draft, Exercise, Session } from "../content/types";
import { lexicon } from "../content/course";
export function graphemesFor(ex: Exercise, draft: Draft): string[] {
  if (ex.type !== "build_word") return [];
  const w = lexicon[ex.target];
  return (
    w.variants.find((v) => v.form === draft.variant)?.graphemes ?? w.graphemes
  );
}
// Tile identity is its index, so repeated letters remain independently selectable.
export function tileBank(ex: Exercise, draft: Draft): string[] {
  const a = graphemesFor(ex, draft);
  return a.length > 1 ? [...a.slice(1), a[0]] : a;
}
export function canCheck(ex: Exercise, d: Draft) {
  switch (ex.type) {
    case "build_word":
      return (d.tiles?.length ?? 0) === graphemesFor(ex, d).length;
    case "match_pairs":
      return d.matched?.length === ex.pairs.length;
    case "memory_pairs":
      return d.memoryMatched?.length === ex.pairs.length * 2;
    default:
      return !!d.selected;
  }
}
export function isCorrect(ex: Exercise, d: Draft) {
  switch (ex.type) {
    case "build_word": {
      const bank = tileBank(ex, d);
      const text = (d.tiles ?? [])
        .map((i) => bank[i])
        .join("")
        .normalize("NFC");
      const w = lexicon[ex.target];
      return [w.form, ...w.variants.map((v) => v.form)].some(
        (f) => f.normalize("NFC") === text,
      );
    }
    case "match_pairs":
    case "memory_pairs":
      return canCheck(ex, d);
    case "sort_words":
    case "dialogue_choice":
      return d.selected === ex.answer;
    default:
      return d.selected === ex.target;
  }
}
export function targetWords(ex: Exercise): string[] {
  return "target" in ex ? [ex.target] : ex.wordIds;
}
export function answerText(ex: Exercise, d: Draft) {
  if (ex.type === "sort_words")
    return `${lexicon[ex.target].form}: ${lexicon[ex.target].meaningEs}. Categoría: ${ex.categories.find((c) => c.id === ex.answer)?.label}.`;
  if (ex.type === "dialogue_choice")
    return ex.options.find((o) => o.id === ex.answer)?.text ?? "";
  if ("target" in ex) {
    const w = lexicon[ex.target];
    return `${w.form} significa ${w.meaningEs}.${d.variant ? ` ${d.variant} también está documentado.` : ""}`;
  }
  return ex.wordIds
    .map((id) => `${lexicon[id].form} · ${lexicon[id].meaningEs}`)
    .join(" / ");
}
export function createSession(
  lessonId: string,
  exercises: Exercise[],
  kind: Session["kind"] = "lesson",
): Session {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lessonId,
    kind,
    exercises,
    index: 0,
    answers: [],
    draft: {},
    currentMistakes: [],
    helped: false,
    feedback: null,
    startedAt: new Date().toISOString(),
  };
}
