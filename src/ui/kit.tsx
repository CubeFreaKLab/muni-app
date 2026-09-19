import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextProps,
  ViewStyle,
  StyleProp,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
  FadeIn,
} from "react-native-reanimated";
import Feather from "@expo/vector-icons/Feather";
import { SvgXml } from "react-native-svg";
import { C, fonts } from "../design/theme";
import { figmaAssets } from "../design/figma-assets";
import { characterStates, characterAspectRatios, CharacterState } from "../design/motion-slots";
import { useProgress } from "../state/Progress";
import { MotionScrollView } from "./motion";
import glyphs from "../design/font-glyphs.json";
export type IconName = React.ComponentProps<typeof Feather>["name"];
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const headingGlyphs = new Set(glyphs.heading),
  bodyGlyphs = new Set(glyphs.body);
export function fontFor(text: string, title=false) {
  const covered=(set:Set<number>)=>Array.from(text.normalize("NFC")).every(c=>c==="\n"||set.has(c.codePointAt(0)!));
  return title&&covered(headingGlyphs)?fonts.title:covered(bodyGlyphs)?fonts.body:Platform.select({android:"sans-serif",ios:"System",default:"sans-serif"});
}
export function ArcTitle({text,size=32,style}:{text:string;size?:number;style?:StyleProp<ViewStyle>}) {
  const [width,setWidth]=useState(342);
  const normalized=text.normalize("NFC");
  const Segmenter=(Intl as any).Segmenter;
  const chars:string[]=Segmenter?Array.from(new Segmenter("es",{granularity:"grapheme"}).segment(normalized),(part:any)=>part.segment):Array.from(normalized).reduce<string[]>((a,c)=>{if(/\p{Mark}/u.test(c)&&a.length)a[a.length-1]+=c;else a.push(c);return a;},[]);
  const fontSize=Math.min(size,width/Math.max(1,chars.length*.6));
  const family=fontFor(normalized,true);
  return <View accessible accessibilityRole="header" accessibilityLabel={text} onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[{alignSelf:"stretch",alignItems:"center",paddingTop:16,paddingBottom:6},style]}>
    <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{flexDirection:"row",alignItems:"center"}}>
      {chars.map((c,i)=>{const position=chars.length<2?0:(i/(chars.length-1))*2-1;return <Text accessible={false} key={i} style={{width:/\s/u.test(c)?fontSize*.32:undefined,fontFamily:family,fontSize,lineHeight:fontSize*1.35,color:C.cocoa,includeFontPadding:false,transform:[{translateY:-10*(1-position*position)},{rotate:`${position*4}deg`}]}}>{/\s/u.test(c)?"\u00A0":c}</Text>;})}
    </View>
  </View>;
}
export function T({
  children,
  style,
  title = false,
  size = 16,
  color = C.cocoa,
  ...props
}: TextProps & { title?: boolean; size?: number; color?: string }) {
  const text = React.Children.toArray(children)
    .filter((c) => typeof c === "string" || typeof c === "number")
    .join("");
  const covered = (set: Set<number>) =>
    Array.from(text).every((c) => c === "\n" || set.has(c.codePointAt(0)!));
  const fontFamily =
    title && covered(headingGlyphs)
      ? fonts.title
      : covered(bodyGlyphs)
        ? fonts.body
        : Platform.select({
            android: "sans-serif",
            ios: "System",
            default: "sans-serif",
          });
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily,
          fontSize: size,
          lineHeight: Math.ceil(size * (title ? 1.2 : 1.45)),
          color,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 24,
  color = C.cocoa,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function Tap({
  children,
  onPress,
  disabled = false,
  label,
  style,
  selected,
  role = "button",
  dimDisabled = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
  role?: "button" | "radio" | "tab";
  dimDisabled?: boolean;
}) {
  const { reduceMotion } = useProgress();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const change = (v: number) => {
    scale.value = withTiming(reduceMotion ? 1 : v, {
      duration: 120,
      reduceMotion: ReduceMotion.System,
    });
  };
  return (
    <AnimatedPressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected, checked: role === "radio" ? selected : undefined }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => change(0.97)}
      onPressOut={() => change(1)}
      style={[
        { justifyContent: "center", minHeight: 44, opacity: disabled && dimDisabled ? 0.48 : 1 },
        style,
        anim,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
export function Button({
  text,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  style,
}: {
  text: string;
  onPress?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      label={text}
      style={[
        styles.button,
        {
          backgroundColor: secondary ? C.surface : C.forest,
          borderColor: secondary ? C.cream : C.forest,
          borderBottomWidth: 1,
        },
        style,
      ]}
    >
      <View style={styles.buttonInner}>
        <T
          size={17}
          color={secondary ? C.cocoa : C.cream}
          style={{ textAlign: "center", flexShrink: 1 }}
        >
          {text}
        </T>
        {icon && (
          <Icon name={icon} size={20} color={secondary ? C.cocoa : C.cream} />
        )}
      </View>
    </Tap>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
}: {
  name: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Tap
      label={label}
      onPress={onPress}
      disabled={disabled}
      style={styles.iconButton}
    >
      <Icon name={name} />
    </Tap>
  );
}
export function Logo({
  width = 112,
  light = false,
}: {
  width?: number;
  light?: boolean;
}) {
  return (
    <View accessible accessibilityLabel="Muni">
      <SvgXml
        xml={figmaAssets[light ? "logo-cream" : "logo-cocoa"]}
        width={width}
        height={(width * 408) / 1275}
      />
    </View>
  );
}
export function Character({ height = 230, state = "idle" }: { height?: number; state?: CharacterState }) {
  return (
    <View pointerEvents="none" accessible={false}>
      <SvgXml
        xml={characterStates[state] || figmaAssets["muni-idle"]}
        height={height}
        width={height * (characterAspectRatios[state] || 699/1068)}
        preserveAspectRatio="xMidYMid meet"
      />
    </View>
  );
}
export function AudioSoon() {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel="Audio próximamente"
      style={styles.audio}
    >
      <Icon name="volume-2" size={18} />
      <T size={12}>Audio próximamente</T>
    </View>
  );
}
export function ProgressBar({
  value,
  label,
  light = false,
}: {
  value: number;
  label?: string;
  light?: boolean;
}) {
  const { reduceMotion } = useProgress();
  const p = useSharedValue(value);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, value)), {
      duration: reduceMotion ? 0 : 320,
    });
  }, [value, reduceMotion]);
  const anim = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[
        styles.progress,
        { backgroundColor: light ? C.cocoa + "40" : C.caramel + "70" },
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: light ? C.cream : C.forest },
          anim,
        ]}
      />
    </View>
  );
}
export function Page({
  children,
  scroll = true,
  padded = true,
  footer,
  header,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.page, style]}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
      {header && <View style={{paddingHorizontal:20}}>{header}</View>}
      {scroll ? (
        <MotionScrollView
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: 28 },
            padded && { paddingHorizontal: 24 },
          ]}
        >
          {children}
        </MotionScrollView>
      ) : (
        <View style={[{ flex: 1 }, padded && { paddingHorizontal: 24 }]}>
          {children}
        </View>
      )}
      {footer && (
        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          {footer}
        </SafeAreaView>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Header({
  back,
  right,
  label,
}: {
  back?: () => void;
  right?: React.ReactNode;
  label?: string;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton name="arrow-left" label="Volver" onPress={back} />
      ) : (
        <Logo />
      )}
      {label && (
        <T size={13} style={{ flex: 1, textAlign: "center" }}>
          {label}
        </T>
      )}
      {right ?? <View style={{ width: 48 }} />}
    </View>
  );
}
export function Tag({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: dark ? C.forest : C.caramel + "65" },
      ]}
    >
      <T size={11} color={dark ? C.cream : C.cocoa}>
        {text}
      </T>
    </View>
  );
}
export function Sheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { reduceMotion } = useProgress();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cerrar panel"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={{ position: "absolute", right: 16, top: 16 }}>
            <IconButton name="x" label="Cerrar" onPress={onClose} />
          </View>
          <MotionScrollView
            bounces={false}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 36, gap: 16 }}
          >
            <T title size={29} style={{ paddingRight: 30 }}>
              {title}
            </T>
            {children}
          </MotionScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
export function Entrance({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useProgress();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(260)}
      style={{ flex: 1 }}
    >
      {children}
    </Animated.View>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    minHeight: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  button: { borderRadius: 18, borderWidth: 1, minHeight: 56 },
  buttonInner: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  progress: { height: 12, borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderColor: C.caramel + "75",
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  audio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    opacity: 0.65,
  },
  overlay: {
    flex: 1,
    backgroundColor: C.cocoa + "80",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "87%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  handle: {
    height: 4,
    width: 44,
    backgroundColor: C.caramel,
    borderRadius: 4,
    alignSelf: "center",
    position: "absolute",
    top: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { height: 1, backgroundColor: C.caramel, marginVertical: 20 },
  section: { gap: 16, marginTop: 24 },
  field: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: C.cocoa,
    borderWidth: 1.5,
    borderColor: C.caramel,
    borderRadius: 16,
    padding: 16,
    minHeight: 54,
  },
  card: {
    borderWidth: 1.5,
    borderColor: C.caramel,
    borderRadius: 22,
    padding: 20,
  },
  link: {
    textDecorationLine: "underline",
    color: C.forest,
    textAlign: "center",
    paddingVertical: 16,
  },
});
