import React, { memo, useCallback, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { animationFor, MuniAnimation } from "../design/lottie-assets";
import { illustrationData } from "../design/illustration-assets";
import { Illustration } from "./Illustration";
import LottiePlayer from "./LottiePlayer";
import { useArtworkVisibility, useMotionAllowed } from "./motion";

type Props = { id: string; size?: number; width?: number; height?: number; playing?: boolean; visible?: boolean; fallback?: React.ReactNode };
class ArtworkBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
const Player = memo(function Player({ asset, id, width, height, fallback }: { asset: MuniAnimation; id: string; width: number; height: number; fallback: React.ReactNode }) {
  const source = useMemo(() => asset.load(), [asset]);
  // Local native JSON is rendered immediately. A missing iOS load notification
  // must never leave a valid animation permanently hidden behind the SVG.
  const [loaded, setLoaded] = useState(Platform.OS !== "web"), [failed, setFailed] = useState(false);
  const ready = useCallback(() => setLoaded(true), []);
  const fail = useCallback((error: string) => { setFailed(true); if (__DEV__) console.warn(`Muni Lottie ${id}: ${error}`); }, [id]);
  const [x, y, cw, ch] = asset.contentBox, scale = Math.min(width / cw, height / ch);
  const style = { width: asset.size[0] * scale, height: asset.size[1] * scale };
  // The bridge metadata already contains its corrected frame; do not crop it again.
  return <>{(!loaded || failed) && fallback}{!failed && <View testID={`lottie-${id}`} pointerEvents="none" style={{ position: "absolute", left: (width-cw*scale)/2-x*scale, top: (height-ch*scale)/2-y*scale, opacity: loaded ? 1 : 0, ...style }}>
    <LottiePlayer source={source} autoPlay loop={asset.loop} speed={1} resizeMode="contain" style={style} webStyle={style}
      onAnimationLoaded={ready} onAnimationFailure={fail}/>
  </View>}</>;
});

// Explicit opt-in at large decorative placements. Thumbnails and icons stay SVG.
export const AnimatedIllustration = memo(function AnimatedIllustration({ id, width, height, size = 96, playing = true, visible, fallback }: Props) {
  const asset = animationFor(id), allowed = useMotionAllowed(), visibility = useArtworkVisibility(visible !== undefined);
  const ratio = illustrationData[id]?.aspectRatio ?? (asset ? asset.contentBox[2] / asset.contentBox[3] : 1);
  const w = width ?? (height !== undefined ? height * ratio : size), h = height ?? (width !== undefined ? width / ratio : size);
  const staticArt = useMemo(() => fallback ?? <Illustration id={id} width={w} height={h}/>, [fallback, id, w, h]);
  return <View ref={visibility.ref} onLayout={visibility.onLayout} collapsable={false} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: w, height: h, flexShrink: 0, overflow: "visible", alignItems: "center", justifyContent: "center" }}>
    {asset && allowed && playing && (visible ?? visibility.visible)
      ? <ArtworkBoundary key={id} fallback={staticArt}><Player asset={asset} id={id} width={w} height={h} fallback={staticArt}/></ArtworkBoundary>
      : staticArt}
  </View>;
});
