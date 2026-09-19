import React, { memo } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { illustrationData } from "../design/illustration-assets";

type Props = { id: string; size?: number; width?: number; height?: number; style?: StyleProp<ViewStyle> };

// One dimension preserves the natural aspect ratio; two dimensions define a contain box.
// Original viewBoxes stay intact, including the bridge's documented transparent margin.
export const Illustration = memo(function Illustration({ id, size = 96, width, height, style }: Props) {
  const asset = illustrationData[id];
  const ratio = asset?.aspectRatio || 1;
  const w = width ?? (height !== undefined ? height * ratio : size);
  const h = height ?? (width !== undefined ? width / ratio : size);
  if (!asset) return null;
  const fittedW = Math.min(w, h * ratio), fittedH = fittedW / ratio;
  const frame = asset.frame;
  return (
    <View testID={`illustration-${id}`} accessible={false} pointerEvents="none"
      style={[{ width: w, height: h, alignItems: "center", justifyContent: "center", flexShrink: 0 }, style]}>
      <View style={{ width: fittedW, height: fittedH, overflow: "hidden" }}>
        <SvgXml xml={asset.xml} preserveAspectRatio="xMidYMid meet"
          width={frame ? fittedW / frame[2] : fittedW}
          height={frame ? fittedH / frame[3] : fittedH}
          style={frame ? { position: "absolute", left: -frame[0]*fittedW/frame[2], top: -frame[1]*fittedH/frame[3] } : undefined}/>
      </View>
    </View>
  );
});

export function Landscape({ width, height }: { width?: number; height?: number }) {
  return <Illustration id="landscape" width={width ?? (height ? undefined : 342)} height={height}/>;
}
