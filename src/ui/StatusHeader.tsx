import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStack } from "../navigation/types";
import { useProgress } from "../state/Progress";
import { streak } from "../state/model";
import { C } from "../design/theme";
import { Logo, T, Tap } from "./kit";
import { Illustration } from "./Illustration";
export function StatusHeader({onLives}:{onLives:()=>void}) {
  const {data}=useProgress(),nav=useNavigation<NativeStackNavigationProp<RootStack>>();
  return <View style={{height:60,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
    <Logo width={82}/>
    <View style={{flexDirection:"row",gap:6}}>
      <Tap label={`Racha: ${streak(data)} ${streak(data)===1?"día":"días"}`} onPress={()=>nav.navigate("Streak")} style={{paddingHorizontal:5,minWidth:44}}><View style={{flexDirection:"row",gap:4,alignItems:"center"}}><Illustration id="racha" size={23}/><T size={15}>{streak(data)}</T></View></Tap>
      <Tap label={`Vidas: ${data.lives} de 5`} onPress={onLives} style={{paddingHorizontal:5,minWidth:44}}><View style={{flexDirection:"row",gap:4,alignItems:"center"}}><Illustration id="corazon" size={23}/><T size={15}>{data.lives}/5</T></View></Tap>
      <Tap label={`Mochila: ${data.seeds} semillas`} onPress={()=>nav.navigate("Backpack")} style={{paddingHorizontal:5,minWidth:44}}><View style={{flexDirection:"row",gap:4,alignItems:"center"}}><Illustration id="moneda-semilla" size={23}/><T size={15}>{data.seeds}</T></View></Tap>
    </View>
  </View>;
}
