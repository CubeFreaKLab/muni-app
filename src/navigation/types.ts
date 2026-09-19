import type { NavigatorScreenParams } from "@react-navigation/native";
export type Tabs = {
  Camino: { unit?: number } | undefined;
  Repaso: undefined;
  Colección: undefined;
  Perfil: undefined;
};
export type RootStack = {
  Welcome: undefined;
  Language: undefined;
  Goal: { editing?: boolean } | undefined;
  Main: NavigatorScreenParams<Tabs> | undefined;
  Units: undefined;
  Intro: { lessonId: string };
  Lesson: { recovery?: boolean } | undefined;
  Results: undefined;
  Word: { id: string };
  Settings: undefined;
  EditProfile: undefined;
  Account: { mode: "login" | "register" | "recovery" };
  About: undefined;
  Streak: undefined;
  Backpack: undefined;
};
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStack {}
  }
}
