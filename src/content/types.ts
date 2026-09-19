export type GameType =
  | "picture_choice"
  | "match_pairs"
  | "memory_pairs"
  | "build_word"
  | "scene_hunt"
  | "sort_words"
  | "count_objects"
  | "dialogue_choice";
export type Lexeme = {
  id: string;
  form: string;
  meaningEs: string;
  graphemes: string[];
  variants: { form: string; graphemes: string[]; note: string }[];
  languagePackId: string;
  region: string;
  source: { title: string; url: string; pdfPage: number; entry: string };
  reviewStatus: "source_checked";
  nativeSpeakerReviewed: false;
  context: string;
  illustration: string;
  category?:
    | "naturaleza"
    | "construcciones"
    | "animales"
    | "objetos"
    | "numeros"
    | "colores"
    | "personas";
  number?: number;
};
type Base = { id: string; wordIds: string[]; instruction?: string };
export type Exercise = Base &
  (
    | { type: "picture_choice"; target: string; options: string[] }
    | { type: "match_pairs" | "memory_pairs"; pairs: string[] }
    | { type: "build_word"; target: string }
    | { type: "scene_hunt"; target: string; objects: string[] }
    | {
        type: "sort_words";
        target: string;
        categories: { id: string; label: string }[];
        answer: string;
      }
    | {
        type: "count_objects";
        target: string;
        count: number;
        object: string;
        options: string[];
      }
    | {
        type: "dialogue_choice";
        context: string;
        prompt: string;
        options: { id: string; text: string }[];
        answer: string;
        source: string;
        reviewed: boolean;
      }
  );
export type Lesson = {
  id: string;
  number: number;
  unit: number;
  title: string;
  description: string;
  wordIds: string[];
  exercises: Exercise[];
  prerequisite: string | null;
  status: "ready" | "pending";
  kind: "lesson" | "review";
  pendingReason?: string;
  mission?: { context: string; objective: string; newWords: string[]; reusedWords: string[]; resolution: string };
};
export type Draft = {
  selected?: string;
  tiles?: number[];
  variant?: string;
  left?: string;
  matched?: string[];
  flipped?: number[];
  memoryMatched?: number[];
  mismatch?: boolean;
};
export type Answer = {
  exerciseId: string;
  firstTry: boolean;
  helped: boolean;
  wordIds: string[];
  outcome?: "correct" | "incorrect" | "assisted";
  errors?: number;
};
export type Session = {
  id: string;
  lessonId: string;
  kind: "lesson" | "review" | "recovery";
  exercises: Exercise[];
  index: number;
  answers: Answer[];
  draft: Draft;
  currentMistakes: string[];
  helped: boolean;
  feedback: null | "correct" | "incorrect";
  startedAt: string;
  phase?: "answering" | "feedback";
  excluded?: string[];
  pairResults?: Record<string, { chosen: string; correct: boolean }>;
  pendingPair?: string | null;
  hintVisible?: boolean;
  feedbackAt?: number;
};
