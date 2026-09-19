import React, { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import LottieView, { LottieViewProps } from "lottie-react-native";

// Expo Go's native module cannot be patched by changing node_modules. Start local
// JSON after native props and layout have committed, without relying on the iOS
// Fabric onAnimationLoaded event (which can be dropped during mount/recycling).
export default function LottiePlayer({ autoPlay, source, onLayout, onAnimationFinish, ...props }: LottieViewProps) {
  const player = useRef<LottieView>(null), [laidOut, setLaidOut] = useState(false);
  const started = useRef(false);
  const layout = useCallback((event: LayoutChangeEvent) => {
    setLaidOut(event.nativeEvent.layout.width > 0 && event.nativeEvent.layout.height > 0);
    onLayout?.(event);
  }, [onLayout]);
  useEffect(() => {
    if (!laidOut || !autoPlay) return;
    const frame = requestAnimationFrame(() => {
      started.current = true;
      player.current?.play();
    });
    return () => { cancelAnimationFrame(frame); started.current = false; };
  }, [laidOut, autoPlay, source]);
  const finish = useCallback((cancelled: boolean) => {
    // Fabric can emit a cancellation while assigning a source/recycling a view.
    // It is not the completion of the presentation we just requested.
    if (started.current && !cancelled) onAnimationFinish?.(false);
  }, [onAnimationFinish]);
  return <LottieView {...props} source={source} ref={player} autoPlay={false} onLayout={layout} onAnimationFinish={finish}/>;
}
