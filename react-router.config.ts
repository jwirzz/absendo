import type { Config } from "@react-router/dev/config";

export default {
    appDirectory: "src",
    ssr: false,
    prerender: [
        "/",
        "/bbzw-absenzformular",
        "/bbzw-absenzen-entschuldigen",
        "/contact",
        "/datenschutz",
        "/support",
        "/demo",
    ],
} satisfies Config;
