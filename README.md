<p align="center"><img src="docs/brand/gh-readme.svg" alt="Muni" width="440" /></p>
<p align="center">
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/React-19.1-285931?logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/React_Native-0.81-285931?logo=react&logoColor=white" alt="React Native" />
<img src="https://img.shields.io/badge/Expo-SDK_54-572314?logo=expo&logoColor=white" alt="Expo SDK 54" />
</p>
<p align="center">Aprendamos quechua boliviano, una palabra a la vez.</p>
<p align="center"><a href="https://www.figma.com/proto/D8rKdzc1cwuRucWjWd4y8L/MuniAPP?node-id=43-2&amp;starting-point-node-id=43%3A2">Ver prototipo en Figma</a> · <a href="https://github.com/CubeFreaKLab/muni-app/releases/tag/v1.0.0">Versión 1.0 y APK</a> · <a href="#ejecutar">Ejecutar</a> · <a href="docs/ARQUITECTURA.md">Arquitectura</a></p>

# Muni

Muni es una aplicación móvil para aprender lenguas con poca presencia digital. Su primer recorrido introduce vocabulario de quechua boliviano mediante misiones ilustradas, ejercicios y repaso. Aymara llegará próximamente.

## Versión 1.0

- Modo invitado, objetivo diario y camino continuo con seis ambientes y 24 nodos.
- 16 misiones disponibles de 10 actividades y 33 entradas documentadas. Misiones 17–24 pendientes.
- Elección de imagen, parejas, memoria, construcción, escena, clasificación y cantidades.
- Progreso local, pausa, colección, favoritos, repaso, racha, vidas y semillas virtuales.
- SVG originales y 30 animaciones Lottie locales con alternativa estática y reducción de movimiento.

El contenido se contrasta con el **Diccionario de la Nación Quechua del CENAQ**. Cada ficha conserva fuente, página y variantes. Falta revisión por un hablante. La versión es silenciosa y no incluye backend de cuentas, sincronización, pagos, anuncios ni pronunciación.

## Ejecutar

Requiere Node.js 20.19 o posterior y npm.

```bash
git clone https://github.com/CubeFreaKLab/muni-app.git
cd muni-app
npm ci
npm run phone
```

Mantén teléfono y computadora en la misma red. Escanea el QR con Expo Go **compatible con SDK 54**. Si tu Expo Go no admite ese SDK, necesitarás una compilación compatible. Un hotspot funciona si permite comunicación entre ambos dispositivos.

```bash
npm run web           # Preview auxiliar
npm run typecheck     # Comprobación de TypeScript
npm run bundle:mobile # Exportación de JavaScript para iOS y Android
```

La [APK de Muni 1.0](https://github.com/CubeFreaKLab/muni-app/releases/download/v1.0.0/Muni-1.0.0.apk) se instala en Android y contiene el bundle. No necesita Metro ni Expo Go. Usa firma de demostración, no una clave de distribución de Google Play. Una APK no funciona en iPhone. Exportar el bundle no genera una APK ni IPA.

## Diseño y documentación

El diseño en Figma reúne 36 pantallas y estados, con un camino desplazable de 24 nodos y un recorrido de navegación. La aplicación implementa los ejercicios y conserva el progreso en el dispositivo.

- [Arquitectura y tecnologías aplicadas](docs/ARQUITECTURA.md)
- [Procedencia de los recursos](assets/manifest.json)

## Datos y alcance

Nombre, preferencias, avance y favoritos se guardan en el dispositivo con AsyncStorage. No hay contraseñas locales. Desinstalar o borrar datos puede eliminar el progreso.

Logotipo, personaje, ilustraciones y fuentes conservan su procedencia; esta publicación no concede una licencia adicional sobre recursos de terceros.
