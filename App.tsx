import React, { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Pressable,
  Platform,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionProvider } from "./src/ui/motion";
import { ProgressProvider, useProgress } from "./src/state/Progress";
import { previewLesson, previewName } from "./src/state/preview";
import { RootStack, Tabs } from "./src/navigation/types";
import { C } from "./src/design/theme";
import { Icon, T, Tap, Logo, Button, IconName } from "./src/ui/kit";
import { Welcome, Language, Goal, Account } from "./src/screens/Onboarding";
import { PathScreen, UnitsScreen } from "./src/screens/Path";
import { BackpackScreen, StreakScreen } from "./src/screens/Economy";
import {
  IntroScreen,
  LessonScreen,
  ResultsScreen,
} from "./src/screens/Learning";
import {
  ReviewScreen,
  CollectionScreen,
  WordScreen,
  ProfileScreen,
  SettingsScreen,
  EditProfile,
  AboutScreen,
} from "./src/screens/Library";
const Stack = createNativeStackNavigator<RootStack>();
void SplashScreen.preventAutoHideAsync().catch(()=>{});
const Tab = createBottomTabNavigator<Tabs>();
const tabIcons: Record<keyof Tabs, IconName> = {
  Camino: "map",
  Repaso: "rotate-ccw",
  Colección: "bookmark",
  Perfil: "user",
};
function TabBar({ state, navigation }: BottomTabBarProps) {
  const safe = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        paddingBottom: Math.max(10, safe.bottom),
        paddingTop: 10,
        backgroundColor: C.background,
        borderTopWidth: 1,
        borderColor: C.cream,
      }}
    >
      {state.routes.map((route, i) => {
        const selected = state.index === i;
        return (
          <Tap
            key={route.key}
            role="tab"
            selected={selected}
            label={route.name}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented)
                navigation.navigate(route.name);
            }}
            style={{ flex: 1, minHeight: 54 }}
          >
            <View style={{ alignItems: "center", gap: 5 }}>
              <View
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 3,
                  backgroundColor: "transparent",
                }}
              >
                <Icon
                  name={tabIcons[route.name as keyof Tabs]}
                  size={23}
                  color={selected ? C.forest : C.cocoa}
                />
              </View>
              <T size={12} color={selected ? C.forest : C.cocoa}>
                {route.name}
              </T>
              <View
                style={{
                  height: 3,
                  width: 17,
                  borderRadius: 3,
                  backgroundColor: selected ? C.forest : "transparent",
                }}
              />
            </View>
          </Tap>
        );
      })}
    </View>
  );
}
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(p) => <TabBar {...p} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Camino" component={PathScreen} />
      <Tab.Screen name="Repaso" component={ReviewScreen} />
      <Tab.Screen name="Colección" component={CollectionScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: C.forest,
    background: C.background,
    card: C.background,
    text: C.cocoa,
    border: C.caramel,
    notification: C.terracotta,
  },
};
function AppNavigator() {
  const p = useProgress();
  const [fontsLoaded, fontError] = useFonts({
    MatchaMint: require("./assets/fonts/MatchaMint.otf"),
    MilkyNiceClean: require("./assets/fonts/MilkyNiceClean.ttf"),
    feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
  });
  useEffect(()=>{
    if(p.loaded&&(fontsLoaded||fontError))void SplashScreen.hideAsync().catch(()=>{});
  },[p.loaded,fontsLoaded,fontError]);
  useEffect(()=>{
    if(Platform.OS==="web"){
      const style=document.createElement("style");style.textContent="html,body,#root{height:100%;overflow:hidden;overscroll-behavior:none;background:#FFFCF7}*{overscroll-behavior:none}";document.head.appendChild(style);
      return()=>style.remove();
    }
  },[]);
  if (!p.loaded || (!fontsLoaded && !fontError))
    return (
      <View style={s.loading}>
        <StatusBar style="light" backgroundColor={C.forest}/>
        <Logo light width={210}/>
      </View>
    );
  if (p.loadError)
    return (
      <View
        style={[s.loading, { backgroundColor: C.cream, padding: 24, gap: 20 }]}
      >
        <T title size={29}>
          Tu progreso necesita atención
        </T>
        <T>{p.saveError}</T>
        <T size={13}>
          Cierra y vuelve a abrir Muni para intentar leerlo otra vez.
        </T>
        <Button text="Empezar desde cero" onPress={p.reset} />
      </View>
    );
  return (
    <View style={{ flex: 1 }}>
      {p.saveError && (
        <View style={{ padding: 12, backgroundColor: C.caramel, gap: 8 }}>
          <T size={12}>{p.saveError}</T>
          <Tap onPress={p.retrySave}>
            <T size={12} style={{ textDecorationLine: "underline" }}>
              Reintentar guardado
            </T>
          </Tap>
        </View>
      )}
      {fontError && (
        <View style={{ padding: 8, backgroundColor: C.caramel }}>
          <Text>
            No se pudieron cargar las fuentes. Se usa la fuente del sistema.
          </Text>
        </View>
      )}
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName={previewLesson&&p.data.active?"Lesson":p.data.onboarded ? "Main" : "Welcome"}
          screenOptions={{
            headerShown: false,
            animation: p.reduceMotion ? "none" : "slide_from_right",
            contentStyle: { backgroundColor: C.background },
          }}
        >
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Language" component={Language} />
          <Stack.Screen name="Goal" component={Goal} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Units" component={UnitsScreen} />
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{
              gestureEnabled: false,
              animation: p.reduceMotion ? "none" : "fade",
            }}
          />
          <Stack.Screen name="Word" component={WordScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Account" component={Account} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Streak" component={StreakScreen} />
          <Stack.Screen name="Backpack" component={BackpackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <View style={[s.loading, { padding: 28 }]}>
          <Text style={{ color: C.cream, fontSize: 23, marginBottom: 20 }}>
            No pudimos abrir este paso.
          </Text>
          <Text style={{ color: C.cream }}>
            Tu progreso guardado se conserva.
          </Text>
          <Pressable
            onPress={() => this.setState({ failed: false })}
            style={{ padding: 20 }}
          >
            <Text style={{ color: C.cream, textDecorationLine: "underline" }}>
              Volver a intentar
            </Text>
          </Pressable>
        </View>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ProgressProvider><MotionProvider>
          <View style={s.outer}>
            <View style={s.app}>
              <StatusBar style="dark" />
              <AppNavigator />
            </View>
          </View>
        </MotionProvider></ProgressProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: C.background, alignItems: "center" },
  app: { flex: 1, width: "100%", maxWidth: 600, backgroundColor: C.background },
  loading: {
    flex: 1,
    backgroundColor: C.forest,
    alignItems: "center",
    justifyContent: "center",
  },
});
