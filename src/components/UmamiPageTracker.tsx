import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/umami.ts";

const UMAMI_SCRIPT_SRC = "https://analytics.jwirz.ch/script.js";
const UMAMI_WEBSITE_ID = "690b0f5e-062e-4a36-9324-f7235d62f717";
let umamiScriptPromise: Promise<void> | null = null;

function loadUmamiScript(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }

    if (window.umami) {
        return Promise.resolve();
    }

    if (umamiScriptPromise) {
        return umamiScriptPromise;
    }

    umamiScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-website-id="${UMAMI_WEBSITE_ID}"]`) as HTMLScriptElement | null;
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Umami failed to load")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = UMAMI_SCRIPT_SRC;
        script.defer = true;
        script.async = true;
        script.dataset.websiteId = UMAMI_WEBSITE_ID;
        script.dataset.autoTrack = "false";
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => reject(new Error("Umami failed to load")), { once: true });
        document.head.appendChild(script);
    });

    return umamiScriptPromise;
}

export default function UmamiPageTracker() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        const loadAndTrackInitialPageView = () => {
            void loadUmamiScript()
                .then(() => {
                    trackPageView();
                })
                .catch((error) => {
                    console.error("Failed to load Umami:", error);
                });
        };

        if (typeof window.requestIdleCallback === "function") {
            const idleId = window.requestIdleCallback(loadAndTrackInitialPageView, { timeout: 2000 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(loadAndTrackInitialPageView, 600);
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        trackPageView();
    }, [pathname, search]);

    return null;
}

