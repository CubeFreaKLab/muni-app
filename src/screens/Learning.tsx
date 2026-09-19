import React, { useEffect, useState } from "react";
import { AppState, BackHandler, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStack } from "../navigation/types";
import { getLesson, lexicon } from "../content/course";
import { C } from "../design/theme";
import { useProgress } from "../state/Progress";
import { streak } from "../state/model";
import { economy } from "../state/config";
import { canCheck, answerText } from "../exercises/engine";
import { Activity } from "../exercises/Activity";
import { ArcTitle, AudioSoon, Button, Character, Entrance, Header, Icon, IconButton, Page, ProgressBar, Sheet, T, Tap, styles as ui } from "../ui/kit";
import { AnimatedIllustration } from "../ui/AnimatedIllustration";
import { MissionCelebration } from "../ui/MissionCelebration";
import { offerMissionCelebration } from "../design/celebrations";
import { Illustration } from "../ui/Illustration";
import { Sources } from "../ui/Sources";
import { RecoverySheet } from "./Economy";
type Props<S extends keyof RootStack>=NativeStackScreenProps<RootStack,S>;
export function IntroScreen({navigation,route}:Props<"Intro">){
  const p=useProgress(),l=getLesson(route.params.lessonId),[conflict,setConflict]=useState(false),[lives,setLives]=useState(false);
  if(!l)return <Page><T>Misión no disponible.</T></Page>;
  const locked=l.status!=="ready"||!!(l.prerequisite&&!p.data.completed[l.prerequisite]&&!p.data.completed[l.id]);
  function enter(){if(p.data.active){if(p.data.active.lessonId===l!.id)navigation.navigate("Lesson",{recovery:false});else setConflict(true);return;}if(!p.data.lives){setLives(true);return;}if(p.start(l!.id,l!.exercises))navigation.replace("Lesson",{recovery:false});}
  return <Page header={<Header back={()=>navigation.goBack()}/>} footer={<Button disabled={locked||p.busy} text={locked?"Próximamente":p.data.active?.lessonId===l.id?"Reanudar misión":"Vamos a explorar"} onPress={enter}/>}>
    <T size={13} color={C.forest} style={{textAlign:"center",marginTop:8}}>Misión {l.number}</T><ArcTitle text={l.title} size={31}/><T style={{textAlign:"center",marginTop:12}}>{l.mission?.context||"Estamos preparando esta parte del camino."}</T>
    <View style={{alignItems:"center",paddingVertical:24}}><Illustration id={`mission-${l.number}`} width={260} height={172}/></View>
    <View style={{flexDirection:"row",justifyContent:"space-around",paddingBottom:22,borderBottomWidth:1,borderColor:C.cream}}>{[{icon:"compass",name:"Explora"},{icon:"rotate-ccw",name:"Recuerda"},{icon:"check-circle",name:"Resuelve"}].map(x=><View key={x.name} style={{alignItems:"center",gap:9}}><Illustration id={x.name==="Explora"?"brujula":x.name==="Recuerda"?"review-book":"trofeo"} size={30}/><T size={14}>{x.name}</T></View>)}</View>
    {!!l.mission?.newWords.length&&<View style={{gap:7,marginTop:20}}><T size={15}>Hoy descubrirás</T><T size={14} color={C.forest}>{l.mission.newWords.map(id=>`${lexicon[id].form} · ${lexicon[id].meaningEs}`).join("\n")}</T></View>}
    {!!l.mission?.reusedWords.length&&<View style={{gap:7,marginTop:18}}><T size={15}>Volverás a encontrar</T><T size={14}>{l.mission.reusedWords.map(id=>lexicon[id].form).join(" · ")}</T></View>}
    <Sources ids={l.wordIds}/>
    <Sheet visible={conflict} title="Tu misión te espera" onClose={()=>setConflict(false)}><T>Guardaste una misión a mitad de camino. Retómala desde tu última respuesta.</T><Button text="Reanudar misión guardada" onPress={()=>{setConflict(false);navigation.replace("Lesson",{recovery:false});}}/></Sheet>
    <RecoverySheet visible={lives} onClose={()=>setLives(false)}/>
  </Page>;
}
const gameTitles={picture_choice:"Encuentra su significado",match_pairs:"Une las parejas",memory_pairs:"Recuerda las parejas",build_word:"Construye la palabra",scene_hunt:"Explora la escena",sort_words:"Cada palabra en su lugar",count_objects:"Prepara el pedido",dialogue_choice:"Completa el intercambio"};
export function LessonScreen({navigation,route}:Props<"Lesson">){
  const p=useProgress(),recovery=!!route.params?.recovery,s=recovery?p.data.recovery:p.data.active;
  const [paused,setPaused]=useState(false),[lives,setLives]=useState(false),[help,setHelp]=useState(false),[helpMessage,setHelpMessage]=useState("");
  useEffect(()=>{const back=BackHandler.addEventListener("hardwareBackPress",()=>{setPaused(true);return true;});const app=AppState.addEventListener("change",state=>{if(state!=="active")setPaused(true);});return()=>{back.remove();app.remove();};},[]);
  useEffect(()=>{if(!recovery&&s&&!s.feedback&&p.data.lives===0)setLives(true);},[s?.id,s?.index,s?.feedback,p.data.lives,recovery]);
  const home=()=>navigation.navigate("Main",{screen:"Camino"});
  if(!s)return <Page header={<Header/>} footer={<Button text={recovery&&p.data.active?"Retomar mi misión":"Volver al camino"} disabled={p.busy} onPress={()=>recovery&&p.data.active?navigation.setParams({recovery:false}):home()}/>}><View style={{flex:1,justifyContent:"center",alignItems:"center",gap:20}}>{recovery?<><Illustration id="corazon" size={64}/><ArcTitle text="Una vida más"/><T style={{textAlign:"center"}}>Tu práctica dio fruto. Puedes seguir aprendiendo.</T><T size={23}>{p.data.lives}/5 vidas</T></>:<T>Tu camino te espera.</T>}</View></Page>;
  const e=s.exercises[s.index],completeAnswer=s.answers.some(a=>a.exerciseId===e.id),last=s.index===s.exercises.length-1;
  const feedback=s.feedback,blocked=p.busy||!!p.saveError||!!feedback||(!recovery&&p.data.lives===0);
  const canEliminate=!recovery&&!feedback&&!s.excluded?.length&&((e.type==="picture_choice"||e.type==="count_objects")?e.options.length>=3:e.type==="scene_hunt"?e.objects.length>=3:false);
  const correctCount=s.answers.filter(a=>a.outcome!=="incorrect").length;
  const correction=s.pendingPair?`${lexicon[s.pendingPair].form} · ${lexicon[s.pendingPair].meaningEs}`:answerText(e,s.draft);
  function advance(){if(!feedback||!s)return;if(recovery){p.next(true);return;}if(last&&completeAnswer){if(p.finish()){if(s.kind==="lesson")offerMissionCelebration(s.id);navigation.replace("Results");}}else p.next();}
  return <Page scroll={false} padded={false} header={<View style={{height:65,...ui.row}}><IconButton name="x" label="Pausar misión" onPress={()=>setPaused(true)}/><View style={{flex:1,gap:5}}><ProgressBar value={recovery?correctCount/3:(s.index+(completeAnswer?1:0))/s.exercises.length} label={recovery?"Práctica gratuita":"Progreso de misión"}/><T size={11}>{recovery?`${correctCount}/3 aciertos`:`${s.index+1}/${s.exercises.length}`}</T></View><Tap label={`Vidas: ${p.data.lives} de 5`} onPress={()=>setLives(true)} style={{paddingHorizontal:6}}><View style={ui.row}><Illustration id="corazon" size={24}/><T size={15}>{p.data.lives}/5</T></View></Tap></View>} footer={<>
    <View accessibilityLiveRegion="polite" style={{minHeight:87,justifyContent:"center",gap:5}}>{feedback?<><View style={ui.row}><Icon name={feedback==="correct"?"check-circle":"info"} color={feedback==="correct"?C.forest:C.terracotta} size={23}/><T size={19} color={feedback==="correct"?C.forest:C.terracotta}>{feedback==="correct"?"¡Bien hecho!":"Sigamos aprendiendo"}</T></View><T size={14}>{correction}</T></>:s.hintVisible?<T size={15}>{answerText(e,s.draft)}</T>:<T size={13}>{e.type==="match_pairs"?"Toca una palabra y después su significado.":e.type==="memory_pairs"?"Encuentra todas las parejas para continuar.":"Puedes cambiar tu selección antes de comprobar."}</T>}</View>
    <Button text={feedback?(last&&completeAnswer&&!recovery?"Ver resultado":"Continuar"):"Comprobar"} disabled={p.busy||!!p.saveError||(!feedback&&(!canCheck(e,s.draft)||e.type==="match_pairs"||(!recovery&&p.data.lives===0)))} onPress={()=>feedback?advance():p.check(recovery)}/>
  </>}>
    <ScrollView key={`${s.id}-${s.index}`} bounces={false} alwaysBounceVertical={false} overScrollMode="never" contentContainerStyle={{paddingHorizontal:24,paddingBottom:20,gap:18}} showsVerticalScrollIndicator={false}>
      <T title size={26} style={{textAlign:"center",marginTop:16}}>{gameTitles[e.type]}</T><T size={14} style={{textAlign:"center"}}>{e.instruction||"Observa y responde a tu ritmo."}</T>
      <Activity e={e} s={s} setDraft={d=>p.draft(d,recovery)} confirmPair={id=>p.pair(id,recovery)} disabled={blocked}/>
      <View style={{alignItems:"center",gap:2}}><AudioSoon/>{canEliminate&&<Tap disabled={p.busy} onPress={()=>{setHelp(true);setHelpMessage("");}}><T size={13} color={C.forest}>Eliminar una opción · {economy.eliminate} semillas</T></Tap>}{e.type==="build_word"&&!feedback&&!s.hintVisible&&<Tap disabled={p.busy} onPress={()=>p.hint(recovery)}><T size={13} color={C.forest}>Ver una pista</T></Tap>}</View>
    </ScrollView>
    <Sheet visible={paused} title="Tu camino puede esperar" onClose={()=>setPaused(false)}><View style={{alignItems:"center"}}><AnimatedIllustration id="pause-book" width={150} height={95} playing={paused&&!lives&&!help}/></View><T>Tu avance está guardado. Retoma desde aquí cuando quieras.</T><Button text="Seguir aprendiendo" onPress={()=>setPaused(false)}/><Button secondary text="Salir y guardar" disabled={p.busy} onPress={()=>{setPaused(false);home();}}/></Sheet>
    <RecoverySheet visible={lives} onClose={()=>setLives(false)} onLeave={()=>{setLives(false);home();}}/>
    <Sheet visible={help} title="Una pequeña ayuda" onClose={()=>setHelp(false)}><View style={{alignItems:"center"}}><Illustration id="bombilla" height={72}/></View><T>Eliminar una opción incorrecta cuesta {economy.eliminate} semillas. Tienes {p.data.seeds}.</T><T size={13}>Esta respuesta contará como resuelta con ayuda.</T>{!!helpMessage&&<T color={C.terracotta}>{helpMessage}</T>}<Button text="Usar 15 semillas" disabled={p.busy} onPress={()=>{const result=p.eliminate();if(result==="Una opción menos.")setHelp(false);else setHelpMessage(result);}}/></Sheet>
  </Page>;
}
export function ResultsScreen({navigation}:Props<"Results">){
  const p=useProgress(),r=p.data.lastResult;
  if(!r)return <Page footer={<Button text="Volver al camino" onPress={()=>navigation.navigate("Main",{screen:"Camino"})}/>}><T>Tu progreso está guardado.</T></Page>;
  return <View style={{flex:1}}><Page header={<Header/>} footer={<Button disabled={p.busy||!!p.saveError} text="Seguir mi camino" onPress={()=>navigation.navigate("Main",{screen:"Camino"})}/>}><Entrance><ArcTitle text={r.kind==="review"?"Palabras que vuelven":"¡Misión cumplida!"} size={32}/><T size={15} style={{textAlign:"center",marginTop:12}}>Cada paso cuenta. Hoy aprendiste un poco más.</T><View style={{alignItems:"center",paddingVertical:24}}><Character height={230} state="success"/></View><View style={{flexDirection:"row",justifyContent:"space-around",paddingVertical:20,borderTopWidth:1,borderBottomWidth:1,borderColor:C.cream}}>{[{value:`${r.firstCorrect}/${r.total}`,label:"a la primera",icon:"check-circle"},{value:`+${r.seeds}`,label:"semillas",icon:"feather"},{value:String(streak(p.data)),label:streak(p.data)===1?"día de racha":"días de racha",icon:"sun"}].map(x=><View key={x.label} style={{alignItems:"center",gap:7}}><Illustration id={x.icon==="feather"?"moneda-semilla":x.icon==="sun"?"racha":"trofeo"} size={28}/><T size={25} color={C.forest}>{x.value}</T><T size={12}>{x.label}</T></View>)}</View><T size={14} style={{textAlign:"center",marginTop:22}}>{r.newWords?`${r.newWords} palabras nuevas en tu colección.`:"Volviste a cuidar las palabras que conoces."}</T>{(r.errors>0||r.helped>0)&&<T size={13} style={{textAlign:"center",marginTop:10}}>{r.errors} {r.errors===1?"error":"errores"} · {r.helped} {r.helped===1?"respuesta con ayuda":"respuestas con ayuda"}</T>}<Tap onPress={()=>navigation.navigate("Streak")}><T style={ui.link} size={14}>Ver mi constancia</T></Tap></Entrance></Page><MissionCelebration/></View>;
}
