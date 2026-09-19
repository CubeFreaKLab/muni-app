import { Platform } from "react-native";
import { lessons, lexicon } from "../content/course";
import { createSession, targetWords } from "../exercises/engine";
import { initial, localDate, Progress } from "./model";
// Explicit, web-only development profiles. Never selected in Expo Go or native builds.
const allowed=["entry","economy","last-error","zero","pairs","memory","build","scene","sort","count","migration","unit-final","regeneration"];
allowed.push(...allowed.map(name=>`art-${name}`));
allowed.push(...allowed.filter(name=>!name.startsWith("art-")).map(name=>`docs-${name}`));
const requested=__DEV__&&Platform.OS==="web"?new URLSearchParams(window.location.search).get("preview"):null;
export const previewName=requested&&allowed.includes(requested)?requested:null;
const scenario=previewName?.replace(/^(art-|docs-)/,"");
export const previewLesson=!!scenario&&!["entry","economy","regeneration"].includes(scenario);
export function previewProfile():Progress{
  const d=initial();if(previewName?.startsWith("docs-"))d.reduceMotion=true;if(!scenario||scenario==="entry")return d;
  d.onboarded=true;d.name="Muni Demo";d.seeds=120;d.learned=Object.keys(lexicon);d.bookmarks=["yaku","wasi"];
  for(const lesson of lessons.slice(0,16))d.completed[lesson.id]={completedAt:new Date().toISOString(),firstCorrect:10,total:10,sessionId:`demo-completed-${lesson.id}`};
  for(let i=0;i<3;i++){const date=new Date();date.setDate(date.getDate()-i);d.missionDays[localDate(date)]=[lessons[i].id];d.practiceDays[localDate(date)]=[lessons[i].id];}
  d.review={yaku:{mistakes:1,addedAt:new Date().toISOString()},"sach'a":{mistakes:1,addedAt:new Date().toISOString()}};
  if(scenario==="economy")d.lives=3;
  if(previewLesson){
    const mode=({pairs:"match_pairs",memory:"memory_pairs",build:"build_word",scene:"scene_hunt",sort:"sort_words",count:"count_objects"} as Record<string,string>)[scenario];
    const lesson=scenario==="unit-final"?lessons[3]:mode?lessons.find(l=>l.exercises.some(e=>e.type===mode))!:lessons[0];
    const s=createSession(lesson.id,lesson.exercises);
    s.index=mode?lesson.exercises.findIndex(e=>e.type===mode):["last-error","unit-final"].includes(scenario)?9:8;
    s.answers=s.exercises.slice(0,s.index).map(e=>({exerciseId:e.id,firstTry:true,helped:false,wordIds:targetWords(e),outcome:"correct",errors:0}));
    d.active=s;
    if(!mode){d.lives=scenario==="unit-final"?5:1;delete d.completed[lesson.id];}
    if(scenario==="unit-final")d.seeds=0;
  }
  if(scenario==="regeneration"){d.lives=3;d.regenerateAt=Date.now()+15000;return d;}
  if(scenario==="migration"){
    const legacy=initial();legacy.onboarded=true;legacy.name="Invitado V1 Demo";
    legacy.completed[lessons[0].id]={completedAt:new Date().toISOString(),firstCorrect:5,total:8,sessionId:"legacy-completion"};
    legacy.learned=["wasi","inti","yaku"];legacy.bookmarks=["yaku"];legacy.practiceDays[localDate()]=[lessons[0].id,"review:legacy-short"];
    legacy.active=createSession(lessons[1].id,[{id:"legacy-l2-1",type:"picture_choice",target:"urqu",options:["urqu","mayu","rumi"],wordIds:["urqu"]}]);
    legacy.active.feedback="incorrect";legacy.active.draft={selected:"mayu"};legacy.active.currentMistakes=["urqu"];legacy.active.helped=true;
    const {lives,seeds,regenerateAt,operations,missionDays,vibration,recovery,...old}=legacy;
    return {...old,version:1} as unknown as Progress;
  }
  if(d.lives<5)d.regenerateAt=Date.now()+30*60*1000;
  return d;
}
