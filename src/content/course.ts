import plan from "../../content/course-plan.json";
import pilot from "../../content/pilot-source-checked.json";
import expanded from "../../content/expanded-lexicon.json";
import type { Exercise, Lexeme, Lesson, GameType } from "./types";
import { environments } from "./world";
export const sourceTitle = "CENAQ · Diccionario de la Nación Quechua";
export const sourceUrl =
  "https://www.proeibandes.org/wp-content/uploads/2019/04/4Diccionario.pdf";
export const lexicon: Record<string, Lexeme> = Object.fromEntries(
  pilot.map((p) => [
    p.form,
    {
      id: p.form,
      form: p.form,
      meaningEs: p.meaningEs,
      graphemes: p.graphemes,
      variants: p.variants.map((v) => ({
        form: v.form,
        graphemes: Array.from(v.form),
        note: "Sinónimo documentado en CENAQ. Se acepta en construcción libre de esta palabra.",
      })),
      languagePackId: "quh-BO",
      region:
        "Quechua boliviano · CENAQ; la entrada no especifica una región menor.",
      source: {
        title: sourceTitle,
        url: sourceUrl,
        pdfPage: p.sources[0].pdfPage1Based,
        entry: p.form,
      },
      reviewStatus: "source_checked",
      nativeSpeakerReviewed: false,
      context: p.usageNotes,
      illustration: p.form,
      category: p.form === "wasi" ? "construcciones" : "naturaleza",
    } as Lexeme,
  ]),
);
for (const w of expanded) {
  lexicon[w.form] = {
    id: w.form,
    form: w.form,
    meaningEs: w.meaningEs,
    graphemes: w.graphemes,
    variants: "variants" in w ? (w.variants ?? []) : [],
    languagePackId: "quh-BO",
    region: `Quechua boliviano · marcas de CENAQ: ${w.region}. CHU: Chuquisaca; LPZ: La Paz; PTS: Potosí; CBB: Cochabamba.`,
    source: {
      title: sourceTitle,
      url: sourceUrl,
      pdfPage: w.page,
      entry: w.form,
    },
    reviewStatus: "source_checked",
    nativeSpeakerReviewed: false,
    context: w.context,
    illustration: w.form,
    category: w.category as Lexeme["category"],
    number: "number" in w ? w.number : undefined,
  };
}
export const languages = [
  { id: "quh-BO", name: "Quechua", region: "Bolivia", status: "ready" },
  { id: "ay-BO", name: "Aymara", region: "Próximamente", status: "pending" },
] as const;
export const units = plan.units.map((u, i) => ({
  id: u.id,
  number: i + 1,
  title: u.nameEs,
  objective: u.learningObjective,
}));
export const modalities: {
  id: GameType;
  title: string;
  status: "enabled" | "pending";
  reason?: string;
}[] = plan.gameTypes.map((g) => ({
  id: g.id as GameType,
  title: g.name,
  status: ["count_objects", "dialogue_choice"].includes(g.id)
    ? "pending"
    : "enabled",
  reason:
    g.id === "dialogue_choice"
      ? "Falta un intercambio documentado y revisión contextual."
      : g.id === "count_objects"
        ? "Se habilita con fichas numéricas documentadas."
        : undefined,
}));
const first = ["wasi", "inti", "yaku"];
const ex = (
  id: string,
  e: Omit<Exercise, "id" | "wordIds"> & Record<string, unknown>,
  wordIds = first,
) => ({ id, wordIds, ...e }) as Exercise;
const pilotExercises: Exercise[] = [
  ex("l1-1", {
    type: "picture_choice",
    target: "wasi",
    options: ["inti", "wasi", "yaku"],
  }),
  ex("l1-2", {
    type: "picture_choice",
    target: "inti",
    options: ["yaku", "wasi", "inti"],
  }),
  ex("l1-3", {
    type: "picture_choice",
    target: "yaku",
    options: ["wasi", "yaku", "inti"],
  }),
  ex("l1-4", { type: "match_pairs", pairs: first }),
  ex("l1-5", { type: "build_word", target: "wasi" }, ["wasi"]),
  ex("l1-6", { type: "build_word", target: "yaku" }, ["yaku"]),
  ex("l1-7", { type: "scene_hunt", target: "inti", objects: first }),
  ex("l1-8", { type: "memory_pairs", pairs: first }),
];
export const lessons: Lesson[] = plan.units.flatMap((u, ui) =>
  u.levels.map(
    (l) =>
      ({
        id: l.id,
        number: l.number,
        unit: ui + 1,
        title: l.titleEs,
        description: u.learningObjective,
        wordIds: l.number === 1 ? first : [],
        exercises: l.number === 1 ? pilotExercises : [],
        prerequisite: l.prerequisiteLevelId,
        status: l.number === 1 ? "ready" : "pending",
        kind: l.kind,
        pendingReason:
          "Estamos preparando las fichas y revisando las actividades de este nivel.",
      }) as Lesson,
  ),
);
const rotate = (ids: string[], n = 1) => [
  ...ids.slice(n % ids.length),
  ...ids.slice(0, n % ids.length),
];
function practice(number: number, ids: string[], review = false): Exercise[] {
  const make = (
    type: Exercise["type"],
    data: Record<string, unknown>,
    wordIds = ids,
  ) =>
    ({
      id: `l${number}-${type}-${JSON.stringify(data)}`,
      type,
      wordIds,
      ...data,
    }) as Exercise;
  const group = ids.slice(0, 3);
  return [
    ...ids
      .slice(0, review ? 4 : 3)
      .map((target, i) =>
        make("picture_choice", {
          target,
          options: rotate(
            ids.slice(0, 3).includes(target)
              ? group
              : [group[0], target, group[2]],
            i,
          ),
        }),
      ),
    make("match_pairs", { pairs: group }),
    ...ids
      .slice(review ? 1 : 0, review ? 3 : 2)
      .map((target) => make("build_word", { target }, [target])),
    make("memory_pairs", { pairs: rotate(ids).slice(0, 3) }),
    make("build_word", { target: ids[ids.length - 1] }, [ids[ids.length - 1]]),
  ];
}
function publish(number: number, ids: string[], exercises: Exercise[]) {
  const l = lessons[number - 1];
  Object.assign(l, {
    wordIds: ids,
    exercises,
    status: "ready",
    pendingReason: undefined,
  });
}
publish(2, ["urqu", "mayu", "rumi"], practice(2, ["urqu", "mayu", "rumi"]));
publish(
  3,
  ["killa", "wayra", "sach'a"],
  practice(3, ["killa", "wayra", "sach'a"]),
);
const surroundings = [
  "wasi",
  "inti",
  "yaku",
  "urqu",
  "mayu",
  "rumi",
  "killa",
  "wayra",
  "sach'a",
];
publish(4, surroundings, [
  ...practice(4, surroundings, true),
  {
    id: "l4-scene",
    type: "scene_hunt",
    target: "yaku",
    objects: first,
    wordIds: first,
  },
  {
    id: "l4-sort",
    type: "sort_words",
    target: "wasi",
    categories: [
      { id: "construcciones", label: "Construcciones" },
      { id: "naturaleza", label: "Elementos naturales" },
    ],
    answer: "construcciones",
    wordIds: ["wasi"],
  },
]);
publish(
  5,
  ["allqu", "misi", "challwa"],
  practice(5, ["allqu", "misi", "challwa"]),
);
publish(
  6,
  ["t'ika", "raphi", "sach'a"],
  practice(6, ["t'ika", "raphi", "sach'a"]),
);
publish(
  7,
  ["p'isqu", "llama", "challwa"],
  practice(7, ["p'isqu", "llama", "challwa"]),
);
publish(
  8,
  ["allqu", "misi", "challwa", "p'isqu", "llama", "t'ika", "raphi", "sach'a"],
  practice(
    8,
    ["allqu", "misi", "challwa", "p'isqu", "llama", "t'ika", "raphi", "sach'a"],
    true,
  ),
);
publish(
  9,
  ["punku", "tiyana", "misa"],
  practice(9, ["punku", "tiyana", "misa"]),
);
publish(
  10,
  ["qiru", "wislla", "p'anqa"],
  practice(10, ["qiru", "wislla", "p'anqa"]),
);
publish(
  11,
  ["qillqana", "punku", "qiru"],
  practice(11, ["qillqana", "punku", "qiru"]),
);
publish(
  12,
  ["punku", "tiyana", "misa", "qiru", "wislla", "p'anqa", "qillqana"],
  practice(
    12,
    ["punku", "tiyana", "misa", "qiru", "wislla", "p'anqa", "qillqana"],
    true,
  ),
);
const numbers = [
  "juk",
  "iskay",
  "kimsa",
  "tawa",
  "phichqa",
  "suqta",
  "qanchis",
  "pusaq",
  "jisq'un",
  "chunka",
];
function counting(number: number, ids: string[], review = false): Exercise[] {
  return [
    ...ids.map((target, i) => ({
      id: `l${number}-count-${i}`,
      type: "count_objects" as const,
      target,
      count: lexicon[target].number!,
      object: "rumi",
      options: rotate(
        [target, ...ids.filter((x) => x !== target).slice(0, 2)],
        i % 3,
      ),
      wordIds: [target],
    })),
    {
      id: `l${number}-match`,
      type: "match_pairs",
      pairs: ids.slice(0, 3),
      wordIds: ids.slice(0, 3),
    },
    {
      id: `l${number}-build`,
      type: "build_word",
      target: ids[0],
      wordIds: [ids[0]],
    },
    {
      id: `l${number}-memory`,
      type: "memory_pairs",
      pairs: ids.slice(-3),
      wordIds: ids.slice(-3),
    },
  ];
}
publish(13, numbers.slice(0, 5), counting(13, numbers.slice(0, 5)));
publish(14, numbers.slice(5), counting(14, numbers.slice(5)));
publish(
  15,
  numbers,
  counting(15, ["iskay", "tawa", "suqta", "pusaq", "chunka"]),
);
publish(16, numbers, counting(16, numbers.slice(0, 7), true));
const countMode = modalities.find((m) => m.id === "count_objects")!;
countMode.status = "enabled";
countMode.reason = undefined;
for (const l of lessons.filter((l) => l.status === "pending"))
  l.pendingReason =
    l.unit === 5
      ? "Faltan ilustraciones contrastadas para colores y tamaños y revisar las descripciones en contexto."
      : l.number === 21
        ? "Falta revisar las relaciones de parentesco y sus ilustraciones en contexto."
        : "Falta una fuente para el intercambio completo y una revisión lingüística contextual. No se han generado diálogos.";
