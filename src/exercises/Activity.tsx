import React from "react";
import { View } from "react-native";
import type { Draft, Exercise, Session } from "../content/types";
import { lexicon } from "../content/course";
import { graphemesFor, tileBank } from "./engine";
import { C } from "../design/theme";
import { Icon, T, Tap } from "../ui/kit";
import { Illustration } from "../ui/Illustration";
export function Activity({e,s,setDraft,confirmPair,disabled}:{e:Exercise;s:Session;setDraft:(d:Draft)=>void;confirmPair:(right:string)=>void;disabled:boolean}) {
  const d=s.draft,confirmed=!!s.feedback;
  function choice(id:string,children:React.ReactNode,style:object={}) {
    const correct="answer" in e?e.answer:"target" in e?e.target:"";
    const excluded=s.excluded?.includes(id),selected=d.selected===id;
    const color=confirmed&&id===correct?C.forest:confirmed&&selected?C.terracotta:selected?C.forest:C.cream;
    return <Tap key={id} label={e.type==="sort_words"?e.categories.find(c=>c.id===id)?.label:e.type==="dialogue_choice"?id:lexicon[id]?.meaningEs||id} disabled={disabled||excluded} dimDisabled={!!excluded} selected={selected} onPress={()=>setDraft({selected:id})} style={{borderWidth:2,borderColor:color,borderRadius:16,backgroundColor:C.surface,padding:12,minHeight:58,alignItems:"center",...style}}>{children}{confirmed&&(id===correct||selected)&&<View style={{position:"absolute",right:6,top:6}}><Icon size={17} name={id===correct?"check-circle":"x-circle"} color={color}/></View>}</Tap>;
  }
  if(e.type==="picture_choice")return <View style={{gap:18,alignItems:"center"}}><T title size={39} color={C.forest}>{lexicon[e.target].form}</T><View style={{gap:10,alignSelf:"stretch"}}>{e.options.map(id=>choice(id,<View style={{width:"100%",flexDirection:"row",alignItems:"center",gap:20}}><Illustration id={id} width={108} height={68}/><T size={17} style={{flex:1}}>{lexicon[id].meaningEs}</T></View>,{paddingHorizontal:18,minHeight:90}))}</View></View>;
  if(e.type==="build_word"){
    const w=lexicon[e.target],tiles=d.tiles||[],bank=tileBank(e,d),graphemes=graphemesFor(e,d);
    return <View style={{gap:22,alignItems:"center"}}><Illustration id={w.illustration} width={210} height={112}/><T size={22} style={{textAlign:"center"}}>{w.meaningEs}</T>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:7,justifyContent:"center"}}>{graphemes.map((_,i)=><Tap key={i} disabled={disabled||tiles[i]===undefined} dimDisabled={false} label={tiles[i]===undefined?`Espacio ${i+1}`:`Quitar ${bank[tiles[i]]}`} onPress={()=>setDraft({tiles:tiles.filter((_,j)=>j!==i)})} style={{minWidth:44,height:54,paddingHorizontal:7,borderBottomWidth:3,borderColor:confirmed?(s.feedback==="correct"?C.forest:C.terracotta):C.caramel,backgroundColor:C.surface,borderRadius:9,alignItems:"center"}}><T size={22}>{tiles[i]===undefined?" ":bank[tiles[i]]}</T></Tap>)}</View>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{bank.map((letter,i)=><Tap key={i} disabled={disabled||tiles.includes(i)} label={`Añadir ${letter}, ficha ${i+1}`} onPress={()=>setDraft({tiles:[...tiles,i]})} style={{minWidth:45,height:52,paddingHorizontal:10,backgroundColor:C.cream,borderRadius:10,alignItems:"center"}}><T size={22}>{letter}</T></Tap>)}</View>
      {!!w.variants.length&&!confirmed&&<Tap disabled={disabled} onPress={()=>setDraft({variant:d.variant?undefined:w.variants[0].form,tiles:[]})}><T size={13} color={C.forest} style={{textDecorationLine:"underline"}}>{d.variant?"Usar forma principal":"Construir la variante aceptada"}</T></Tap>}
    </View>;
  }
  if(e.type==="match_pairs"){
    const right=[...e.pairs.slice(1),e.pairs[0]];
    return <View style={{flexDirection:"row",gap:20,marginTop:12}}><View style={{flex:1,gap:18}}>{e.pairs.map(id=>{const result=s.pairResults?.[id],selected=d.left===id;return <Tap key={id} label={`Palabra ${lexicon[id].form}`} disabled={disabled||!!result} dimDisabled={false} selected={selected} onPress={()=>setDraft({left:id})} style={{height:86,alignItems:"center",borderWidth:2,borderColor:result?(result.correct?C.forest:C.terracotta):selected?C.forest:C.cream,borderRadius:16,backgroundColor:C.surface}}><T size={22}>{lexicon[id].form}</T>{result&&<Icon name={result.correct?"check":"arrow-right"} size={16} color={result.correct?C.forest:C.terracotta}/>}</Tap>;})}</View><View style={{flex:1,gap:18}}>{right.map(id=><Tap key={id} label={`Significado ${lexicon[id].meaningEs}`} disabled={disabled||!d.left} dimDisabled={false} onPress={()=>confirmPair(id)} style={{height:86,alignItems:"center",borderWidth:2,borderColor:s.pendingPair===id?C.forest:C.cream,borderRadius:16,backgroundColor:C.surface,paddingHorizontal:8}}><T size={16} style={{textAlign:"center"}}>{lexicon[id].meaningEs}</T></Tap>)}</View></View>;
  }
  if(e.type==="memory_pairs"){
    const cards=[...e.pairs.map(id=>({id,word:true})),...[...e.pairs].reverse().map(id=>({id,word:false}))],open=d.flipped||[],matched=d.memoryMatched||[];
    function flip(index:number){if(disabled||open.includes(index)||matched.includes(index)||open.length===2)return;const next=[...open,index];if(next.length===2){if(cards[next[0]].id===cards[next[1]].id)setDraft({memoryMatched:[...matched,...next],flipped:[],mismatch:false});else setDraft({flipped:next,mismatch:true});}else setDraft({flipped:next});}
    return <View style={{gap:16,alignItems:"center"}}><View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:14}}>{cards.map((card,i)=>{const shown=open.includes(i)||matched.includes(i);return <Tap key={i} label={shown?`${card.word?lexicon[card.id].form:lexicon[card.id].meaningEs}${matched.includes(i)?", pareja encontrada":""}`:`Carta ${i+1}`} onPress={()=>flip(i)} disabled={disabled||matched.includes(i)||open.includes(i)||open.length===2} dimDisabled={false} style={{width:"47%",height:98,borderWidth:2,borderColor:matched.includes(i)?C.forest:C.cream,borderRadius:16,alignItems:"center",padding:10,backgroundColor:shown?C.surface:C.forest}}>{shown?<T size={card.word?23:16} style={{textAlign:"center"}}>{card.word?lexicon[card.id].form:lexicon[card.id].meaningEs}</T>:<Icon name="help-circle" size={32} color={C.cream}/>}</Tap>;})}</View>{d.mismatch&&<Tap label="Volver a tapar" onPress={()=>setDraft({flipped:[],mismatch:false})}><T color={C.forest} style={{textDecorationLine:"underline"}}>Volver a tapar</T></Tap>}</View>;
  }
  if(e.type==="scene_hunt")return <View style={{alignItems:"center",gap:20}}><T title size={39} color={C.forest}>{lexicon[e.target].form}</T><View style={{height:322,width:"100%"}}>{e.objects.map((id,i)=>choice(id,<View style={{alignItems:"center",gap:10}}><Illustration id={id} width={104} height={76}/><T size={14} style={{textAlign:"center"}}>{lexicon[id].meaningEs}</T></View>,{position:"absolute",width:146,left:i===0?0:i===1?"55%":"27%",top:i===0?12:i===1?25:174,minHeight:128}))}</View></View>;
  if(e.type==="sort_words")return <View style={{alignItems:"center",gap:22}}><T title size={39} color={C.forest}>{lexicon[e.target].form}</T><Illustration id={e.target} width={210} height={122}/><T size={18}>{lexicon[e.target].meaningEs}</T><View style={{flexDirection:"row",gap:12,alignSelf:"stretch"}}>{e.categories.map(c=>choice(c.id,<T size={15} style={{textAlign:"center"}}>{c.label}</T>,{flex:1,minHeight:105}))}</View></View>;
  if(e.type==="count_objects")return <View style={{gap:24,alignItems:"center"}}><View accessible accessibilityLabel={`${e.count} ${e.count===1?"objeto":"objetos"} para contar`} style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:14,maxWidth:300,paddingVertical:12}}>{Array.from({length:e.count},(_,i)=><Illustration key={i} id={e.object} width={42} height={52}/>)}</View><View style={{alignSelf:"stretch",gap:12}}>{e.options.map(id=>choice(id,<T size={21}>{lexicon[id].form}</T>))}</View></View>;
  if(e.type==="dialogue_choice")return <View style={{gap:14}}><T>{e.context}</T><T>{e.prompt}</T>{e.options.map(o=>choice(o.id,<T>{o.text}</T>))}</View>;
  return null;
}
