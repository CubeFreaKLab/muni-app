import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useProgress } from "../state/Progress";
import { takeMissionCelebration } from "../design/celebrations";
import { animationFor } from "../design/lottie-assets";
import { motionSlots } from "../design/motion-slots";
import { useMotionState } from "./motion";
import LottiePlayer from "./LottiePlayer";

export function MissionCelebration() {
  const { data, busy, saveError } = useProgress(), { active, focused, reduceMotion } = useMotionState(), { width, height } = useWindowDimensions();
  const allowed = active && focused && !reduceMotion;
  const result = data.lastResult, id = result?.kind === "lesson" ? result.sessionId : undefined;
  const [playing, setPlaying] = useState(false);
  const stop = useCallback(() => setPlaying(false), []);
  useEffect(() => {
    if (!id) return;
    if (!active || reduceMotion || saveError) { takeMissionCelebration(id); setPlaying(false); return; }
    if (!focused) return; // A new native-stack screen can mount before receiving focus.
    if (busy || !takeMissionCelebration(id)) return;
    setPlaying(true);
    // Failure/finish callbacks remove the layer; the deadline also covers a stalled player.
    const timer = setTimeout(stop, motionSlots.missionComplete.durationMs + 1500);
    return () => { clearTimeout(timer); setPlaying(false); };
  }, [id, active, focused, reduceMotion, busy, saveError, stop]);
  if (!playing || !allowed) return null;
  const asset = animationFor("confeti-nivel-completado"), scale = Math.max(width / 390, height / 844);
  const webStyle = { width: 390 * scale, height: 844 * scale, marginLeft: (width-390*scale)/2, marginTop: (height-844*scale)/2 };
  return <View testID="mission-confetti" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { zIndex: 100, overflow: "hidden" }]}>
    <LottiePlayer source={asset.load()} autoPlay loop={false} speed={1} resizeMode="cover"
      style={StyleSheet.absoluteFill} webStyle={Platform.OS === "web" ? webStyle : undefined}
      onAnimationFinish={stop} onAnimationFailure={stop}/>
  </View>;
}