const contexts = [
  "Muni acaba de llegar al valle. Encuentra un hogar, mira el sol y sigue el agua.",
  "Busca la casa entre los elementos del valle. Reconoce la montaña, el río y la piedra que guían el camino.",
  "Descansa junto al agua. Mira el cielo, siente el viento y encuentra el árbol del sendero.",
  "Recorre el valle con lo que ya aprendiste. Reconoce sus lugares y elige por dónde seguir.",
  "Unas huellas aparecen en el camino. Descubre tres animales y recuerda el valle.",
  "El pequeño vecino se esconde entre las plantas. Reconoce la flor y la hoja para seguir explorando.",
  "Entre las hojas hay más vida. Encuentra animales conocidos y dos nuevos compañeros del bosque.",
  "Cruza el bosque recordando animales y plantas. Cada palabra te ayuda a encontrar la salida.",
  "Una puerta se abre en el pueblo. Descubre los objetos de este nuevo hogar.",
  "Prepara un rincón tranquilo. Reconoce los objetos que vas a necesitar.",
  "Deja la mesa lista y encuentra con qué escribir. Recupera las palabras de la visita.",
  "Completa la visita al pueblo: reconoce, recuerda y reúne lo aprendido en casa.",
  "El mercado está abierto. Cuenta conjuntos de una a cinco vasos para preparar tu canasta.",
  "Llegó un pedido más grande. Aprende a contar de seis a diez con los vasos del puesto.",
  "Ordena las cantidades de los puestos. Recupera los números y los objetos que ya conoces.",
  "Resuelve el encargo completo. Cuenta, recuerda y elige cada cantidad con cuidado.",
];
const categoryLabels:Record<string,string>={naturaleza:"Naturaleza",construcciones:"Construcciones",animales:"Animales",objetos:"Objetos",numeros:"Números"};
const seen=new Set<string>();
for(const l of lessons){
  l.title=environments[l.unit-1].titles[(l.number-1)%4];
  if(l.status!=="ready")continue;
  const group=l.wordIds, fresh=group.filter(id=>!seen.has(id));
  const reused=[...new Set([...group.filter(id=>seen.has(id)),...Array.from(seen).slice(-2)])];
  const prior=reused.length?reused:group;
  const make=(type:Exercise["type"],data:Record<string,unknown>,wordIds:string[],instruction:string):Exercise=>({id:`r2-l${l.number}-${++index}`,type,wordIds,instruction,...data} as Exercise);
  let index=0;
  const choice=(target:string,ids:string[],instruction:string)=>make("picture_choice",{target,options:rotate([...new Set([target,...ids])].slice(0,3),index%3)},[target],instruction);
  const scene=(target:string,ids:string[],instruction:string)=>make("scene_hunt",{target,objects:[...new Set([target,...ids])].slice(0,3)},[target],instruction);
  const build=(target:string)=>make("build_word",{target},[target],"Recuerda la palabra y constrúyela tocando sus partes.");
  const pairs=(ids:string[])=>make("match_pairs",{pairs:ids},ids,"Une cada palabra con su significado para seguir el camino.");
  const memory=(ids:string[])=>make("memory_pairs",{pairs:ids},ids,"Explora las cartas y encuentra las parejas. Puedes darles la vuelta sin perder vidas.");
  const sort=(target:string)=>{const answer=lexicon[target].category||"objetos",other=answer==="naturaleza"?"construcciones":answer==="animales"?"objetos":answer==="objetos"?"animales":"naturaleza";return make("sort_words",{target,answer,categories:[{id:answer,label:categoryLabels[answer]},{id:other,label:categoryLabels[other]}]},[target],"Elige el grupo al que pertenece esta palabra.");};
  if(l.unit===4){
    const ids=l.number<=14?group:[group[0],group[2],group[4],group[6],group[9]];
    const count=(target:string)=>make("count_objects",{target,count:lexicon[target].number,object:"cantidad-01",options:rotate([target,...numbers.filter(x=>x!==target).slice(0,2)],index%3)},[target],"Cuenta los objetos del pedido y elige la cantidad en quechua.");
    l.exercises=[...ids.map(count),pairs(ids.slice(0,3)),build(ids[0]),memory(ids.slice(-3)),choice("qiru",["qiru","wislla","p'anqa"],"Antes de seguir, recuerda un objeto de la visita al pueblo."),count(ids[ids.length-1])];
  }else if(l.number%4===0){
    l.exercises=[choice(group[3],group.slice(3,6),"Reconoce un elemento que encontraste en el camino."),choice(group[6],group.slice(-3),"Recupera una palabra de tu última parada."),pairs(group.slice(0,3)),memory(group.slice(3,6)),build(group[6]),scene(group[group.length-1],group.slice(-3),"Busca el elemento que completa esta parte del recorrido."),sort(group[0]),build(group[group.length-2]),choice(group[1],group.slice(0,3),"Una última mirada a lo que aprendiste al llegar."),scene(group[4],[group[0],group[4],group[group.length-1]],"Resuelve el final: encuentra la palabra y completa tu ruta.")];
  }else{
    const ids=group.slice(0,3), recall=prior[0];
    l.exercises=[...ids.map(target=>choice(target,ids,"Explora esta palabra y encuentra su significado.")),pairs([...new Set([ids[0],ids[1],recall,ids[2]])].slice(0,3)),build(ids[2]),memory(ids),scene(recall,[...ids,recall],"Vuelve a encontrar una palabra conocida en otro lugar."),sort(ids[1]),build(recall),scene(ids[2],[ids[1],recall,ids[0]],"Resuelve el final: encuentra el último elemento para seguir explorando.")];
  }
  l.wordIds=[...new Set(l.exercises.flatMap(e=>e.wordIds))];
  l.mission={context:contexts[l.number-1],objective:l.unit===4?"Relacionar las cantidades con sus nombres documentados.":l.number%4===0?"Recuperar las palabras de la unidad en juegos distintos.":"Reconocer palabras nuevas y recordar las de las paradas anteriores.",newWords:fresh,reusedWords:l.wordIds.filter(id=>seen.has(id)),resolution:l.exercises[l.exercises.length-1].instruction!};
  l.description=l.mission.context;
  group.forEach(id=>seen.add(id));
}
export const getLesson = (id: string) => lessons.find((l) => l.id === id);
export const makeReview = (ids: string[]): Exercise[] =>
  ids
    .filter((id) => lexicon[id])
    .slice(0, 12)
    .map((target, i) => ({
      id: `review-${i}-${target}`,
      type: "build_word",
      wordIds: [target],
      target,
    }));
