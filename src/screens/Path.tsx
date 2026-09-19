import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStack } from "../navigation/types";
import { lessons } from "../content/course";
import { Lesson } from "../content/types";
import { environments, nodePositions, vignettePositions, SEGMENT_HEIGHT, TRAIL_WIDTH, WORLD_WIDTH } from "../content/world";
import { C } from "../design/theme";
import { useProgress } from "../state/Progress";
import { ArcTitle, Button, Header, Icon, Page, Sheet, T, Tap } from "../ui/kit";
import { AnimatedIllustration } from "../ui/AnimatedIllustration";
import { StatusHeader } from "../ui/StatusHeader";
import { RecoverySheet } from "./Economy";
const height=SEGMENT_HEIGHT*6+210;
// A single path shares one centerline and one fill across all five joins.
const trail="M195 0 "+environments.map((_,i)=>{const y=i*SEGMENT_HEIGHT;return `C195 ${y+90} 135 ${y+130} 150 ${y+200} C150 ${y+290} 240 ${y+315} 233 ${y+395} C220 ${y+485} 295 ${y+520} 248 ${y+610} C225 ${y+690} 118 ${y+730} 163 ${y+825} C190 ${y+885} 195 ${y+900} 195 ${y+960}`;}).join(" ")+` L195 ${height}`;
export function PathScreen(){
  const nav=useNavigation<NativeStackNavigationProp<RootStack>>(),route=useRoute<any>(),p=useProgress();
  const [width,setWidth]=useState(390),[visibleUnit,setVisibleUnit]=useState(0),[selected,setSelected]=useState<Lesson|null>(null),[lives,setLives]=useState(false);
  const scroll=useRef<ScrollView>(null),scale=width/WORLD_WIDTH;
  const [visibleArt,setVisibleArt]=useState<string[]>([]);
  const viewport=useRef({y:0,height:0,width:390});
  function updateVisibleArt(){
    const {y,height:windowHeight,width:windowWidth}=viewport.current, ratio=windowWidth/WORLD_WIDTH;
    const ids=environments.flatMap((world,u)=>world.assets.flatMap((asset,j)=>{
      const art=vignettePositions[j],top=(u*SEGMENT_HEIGHT+nodePositions[j].y+art.offsetY)*ratio;
      return top+art.height*ratio>y-80 && top<y+windowHeight+80 ? [`world-${u+1}-${asset}`] : [];
    }));
    setVisibleArt(previous=>previous.join("|")===ids.join("|")?previous:ids);
  }
  const next=lessons.find(l=>l.status==="ready"&&!p.data.completed[l.id]);
  useEffect(()=>{if(route.params?.unit)scroll.current?.scrollTo({y:(route.params.unit-1)*SEGMENT_HEIGHT*scale,animated:!p.reduceMotion});},[route.params?.unit]);
  const status=(l:Lesson)=>l.status!=="ready"?"pending":p.data.completed[l.id]?"completed":!l.prerequisite||p.data.completed[l.prerequisite]?"available":"locked";
  const s=selected?status(selected):null;
  return <Page padded={false} scroll={false} header={<StatusHeader onLives={()=>setLives(true)}/> }>
    <View style={{height:29,justifyContent:"center",paddingHorizontal:24}}><T size={12} color={C.forest}>{environments[visibleUnit].name}</T></View>
    <ScrollView ref={scroll} bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false} scrollEventThrottle={80} onLayout={e=>{const layout=e.nativeEvent.layout;setWidth(layout.width);viewport.current={...viewport.current,width:layout.width,height:layout.height};updateVisibleArt();}} onScroll={e=>{viewport.current.y=e.nativeEvent.contentOffset.y;setVisibleUnit(Math.max(0,Math.min(5,Math.floor(e.nativeEvent.contentOffset.y/(SEGMENT_HEIGHT*scale)))));updateVisibleArt();}}>
      <View style={{height:height*scale,width:"100%"}}>
        <Svg pointerEvents="none" width={width} height={height*scale} viewBox={`0 0 390 ${height}`} style={{position:"absolute"}}><Path d={trail} stroke={C.cream} strokeWidth={TRAIL_WIDTH} fill="none"/></Svg>
        <View style={{position:"absolute",top:8,left:0,right:0}}><ArcTitle text="Tu aventura" size={29}/></View>
        {environments.flatMap((world,u)=>world.assets.map((asset,j)=>{const art=vignettePositions[j];return <View key={`${u}-${asset}`} style={{position:"absolute",top:(u*SEGMENT_HEIGHT+nodePositions[j].y+art.offsetY)*scale,left:art.x*scale}}><AnimatedIllustration id={`world-${u+1}-${asset}`} width={art.width*scale} height={art.height*scale} visible={visibleArt.includes(`world-${u+1}-${asset}`)} playing={!selected&&!lives}/></View>;}))}
        {lessons.map(l=>{const pos=nodePositions[(l.number-1)%4],state=status(l),active=state==="available",complete=state==="completed",top=((l.unit-1)*SEGMENT_HEIGHT+pos.y)*scale;
          return <View key={l.id} style={{position:"absolute",left:pos.x*scale-76,top:top-34,width:152,alignItems:"center",gap:9}}>
            <Tap label={`Misión ${l.number}: ${l.title}. ${state==="pending"?"Próximamente":state==="locked"?"Bloqueada":complete?"Completada":"Disponible"}`} onPress={()=>setSelected(l)} style={{width:68,height:68,borderRadius:34,borderWidth:5,borderColor:C.surface,backgroundColor:active||complete?C.forest:C.cream,alignItems:"center"}}><T title size={25} color={active||complete?C.cream:C.cocoa}>{l.number}</T>{complete&&<View style={{position:"absolute",right:-3,bottom:-3,backgroundColor:C.surface,borderRadius:12,padding:3}}><Icon name="check" size={16} color={C.forest}/></View>}{state==="locked"&&<View style={{position:"absolute",right:-2,bottom:-2,backgroundColor:C.surface,borderRadius:12,padding:3}}><Icon name="lock" size={14}/></View>}</Tap>
            <T size={14} style={{textAlign:"center",backgroundColor:C.background,paddingHorizontal:4}}>{l.title}</T>
            {l.id===p.data.active?.lessonId?<Tap label="Reanudar misión" onPress={()=>setSelected(l)}><T size={13} color={C.forest}>Reanudar</T></Tap>:l.id===next?.id?<Tap label="Abrir siguiente misión" onPress={()=>setSelected(l)}><T size={13} color={C.forest}>Empezar</T></Tap>:state==="pending"?<T size={12}>Próximamente</T>:null}
          </View>;
        })}
        <View style={{position:"absolute",top:(SEGMENT_HEIGHT*6+110)*scale,left:0,right:0,backgroundColor:C.background}}><ArcTitle text="Continuará…" size={28}/></View>
      </View>
    </ScrollView>
    <Sheet visible={!!selected} title={selected?.title||"Tu misión"} onClose={()=>setSelected(null)}>
      {selected&&<><T size={13} color={C.forest}>Misión {selected.number} · {environments[selected.unit-1].short}</T><T>{selected.mission?.context||"Un nuevo lugar para seguir aprendiendo. Próximamente."}</T><View style={{alignItems:"center",paddingVertical:6}}><AnimatedIllustration key={selected.id} id={`mission-${selected.number}`} width={240} height={150} playing={!!selected}/></View>{selected.mission&&<T size={14}>{selected.mission.objective}</T>}<Button text={s==="pending"?"Próximamente":s==="locked"?"Completa la misión anterior":p.data.active?.lessonId===selected.id?"Reanudar misión":s==="completed"?"Volver a explorar":"Conocer la misión"} disabled={s==="pending"||s==="locked"} onPress={()=>{const id=selected.id;setSelected(null);if(p.data.active?.lessonId===id)nav.navigate("Lesson");else nav.navigate("Intro",{lessonId:id});}}/></>}
    </Sheet>
    <RecoverySheet visible={lives} onClose={()=>setLives(false)}/>
  </Page>;
}
export function UnitsScreen({navigation}:NativeStackScreenProps<RootStack,"Units">){return <Page header={<Header back={()=>navigation.goBack()}/>}><ArcTitle text="Lugares del camino"/>{environments.map((u,i)=><Tap key={u.name} style={{paddingVertical:20}} onPress={()=>navigation.navigate("Main",{screen:"Camino",params:{unit:i+1}})}><T>{u.name}</T><T size={13}>Misiones {i*4+1}–{i*4+4}</T></Tap>)}</Page>;}
