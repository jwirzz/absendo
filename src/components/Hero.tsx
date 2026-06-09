import { useEffect, useState } from "react";
import { useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";

function Hero() {
    const [userCount, setUserCount] = useState<number | null>(null);
    const [hasError, setHasError] = useState(false);
    const isUserLoggedIn = useIsUserLoggedIn();

    useEffect(() => {
        const abortController = new AbortController();

        const fetchUserCount = async () => {
            try {
                const response = await fetch("https://api.absendo.app/stats/user-count", {
                    signal: abortController.signal,
                });
                if (!response.ok) {
                    throw new Error("Could not load user count");
                }
                const { userCount } = await response.json();
                setUserCount(userCount);
            } catch (err) {
                if (abortController.signal.aborted) return;
                console.error("Error fetching user count:", err);
                setHasError(true);
            }
        };

        const scheduleFetch = () => {
            void fetchUserCount();
        };

        if (typeof window.requestIdleCallback === "function") {
            const idleId = window.requestIdleCallback(scheduleFetch, { timeout: 1200 });
            return () => {
                abortController.abort();
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(scheduleFetch, 350);
        return () => {
            abortController.abort();
            window.clearTimeout(timeoutId);
        };
    }, []);

    const navigateToPrimaryAction = () => {
        trackEvent("click_cta_start_free", { section: "hero" });
        if (!isUserLoggedIn) {
            window.location.href = "/signup";
            return;
        }
        window.location.href = "/dashboard";
    };

    return (
        <section className="relative overflow-hidden bg-base-100">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-info/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-success/20 blur-3xl" />

            <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="text-center lg:text-left">
                    {userCount !== null && !hasError && (
                        <div className="badge badge-info mb-7 gap-2 px-4 py-3 text-xs font-medium md:text-sm">
                            <span className="inline-block h-2 w-2 rounded-full bg-success" />
                            Bereits {userCount} aktive Nutzerinnen und Nutzer
                        </div>
                    )}

                    <h1 className="text-4xl font-black leading-tight md:text-6xl">
                        BBZW Absenzformulare
                        <span className="mt-1 block text-primary">in etwa 30 Sekunden</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg text-base-content/80 lg:mx-0">
                        Absenz einreichen ohne Stress. Absendo liest deinen Schulnetz-Kalender, füllt wiederkehrende
                        Angaben automatisch aus und spart dir bis zu 5 Minuten pro Formular.
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                        <button
                            className="btn btn-success btn-lg gap-2 shadow-md"
                            onClick={navigateToPrimaryAction}
                        >
                            Jetzt kostenlos starten
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            className="btn btn-outline btn-lg gap-2"
                            onClick={() => {
                                trackEvent("click_how_it_works", { section: "hero" });
                                window.location.hash = "#how-it-works";
                            }}
                        >
                            So funktioniert es
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="card border border-base-300 bg-base-200/80 shadow-xl backdrop-blur">
                    <div className="card-body gap-4">
                        <h2 className="card-title text-xl">Das bietet Absendo</h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                                        <circle cx="12" cy="12" r="9" />
                                    </svg>
                                </span>
                                <p className="text-sm text-base-content/80">
                                    Fokus auf Geschwindigkeit: klarer Ablauf von Login bis Download.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Z" />
                                    </svg>
                                </span>
                                <p className="text-sm text-base-content/80">
                                    Zero-Knowledge-Architektur für sensible Profildaten.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                    </svg>
                                </span>
                                <p className="text-sm text-base-content/80">
                                    Kostenlos nutzbar und offen für Verbesserungen aus der Community.
                                </p>
                            </div>
                        </div>
                        <a className="link link-hover mt-2 text-sm text-primary" href="/bbzw-absenzformular">
                            Mehr Details zum BBZW Ablauf
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;
