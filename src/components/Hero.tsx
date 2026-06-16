import { useEffect, useState } from "react";
import { useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import CountUp from "./CountUp.tsx";

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
        <section className="relative overflow-hidden border-b border-base-300 bg-base-100">
            <div
                className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
                style={{ maskImage: "linear-gradient(180deg, #000 0%, transparent 80%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 80%)" }}
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 text-center md:pb-28 md:pt-24">
                <div className="hero-in mb-6 flex min-h-[20px] flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {userCount !== null && !hasError && (
                        <>
                            <span className="inline-flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                                </span>
                                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-success">Live</span>
                            </span>
                            <span className="text-sm text-base-content/60">
                                <span className="font-bold tabular-nums text-base-content">
                                    <CountUp value={userCount} />
                                </span>{"  "}
                                 Lernende profitieren
                            </span>
                        </>
                    )}
                </div>

                <h1 className="hero-in display-xl mx-auto max-w-3xl" style={{ animationDelay: "60ms" }}>
                    Dein Absenzformular?
                    <br />
                    <span className="text-primary">Macht Absendo.</span>
                </h1>

                <p className="hero-in measure mx-auto mt-6 text-lg leading-relaxed text-base-content/70" style={{ animationDelay: "120ms" }}>
                    Tag tippen, Lektionen wählen, PDF raus. Alles in 30 Sekunden. Gratis, versteht sich.
                </p>

                <div className="hero-in mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
                    <button className="btn btn-primary btn-lg gap-2" onClick={navigateToPrimaryAction}>
                        Jetzt kostenlos starten
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                    <a
                        href="/demo"
                        className="btn btn-ghost btn-lg gap-2"
                        onClick={() => trackEvent("click_try_demo", { section: "hero" })}
                    >
                        Demo ansehen ohne Konto
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>

                <div className="hero-in mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-base-content/60" style={{ animationDelay: "210ms" }}>
                    <TrustItem>Kostenlos &amp; ohne Abo</TrustItem>
                    <TrustItem>Zero-Knowledge-Architektur</TrustItem>
                    <TrustItem>Open Source</TrustItem>
                </div>
            </div>
        </section>
    );
}

function TrustItem({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
            {children}
        </span>
    );
}

export default Hero;
