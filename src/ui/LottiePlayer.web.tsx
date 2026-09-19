import { setWasmUrl } from "@lottiefiles/dotlottie-react";
// Bundle the browser runtime locally too; no CDN request is needed for the preview.
setWasmUrl("/muni-lottie-player.wasm");
export { default } from "lottie-react-native";
