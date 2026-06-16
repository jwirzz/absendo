import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });
