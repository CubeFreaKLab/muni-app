import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccessibilityInfo, AppState, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import type { Answer, Draft, Session, Exercise } from "../content/types";
import { canCheck, createSession, isCorrect, targetWords } from "../exercises/engine";
import { getLesson, lexicon } from "../content/course";
import { economy, Purchase } from "./config";
import { initial, localDate, migrate, operation, Progress, queueMistakes, regenerate } from "./model";
import { previewName, previewProfile } from "./preview";
export { localDate, Progress } from "./model";
export const STORAGE_KEY = "muni.progress.v1";
type API = {
  data: Progress; loaded: boolean; busy: boolean; saveError: string | null; loadError: boolean; reduceMotion: boolean; now: number;
  update: (f:(d:Progress)=>Progress)=>void; retrySave:()=>void; reset:()=>void;
  start:(id:string, exercises:Exercise[], kind?:Session["kind"])=>boolean;
  draft:(v:Draft, recovery?:boolean)=>void; hint:(recovery?:boolean)=>void;
  check:(recovery?:boolean)=>void; pair:(right:string, recovery?:boolean)=>void;
  next:(recovery?:boolean)=>void; finish:()=>boolean;
  addReview:(id:string)=>void; bookmark:(id:string)=>void;
  buy:(product:Purchase, id:string)=>string; eliminate:()=>string; startRecovery:()=>boolean;
};
const Context = createContext<API | null>(null);
const slot = (recovery?:boolean) => recovery ? "recovery" : "active";
export function ProgressProvider({children}:{children:React.ReactNode}) {
  const [data,setData] = useState(initial), ref = useRef(data);
  const [loaded,setLoaded] = useState(false), ready = useRef(false);
  const [busy,setBusy] = useState(false), locked = useRef(false);
  const [saveError,setSaveError] = useState<string|null>(null), failed = useRef(false);
  const [loadError,setLoadError] = useState(false), [systemMotion,setSystemMotion] = useState(false);
  const [now,setNow] = useState(Date.now());
  const writes = useRef(Promise.resolve());
  const storage = useRef(previewName?`muni.preview.r02.${previewName}`:STORAGE_KEY);
  function persist(d:Progress, critical=false, error=false) {
    const snapshot=JSON.stringify(d);
    if(critical){locked.current=true;setBusy(true);}
    writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(storage.current,snapshot)).then(()=>{
      failed.current=false;setSaveError(null);
      if(error&&d.vibration&&Platform.OS!=="web")void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>{});
    }).catch(()=>{failed.current=true;setSaveError("No se pudo guardar. Reintenta antes de continuar.");}).finally(()=>{if(critical){locked.current=false;setBusy(false);}});
  }
  function commit(fn:(d:Progress)=>Progress, critical=false, error?:()=>boolean):boolean {
    if(!ready.current||locked.current||failed.current)return false;
    const base=regenerate(ref.current),next=fn(base);
    if(next===base&&base===ref.current)return false;
    ref.current=next;setData(next);persist(next,critical,error?.()||false);return next!==base;
  }
  useEffect(()=>{
    let mounted=true;
    (async()=>{try{
      const raw=await AsyncStorage.getItem(storage.current);
      const payload=raw?JSON.parse(raw):previewName?previewProfile():initial();
      let next=migrate(payload);
      if(raw&&JSON.parse(raw).version===1){
        if(!await AsyncStorage.getItem(storage.current+".before-revision-02"))await AsyncStorage.setItem(storage.current+".before-revision-02",raw);
        await AsyncStorage.setItem(storage.current,JSON.stringify(next));
      }
      next=regenerate(next);
      if(!raw&&previewName)await AsyncStorage.setItem(storage.current,JSON.stringify(next));
      if(mounted){ref.current=next;setData(next);ready.current=true;setLoaded(true);}
    }catch{if(mounted){setLoadError(true);setSaveError("Tu progreso no se pudo leer. Conservamos los datos para poder recuperarlos.");setLoaded(true);}}})();
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemMotion);
    const motion=AccessibilityInfo.addEventListener("reduceMotionChanged",setSystemMotion);
    const refresh=()=>{setNow(Date.now());commit(d=>d);};
    const app=AppState.addEventListener("change",s=>{if(s==="active")refresh();});
    const timer=setInterval(refresh,1000);
    return()=>{mounted=false;motion.remove();app.remove();clearInterval(timer);};
  },[]);
  function draft(v:Draft,recovery=false){commit(d=>{const key=slot(recovery),s=d[key];if(!s||s.feedback||s.pendingPair||(!recovery&&d.lives===0))return d;return {...d,[key]:{...s,draft:{...s.draft,...v}}};});}
  function record(s:Session,e:Exercise,correct:boolean,errors:number):Session{
    if(s.answers.some(a=>a.exerciseId===e.id))return s;
    const answer:Answer={exerciseId:e.id,firstTry:correct&&!s.helped&&errors===0,helped:s.helped,wordIds:targetWords(e),outcome:correct?(s.helped?"assisted":"correct"):"incorrect",errors};
    return {...s,answers:[...s.answers,answer],feedback:correct?"correct":"incorrect",phase:"feedback",feedbackAt:Date.now()};
  }
  function check(recovery=false){
    let error=false;
    commit(d=>{const key=slot(recovery),s=d[key];if(!s||s.feedback||s.pendingPair||(!recovery&&d.lives===0))return d;
      const e=s.exercises[s.index];if(!e||!canCheck(e,s.draft)||e.type==="match_pairs"||s.answers.some(a=>a.exerciseId===e.id))return d;
      const correct=isCorrect(e,s.draft);error=!correct;
      if(!correct){if(!recovery)d=operation(d,`${s.id}:${e.id}:answer`,0,-1,"respuesta incorrecta");d=queueMistakes(d,targetWords(e));}
      return {...d,[key]:record(s,e,correct,correct?0:1)};
    },true,()=>error);
  }
  function pair(right:string,recovery=false){
    let error=false;
    commit(d=>{const key=slot(recovery),s=d[key];if(!s||s.feedback||s.pendingPair||(!recovery&&d.lives===0))return d;
      const e=s.exercises[s.index],left=s.draft.left;
      if(e?.type!=="match_pairs"||!left||!e.pairs.includes(left)||!e.pairs.includes(right)||s.pairResults?.[left])return d;
      const correct=left===right;error=!correct;
      const pairs={...s.pairResults,[left]:{chosen:right,correct}};
      if(!correct){if(!recovery)d=operation(d,`${s.id}:${e.id}:pair:${left}`,0,-1,"pareja incorrecta");d=queueMistakes(d,[left,right]);}
      let session:Session={...s,pairResults:pairs,pendingPair:left,draft:{...s.draft,left:undefined,matched:Object.keys(pairs)},feedback:correct?"correct":"incorrect",phase:"feedback",feedbackAt:Date.now()};
      if(Object.keys(pairs).length===e.pairs.length){const errors=Object.values(pairs).filter(x=>!x.correct).length;session={...record(session,e,errors===0,errors),feedback:correct?"correct":"incorrect"};}
      return {...d,[key]:session};
    },true,()=>error);
  }
  function next(recovery=false){commit(d=>{
    const key=slot(recovery),s=d[key];if(!s?.feedback||Date.now()-(s.feedbackAt||0)<500)return d;
    if(recovery){
      const correct=s.answers.filter(a=>a.outcome!=="incorrect").length;
      if(correct>=economy.recoveryCorrect){d=operation(d,`recovery:${s.id}`,0,1,"práctica gratuita");return {...d,recovery:null,finishedSessions:[...d.finishedSessions,s.id]};}
    }
    const e=s.exercises[s.index];
    if(s.pendingPair&&!s.answers.some(a=>a.exerciseId===e.id))return {...d,[key]:{...s,feedback:null,phase:"answering",pendingPair:null}};
    const exercises=[...s.exercises];
    if(s.index===exercises.length-1){if(!recovery)return d;exercises.push({...exercises[s.index%3],id:`recover-${s.index+1}`});}
    return {...d,[key]:{...s,exercises,index:s.index+1,draft:{},currentMistakes:[],helped:false,feedback:null,phase:"answering",excluded:[],pairResults:{},pendingPair:null,hintVisible:false}};
  },true);}
  function finish():boolean{return commit(d=>{
    const s=d.active;if(!s?.feedback||Date.now()-(s.feedbackAt||0)<500||s.index!==s.exercises.length-1||s.answers.length!==s.exercises.length||d.finishedSessions.includes(s.id))return d;
    const firstCorrect=s.answers.filter(a=>a.firstTry).length,errors=s.answers.reduce((n,a)=>n+(a.errors||0),0),helped=s.answers.filter(a=>a.helped).length;
    const lesson=getLesson(s.lessonId),valid=s.kind==="lesson"&&!!lesson,rewarded=valid&&!d.completed[s.lessonId];
    const seeds=rewarded?economy.mission+(!errors&&!helped?economy.perfect:0)+(lesson.number%4===0?economy.unitFinal:0):0;
    const completion={completedAt:new Date().toISOString(),firstCorrect,total:s.exercises.length,sessionId:s.id};
    const words=[...new Set(s.exercises.flatMap(targetWords))].filter(id=>lexicon[id]);
    const learned=[...new Set([...d.learned,...words])],review={...d.review};
    for(const id of words){const relevant=s.answers.filter(a=>a.wordIds.includes(id));if(relevant.length&&relevant.every(a=>a.firstTry))delete review[id];}
    const day=localDate();d=operation(d,`finish:${s.id}`,seeds,0,"finalización de misión");
    return {...d,active:null,learned,review,completed:rewarded?{...d.completed,[s.lessonId]:completion}:d.completed,
      finishedSessions:[...d.finishedSessions,s.id],
      practiceDays:{...d.practiceDays,[day]:[...new Set([...(d.practiceDays[day]||[]),valid?s.lessonId:`review:${s.id}`])]},
      missionDays:valid?{...d.missionDays,[day]:[...new Set([...(d.missionDays[day]||[]),s.lessonId])]}:d.missionDays,
      lastResult:{...completion,lessonId:s.lessonId,kind:s.kind,newWords:learned.length-d.learned.length,rewarded,helped,errors,seeds}};
  },true);}
  function start(id:string,exercises:Exercise[],kind:Session["kind"]="lesson"){return commit(d=>{
    if(d.active||d.lives===0||!exercises.length||exercises.some(e=>e.type==="dialogue_choice"&&!e.reviewed))return d;
    const lesson=getLesson(id);if(kind==="lesson"&&(!lesson||lesson.status!=="ready"||(lesson.prerequisite&&!d.completed[lesson.prerequisite]&&!d.completed[id])))return d;
    return {...d,active:{...createSession(id,exercises,kind),phase:"answering"}};
  },true);}
  function startRecovery(){
    if(ref.current.recovery)return true;
    return commit(d=>{if(d.lives===economy.maxLives)return d;
      const words=[...new Set([...Object.keys(d.review),...d.learned,"wasi","inti","yaku"])].filter(id=>lexicon[id]&&lexicon[id].category!=="numeros").slice(0,3);
      const exercises:Exercise[]=words.map((target,i)=>({id:`recover-${i}`,type:"picture_choice",target,options:[...words.slice(i),...words.slice(0,i)],wordIds:[target]}));
      return {...d,recovery:{...createSession("recovery",exercises,"recovery"),phase:"answering"}};
    },true);
  }
  function buy(product:Purchase,id:string):string{
    let message="No se pudo guardar. Inténtalo de nuevo.";
    commit(d=>{
      if(d.operations[id]){message="Ya se añadió a tu mochila.";return d;}
      if(d.lives>=economy.maxLives){message="Tus vidas ya están completas.";return d;}
      const cost=product==="life"?economy.life:economy.refill;
      if(d.seeds<cost){message=`Necesitas ${cost-d.seeds} semillas más.`;return d;}
      message=product==="life"?"Recuperaste una vida.":"Tus cinco vidas están listas.";
      return operation(d,id,-cost,product==="life"?1:economy.maxLives-d.lives,product);
    },true);return message;
  }
  function eliminate():string{
    let message="Esta actividad no tiene una opción para eliminar.";
    commit(d=>{const s=d.active;if(!s||s.feedback||s.excluded?.length)return d;
      const e=s.exercises[s.index],choices=e.type==="picture_choice"||e.type==="count_objects"?e.options:e.type==="scene_hunt"?e.objects:[];
      if(choices.length<3||!("target" in e))return d;
      const word=lexicon[e.target],valid=new Set([e.target,...(word?.variants.map(v=>v.form)||[])]),wrong=choices.find(id=>!valid.has(id));if(!wrong)return d;
      if(d.seeds<economy.eliminate){message=`Necesitas ${economy.eliminate-d.seeds} semillas más.`;return d;}
      d=operation(d,`${s.id}:${e.id}:eliminate`,-economy.eliminate,0,"eliminar opción");message="Una opción menos.";
      return {...d,active:{...s,helped:true,excluded:[wrong],draft:{...s.draft,selected:s.draft.selected===wrong?undefined:s.draft.selected}}};
    },true);return message;
  }
  const api:API={data,loaded,busy,saveError,loadError,now,reduceMotion:data.reduceMotion||systemMotion,
    update:f=>{commit(f);},retrySave:()=>persist(ref.current,true),
    reset:()=>{ready.current=true;failed.current=false;setLoadError(false);const d=initial();ref.current=d;setData(d);setLoaded(true);persist(d,true);},
    start,draft,check,pair,finish,next,startRecovery,buy,eliminate,
    hint:r=>{commit(d=>{const key=slot(r),s=d[key];if(!s||s.feedback)return d;return {...d,[key]:{...s,helped:true,hintVisible:true}};},true);},
    addReview:id=>{commit(d=>lexicon[id]&&!d.review[id]?{...d,review:{...d.review,[id]:{mistakes:0,addedAt:new Date().toISOString()}}}:d);},
    bookmark:id=>{commit(d=>({...d,bookmarks:d.bookmarks.includes(id)?d.bookmarks.filter(x=>x!==id):[...d.bookmarks,id]}));},
  };
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useProgress=()=>{const value=useContext(Context);if(!value)throw new Error("ProgressProvider missing");return value;};
