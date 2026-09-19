# Arquitectura de Muni

Muni usa React Native 0.81, React 19.1, Expo SDK 54 y TypeScript. No utiliza Expo Router, Firebase, un servidor de autenticación ni una base SQL.

| Parte | Archivos | Función |
|---|---|---|
| Inicio | `App.tsx` | Fuentes, splash y proveedores |
| Navegación | `src/navigation` | Stack y pestañas con React Navigation |
| Interfaz | `src/screens`, `src/ui` | Controles nativos, safe areas y formularios |
| Contenido | `src/content`, `content` | Fuentes, variantes y misiones |
| Ejercicios | `src/exercises` | Interacción y evaluación |
| Estado | `src/state/Progress.tsx`, `model.ts` | Sesiones, migración y persistencia |
| Identidad | `src/design`, `assets` | Paleta, fuentes, SVG y Lottie |

Una selección es un borrador hasta confirmar. El proveedor registra resultado y pérdida de vida en una misma actualización. El feedback permanece hasta Continuar. Identificadores únicos de sesión y operación evitan duplicar premios y compras. AsyncStorage persiste un documento JSON versionado: no ofrece transacciones SQL ni sincronización entre teléfonos.

React permite reutilizar componentes y actualizar la vista desde el estado. React Native presenta View, Text, Pressable, ScrollView y TextInput como controles de la plataforma. TypeScript describe entradas, ejercicios, sesiones y navegación; no comprueba por sí solo la exactitud lingüística.

Expo organiza el desarrollo, fuentes, splash y haptics. Expo Go es un cliente de desarrollo, no la app instalada. Metro prepara JavaScript y Hermes lo ejecuta en móvil. Reanimated se usa para presión y transiciones. Lottie monta solo los ambientes visibles. SVG conserva las alternativas estáticas. El movimiento respeta el ajuste local y del sistema.

## Compilación Android

El flujo `.github/workflows/android-demo.yml` instala el lockfile, comprueba tipos, genera Android con Expo y compila con Gradle. La APK incluye el bundle y usa la firma de demostración de la plantilla. No es una clave privada de distribución en Google Play.

## Referencias

[React](https://react.dev/learn), [React Native 0.81](https://reactnative.dev/docs/0.81/getting-started), [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/), [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html), [React Navigation](https://reactnavigation.org/docs/nesting-navigators/).
