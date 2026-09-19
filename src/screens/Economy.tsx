import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStack } from "../navigation/types";
import { C } from "../design/theme";
import { useProgress } from "../state/Progress";
import { localDate, streak } from "../state/model";
import { economy, Purchase } from "../state/config";
import { ArcTitle, Button, Character, Header, Icon, Page, Sheet, T, Tap, styles as ui } from "../ui/kit";
import { Illustration } from "../ui/Illustration";
type Props<S extends keyof RootStack>=NativeStackScreenProps<RootStack,S>;
const operationId=()=>`shop:${Date.now()}:${Math.random().toString(36).slice(2)}`;
export function RecoverySheet({visible,onClose,onLeave}:{visible:boolean;onClose:()=>void;onLeave?:()=>void}) {
  const p=useProgress(),nav=useNavigation<NativeStackNavigationProp<RootStack>>();
  const [message,setMessage]=useState(""),[purchase,setPurchase]=useState<string|null>(null);
  useEffect(()=>{if(visible){setMessage("");setPurchase(null);}},[visible]);
  const seconds=Math.max(0,Math.ceil(((p.data.regenerateAt||p.now)-p.now)/1000));
  const time=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  return <Sheet visible={visible} title={p.data.lives===0?"Un pequeño descanso":"Tus vidas"} onClose={onClose}>
    <View style={{alignItems:"center",gap:10}}>{p.data.lives===0?<Character state="error" height={125}/>:<Illustration id="corazon" size={64}/>}<View style={ui.row}>{p.data.lives===0&&<Illustration id="corazon-descanso" size={28}/>}<T size={23}>{p.data.lives} de {economy.maxLives}</T></View></View>
    <T style={{textAlign:"center"}}>{p.data.lives===5?"Todo listo para seguir tu camino.":`La próxima vida llega en ${time}. Tu misión se queda guardada.`}</T>
    {p.data.lives<5&&<><Button disabled={p.busy} text={p.data.recovery?"Continuar práctica gratuita":"Practicar para recuperar una vida"} onPress={()=>{if(p.startRecovery()){onClose();nav.navigate("Lesson",{recovery:true});}}}/><T size={13} style={{textAlign:"center"}}>Tres respuestas correctas. Los errores no cuestan vidas.</T><Button secondary disabled={p.busy||!!purchase} text={`Llenar vidas · ${economy.refill} semillas`} onPress={()=>{const id=operationId();const result=p.buy("refill",id);setMessage(result);if(p.data.seeds>=economy.refill)setPurchase(id);}}/></>}
    {!!message&&<T accessibilityLiveRegion="polite" size={14}>{message}</T>}
    {p.data.lives>0&&<Button text="Seguir aprendiendo" onPress={onClose}/>}
    {onLeave&&<Tap label="Volver al camino" onPress={onLeave}><T style={ui.link}>Volver al camino</T></Tap>}
  </Sheet>;
}
export function BackpackScreen({navigation}:Props<"Backpack">) {
  const p=useProgress(),[chosen,setChosen]=useState<{type:Purchase;id:string}|null>(null),[message,setMessage]=useState(""),[done,setDone]=useState(false),[lives,setLives]=useState(false);
  return <Page header={<Header back={()=>navigation.goBack()}/>}>
    <ArcTitle text="Tu mochila"/><View style={{alignItems:"center",gap:12,marginVertical:24}}><Illustration id="backpack" width={150} height={148}/><T size={26} color={C.forest}>{p.data.seeds} semillas</T><T size={14}>Pequeñas ayudas para seguir creciendo.</T></View>
    {([{type:"life",title:"Recuperar una vida",cost:economy.life,detail:`Tienes ${p.data.lives} de 5 vidas`},{type:"refill",title:"Llenar tus vidas",cost:economy.refill,detail:"Vuelve a tener cinco vidas"}] as const).map(item=><Tap key={item.type} disabled={p.data.lives===5} onPress={()=>{setChosen({type:item.type,id:operationId()});setMessage("");setDone(false);}} style={{paddingVertical:22,borderBottomWidth:1,borderColor:C.cream}}><View style={ui.row}><Illustration id="corazon" size={28}/><View style={{flex:1,gap:5}}><T>{item.title}</T><T size={13}>{p.data.lives===5?"Vidas completas":item.detail}</T></View><T color={C.forest}>{item.cost}</T><Illustration id="moneda-semilla" size={22}/></View></Tap>)}
    <View style={{paddingVertical:22,borderBottomWidth:1,borderColor:C.cream,gap:5}}><T>Eliminar una opción · {economy.eliminate} semillas</T><T size={13}>Disponible dentro de los ejercicios de elección.</T></View>
    <View style={{paddingVertical:22,...ui.row}}><Illustration id="valley-bag" size={54}/><View style={{flex:1,gap:5}}><T>Bolsa del valle</T><T size={13}>Próximamente</T></View></View>
    <Tap onPress={()=>setLives(true)}><T style={ui.link}>Recuperar vidas practicando</T></Tap>
    <Sheet visible={!!chosen} title={done?"Ya está en tu mochila":chosen?.type==="life"?"Una vida más":"A seguir aprendiendo"} onClose={()=>setChosen(null)}>
      <T>{done?message:`Usar ${chosen?.type==="life"?economy.life:economy.refill} semillas para ${chosen?.type==="life"?"recuperar una vida":"llenar tus vidas"}.`}</T>
      {!done&&!!message&&<T color={C.terracotta}>{message}</T>}
      <Button disabled={p.busy} text={done?"Listo":"Confirmar"} onPress={()=>{if(done){setChosen(null);return;}if(chosen){const cost=chosen.type==="life"?economy.life:economy.refill;setMessage(p.buy(chosen.type,chosen.id));setDone(p.data.seeds>=cost&&p.data.lives<5);}}}/>
    </Sheet>
    <RecoverySheet visible={lives} onClose={()=>setLives(false)}/>
  </Page>;
}
export function StreakScreen({navigation}:Props<"Streak">) {
  const {data}=useProgress(),[offset,setOffset]=useState(0),today=new Date(),month=new Date(today.getFullYear(),today.getMonth()+offset,1,12);
  const start=(month.getDay()+6)%7,total=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  return <Page header={<Header back={()=>navigation.goBack()}/>}>
    <ArcTitle text="Tu constancia crece" size={30}/><View style={{alignItems:"center",gap:8,marginVertical:24}}><Illustration id="racha" width={75} height={84}/><T title size={47} color={C.forest}>{streak(data)}</T><T>{streak(data)===1?"día de racha":"días de racha"}</T><T size={14} style={{textAlign:"center",marginTop:8}}>Completa una misión al día para cuidar tu racha.</T></View>
    <View style={{...ui.row,justifyContent:"space-between",marginBottom:12}}><Tap label="Mes anterior" onPress={()=>setOffset(offset-1)} style={{width:44,alignItems:"center"}}><Icon name="chevron-left"/></Tap><T size={18}>{month.toLocaleDateString("es-BO",{month:"long",year:"numeric"})}</T><Tap disabled={offset===0} label="Mes siguiente" onPress={()=>setOffset(offset+1)} style={{width:44,alignItems:"center"}}><Icon name="chevron-right"/></Tap></View>
    <View style={{flexDirection:"row",flexWrap:"wrap"}}>{["L","M","M","J","V","S","D"].map((day,i)=><View key={`day-${i}`} style={{width:"14.2857%",height:40,alignItems:"center"}}><T size={14}>{day}</T></View>)}{Array.from({length:start+total},(_,i)=>{const n=i-start+1,date=localDate(new Date(month.getFullYear(),month.getMonth(),n,12)),active=!!data.missionDays[date]?.length;return <View key={i} accessible={n>0} accessibilityLabel={n>0?`${n}, ${active?"misión completada":"sin misión completada"}`:undefined} style={{width:"14.2857%",height:47,alignItems:"center",justifyContent:"center"}}>{n>0&&<View style={{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:active?C.forest:"transparent",borderWidth:date===localDate()?1:0,borderColor:C.forest}}><T size={15} color={active?C.cream:C.cocoa}>{n}</T></View>}</View>;})}</View>
    <T size={13} style={{marginTop:24,textAlign:"center"}}>{Object.keys(data.missionDays).length} días con misiones completadas</T>
  </Page>;
}
