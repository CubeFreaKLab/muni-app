import React, { useState } from "react";
import { Linking, View } from "react-native";
import { lexicon } from "../content/course";
import { C } from "../design/theme";
import { Icon, T, Tap } from "./kit";
const publicContext=(id:string)=>{
  const w=lexicon[id];
  if(w.number)return `Número ${w.number}.`;
  const pilot:Record<string,string>={wasi:"Casa. Se aprende a reconocerla como parte del entorno.",inti:"El sol, como astro del cielo.",yaku:"Agua. La fuente también documenta unu como sinónimo.",qiru:"Vaso de madera."};
  return pilot[id]||w.context.split(/[.;]/)[0]+".";
};
export function Sources({ids}:{ids:string[]}){
  const [open,setOpen]=useState(false),[error,setError]=useState(false);
  return <View style={{borderTopWidth:1,borderColor:C.cream,marginTop:18}}><Tap label={open?"Cerrar fuentes y contexto":"Ver fuentes y contexto"} onPress={()=>setOpen(!open)} style={{paddingVertical:16}}><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><T size={14}>Fuentes y contexto</T><Icon name={open?"chevron-up":"chevron-down"} size={18}/></View></Tap>{open&&<View style={{gap:18,paddingBottom:16}}>{[...new Set(ids)].filter(id=>lexicon[id]).map(id=>{const w=lexicon[id];return <View key={id} style={{gap:7}}><T size={17}>{w.form} · {w.meaningEs}</T><T size={13}>{publicContext(id)}</T><T size={12}>{w.region}</T><T size={12}>{w.source.title} · página {w.source.pdfPage} del PDF · entrada «{w.source.entry}»</T>{w.variants.map(v=><T key={v.form} size={13}>Variante aceptada: {v.form}.</T>)}<Tap onPress={()=>Linking.openURL(`${w.source.url}#page=${w.source.pdfPage}`).catch(()=>setError(true))}><T size={13} color={C.forest} style={{textDecorationLine:"underline"}}>Abrir fuente original</T></Tap></View>;})}<T size={12}>Contrastado con documentos. La revisión de un hablante sigue pendiente.</T>{error&&<T size={12}>No se pudo abrir el enlace. Inténtalo con conexión.</T>}</View>}</View>;
}
