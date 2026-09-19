import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppState, ScrollView, ScrollViewProps, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useProgress } from "../state/Progress";

const ActiveContext = createContext(true);
const subscribeAppState = (listener: () => void) => {
  if (!AppState.isAvailable) return () => {};
  const subscription = AppState.addEventListener("change", listener);
  return () => subscription.remove();
};
const readAppActive = () => !["background", "inactive", "extension"].includes(AppState.currentState);
export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Read again after subscribing: the initial native response can arrive between
  // render and effect. Unknown startup state is gated by screen focus instead.
  const active = useSyncExternalStore(subscribeAppState, readAppActive, () => true);
  return <ActiveContext.Provider value={active}>{children}</ActiveContext.Provider>;
}
export function useMotionState() {
  const active = useContext(ActiveContext), focused = useIsFocused();
  const { reduceMotion } = useProgress();
  return { active, focused, reduceMotion };
}
export function useMotionAllowed() {
  const { active, focused, reduceMotion } = useMotionState();
  return active && focused && !reduceMotion;
}

type Clip = { top: number; bottom: number };
type Viewport = { subscribe: (listener: () => void) => () => void; clip: () => Clip | null };
const ViewportContext = createContext<Viewport | null>(null);

// Only notifies artwork on scroll; React state changes only when visibility changes.
export function MotionScrollView({ onScroll, onLayout, children, ...props }: ScrollViewProps) {
  const scroll = useRef<ScrollView>(null), listeners = useRef(new Set<() => void>()), bounds = useRef<Clip | null>(null);
  const notify = useCallback(() => listeners.current.forEach(listener => listener()), []);
  const viewport = useMemo<Viewport>(() => ({
    clip: () => bounds.current,
    subscribe: listener => { listeners.current.add(listener); return () => { listeners.current.delete(listener); }; },
  }), []);
  return <ViewportContext.Provider value={viewport}><ScrollView {...props} ref={scroll} scrollEventThrottle={100}
    onLayout={event => {
      onLayout?.(event);
      scroll.current?.getNativeScrollRef()?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        bounds.current = { top: y, bottom: y + h }; notify();
      });
    }} onScroll={event => { onScroll?.(event); notify(); }}>{children}</ScrollView></ViewportContext.Provider>;
}

export function useArtworkVisibility(managed: boolean) {
  const ref = useRef<View>(null), viewport = useContext(ViewportContext), { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const measure = useCallback(() => {
    if (managed) return;
    ref.current?.measureInWindow((_x, y, _w, h) => {
      const clip = viewport?.clip();
      setVisible(h > 0 && y + h > (clip?.top ?? 0) - 40 && y < (clip?.bottom ?? height) + 40);
    });
  }, [managed, viewport, height]);
  useEffect(() => {
    const frame = requestAnimationFrame(measure), unsubscribe = viewport?.subscribe(measure);
    return () => { cancelAnimationFrame(frame); unsubscribe?.(); };
  }, [measure, viewport]);
  return { ref, visible, onLayout: measure };
}
