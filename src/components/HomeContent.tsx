import { useEffect, useState, type ReactNode } from "react";
import { useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import Reveal from "./Reveal";
import CountUp from "./CountUp.tsx";

function HomeContent() {
    const [hasStatsError, setHasStatsError] = useState(false);
    const [savedTimeMinutes, setSavedTimeMinutes] = useState(0);
    const [savedTimeHours, setSavedTimeHours] = useState(0);
    const isUserLoggedIn = useIsUserLoggedIn();

    useEffect(() => {
        const abortController = new AbortController();

        const fetchSavedTime = async () => {
            try {
                const response = await fetch("https://api.absendo.app/stats/time-saved", {
                    signal: abortController.signal,
                });
                if (!response.ok) {
                    throw new Error("Could not load saved time");
                }
                const data = await response.json();
                setSavedTimeMinutes(data.timeSaved.minutes ?? 0);
                setSavedTimeHours(data.timeSaved.hours ?? 0);
            } catch (err) {
                if (abortController.signal.aborted) return;
                console.error("Error fetching saved time:", err);
                setHasStatsError(true);
            }
        };

        const scheduleFetch = () => {
            void fetchSavedTime();
        };

        if (typeof window.requestIdleCallback === "function") {
            const idleId = window.requestIdleCallback(scheduleFetch, { timeout: 2500 });
            return () => {
                abortController.abort();
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(scheduleFetch, 1200);
        return () => {
            abortController.abort();
            window.clearTimeout(timeoutId);
        };
    }, []);

    const handleStart = () => {
        trackEvent("click_cta_start_free", { section: "home_bottom" });
        if (!isUserLoggedIn) {
            window.location.href = "/signup";
            return;
        }
        window.location.href = "/dashboard";
    };

    return (
        <>
            {/* So einfach geht es */}
            <section className="bg-base-100 py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <span className="pill pill-soft mb-4">So geht's</span>
                        <h2 id="how-it-works" className="display-lg scroll-mt-32">
                            Drei Schritte. Kein Papierkram.
                        </h2>
                    </Reveal>

                    <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
                        {/* Verbindungslinie: macht aus drei Karten eine Sequenz (nur Desktop) */}
                        <div className="pointer-events-none absolute inset-x-[16%] top-[2.85rem] hidden border-t-2 border-dashed border-base-300 lg:block" aria-hidden="true" />
                        <Reveal as="article" delay={0}>
                            <StepCard n={1} color="#FF6B35" title="Anmelden" body="Einmal registrieren, Schulnetz-Kalender-URL einfügen und persönliche Angaben speichern.">
                                <StepProfile />
                            </StepCard>
                        </Reveal>
                        <Reveal as="article" delay={60}>
                            <StepCard n={2} color="#B8A7FF" title="Datum &amp; Lektionen wählen" body="Wähle den Tag und tippe an, welche Lektionen in die Absenz sollen. Kürzel werden ausgeschrieben.">
                                <StepLessons />
                            </StepCard>
                        </Reveal>
                        <Reveal as="article" delay={120}>
                            <StepCard n={3} color="#7FD8B8" title="PDF herunterladen" body="Absendo erzeugt das offizielle BBZW-Formular. Unterschreiben, abgeben, fertig.">
                                <StepPdf />
                            </StepCard>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Warum Absendo */}
            <section className="bg-base-200/60 py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <span className="pill pill-soft mb-4">Warum Absendo</span>
                        <h2 className="display-lg">Gemacht, damit du nie wieder Formulare tippst.</h2>
                    </Reveal>

                    {/* Bento: bewusst unterschiedliche Kachelgrössen statt 4 gleicher Karten */}
                    <div className="mt-14 grid gap-5 lg:grid-cols-6">
                        <Reveal as="article" delay={0} className="lg:col-span-4">
                            <FeatureCard wide color="#FF6B35" bg="#FFE4D6" metric="~30 Sek." metricLabel="bis zum PDF"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />}
                                title={"Schneller, als du „Absenz“ tippst"}
                                body="Von der Anmeldung bis zum unterschriftsreifen Formular vergehen in der Regel nur Sekunden. Kein Abtippen, kein Suchen im Stundenplan." />
                        </Reveal>
                        <Reveal as="article" delay={60} className="lg:col-span-2">
                            <FeatureCard color="#B8A7FF" bg="#EDE7FF" metric="CHF 0" metricLabel="für immer"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6" />}
                                title="Gratis" body="Keine Abos, keine versteckten Kosten." />
                        </Reveal>
                        <Reveal as="article" delay={120} className="lg:col-span-3">
                            <FeatureCard color="#7FD8B8" bg="#D9F3E8" metric="Zero-Knowledge" metricLabel="clientseitig verschlüsselt"
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Z" />}
                                title="Deine Daten bleiben deine" body="Profildaten werden clientseitig verschlüsselt. Nur du kannst sie entschlüsseln." />
                        </Reveal>
                        <Reveal as="article" delay={180} className="lg:col-span-3">
                            <FeatureCard color="#1a1a1f" bg="#eee9e0" metric="GitHub" metricLabel="offen & transparent"
                                icon={<><path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 14 21 3" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 14v7h-7M3 10 14 21" /></>}
                                title="Open Source" body="Transparent entwickelt. Der Code liegt offen auf GitHub." href="https://github.com/jwirzz/absendo" />
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Stats (echte Werte) + Für wen */}
            <section className="bg-base-100 py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <Reveal className="text-center">
                        <h3 className="display-lg mx-auto max-w-3xl">Gemacht für Lernende, nicht für Formulare.</h3>
                        <p className="measure mx-auto mt-4 text-lg text-base-content/70">
                            Berufslernende erledigen ihre Absenzen lieber in Sekunden. Aktuell live an:
                        </p>
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                            {["Sursee", "Emmen", "Willisau"].map((loc) => (
                                <span key={loc} className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold shadow-soft-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
                                        <circle cx="12" cy="10" r="2.5" />
                                    </svg>
                                    {loc}
                                </span>
                            ))}
                        </div>
                    </Reveal>

                    <Reveal className="mt-16">
                        <div className="card overflow-hidden bg-secondary text-secondary-content shadow-soft-lg">
                            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                                {/* Zeit gespart */}
                                <div className="bg-secondary px-8 py-12 md:px-12">
                                    <p className="font-mono text-xs uppercase tracking-widest text-secondary-content/40">
                                        Zeit gespart
                                    </p>
                                    {hasStatsError ? (
                                        <div className="mt-5 font-mono text-6xl font-bold tabular-nums tracking-tight">–</div>
                                    ) : (
                                        <div className="mt-5 flex items-baseline gap-1.5 font-mono font-bold tabular-nums tracking-tight">
                                            <CountUp value={savedTimeHours} className="text-6xl text-primary md:text-7xl" />
                                            <span className="text-2xl text-secondary-content/50">h</span>
                                            <CountUp value={savedTimeMinutes} className="ml-2 text-6xl md:text-7xl" />
                                            <span className="text-2xl text-secondary-content/50">min</span>
                                        </div>
                                    )}
                                    <p className="mt-4 text-sm text-secondary-content/50">
                                        Zeit unserer Lernenden für Besseres als Papierkram.
                                    </p>
                                </div>
                                {/* Kosten */}
                                <div className="bg-secondary px-8 py-12 md:px-12">
                                    <p className="font-mono text-xs uppercase tracking-widest text-secondary-content/40">
                                        Kosten
                                    </p>
                                    <div className="mt-5 font-mono text-6xl font-bold tabular-nums tracking-tight md:text-7xl">
                                        CHF&nbsp;0
                                    </div>
                                    <p className="mt-4 text-sm text-secondary-content/50">
                                        War schon immer so. Bleibt auch so.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="bg-base-200/60 py-24">
                <div className="mx-auto max-w-3xl px-6">
                    <Reveal className="text-center">
                        <span className="pill pill-soft mb-4">FAQ</span>
                        <h2 className="display-lg">Noch Fragen?</h2>
                        <p className="mt-4 text-base-content/70">
                            Mehr Details findest du auf{" "}
                            <a className="font-semibold text-primary underline-offset-2 hover:underline" href="/bbzw-absenzformular">
                                BBZW Absenzformular
                            </a>
                            .
                        </p>
                    </Reveal>

                    <div className="mt-10 flex flex-col gap-3">
                        {FAQ_ITEMS.map(({ key, q, a }, i) => (
                            <Reveal key={key} delay={i * 40}>
                                <FaqCard q={q} a={a} defaultOpen={i === 0} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-base-100 py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <Reveal>
                        <div className="card relative overflow-hidden bg-primary px-8 py-16 text-center text-primary-content shadow-soft-lg md:px-12 md:py-20">
                            {/* weicher Lichtschein oben für Tiefe */}
                            <div
                                className="pointer-events-none absolute left-1/2 top-[-6rem] h-[24rem] w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
                                style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.5), transparent)" }}
                                aria-hidden="true"
                            />
                            <div className="relative">
                                <h2 className="display-lg mx-auto max-w-2xl">Fünf Minuten. Oder dreissig Sekunden.</h2>
                                <p className="measure mx-auto mt-4 text-lg text-primary-content/80">
                                    Deine Entscheidung. Das Formular ist eh schon fertig.
                                </p>
                                <button
                                    className="btn btn-lg mt-8 gap-2 border-none bg-white text-primary shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white hover:shadow-soft-lg"
                                    onClick={handleStart}
                                >
                                    Jetzt kostenlos starten
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 7 7-7 7" />
                                    </svg>
                                </button>
                                <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-primary-content/75">
                                    <span>Kostenlos</span>
                                    <span aria-hidden="true" className="opacity-50">·</span>
                                    <span>kein Abo</span>
                                    <span aria-hidden="true" className="opacity-50">·</span>
                                    <span>keine Kreditkarte</span>
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}

/* --- Sub-components --- */

function FeatureCard({ color, bg, icon, title, body, metric, metricLabel, href, wide }: {
    color: string; bg: string; icon: ReactNode; title: string; body: string; metric: string; metricLabel: string; href?: string; wide?: boolean;
}) {
    const base = "card h-full bg-base-100 p-6 shadow-soft-sm ring-1 ring-base-300/70 transition-transform duration-200 hover:-translate-y-1";
    const IconTile = (
        <div className="icon-tile" style={{ background: bg, color }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">{icon}</svg>
        </div>
    );

    const Inner = wide ? (
        <div className="flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="flex-1">
                {IconTile}
                <h3 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
                <p className="measure mt-2 text-sm leading-relaxed text-base-content/70">{body}</p>
            </div>
            <div className="shrink-0 sm:text-right">
                <div className="font-mono text-3xl font-bold tabular-nums" style={{ color }}>{metric}</div>
                <div className="mt-0.5 text-xs text-base-content/50">{metricLabel}</div>
            </div>
        </div>
    ) : (
        <div className="flex h-full flex-col">
            {IconTile}
            <div className="mt-4 flex-1">
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/70">{body}</p>
            </div>
            <div className="mt-4 border-t border-base-300 pt-4">
                <div className="font-mono text-lg font-bold tabular-nums" style={{ color }}>{metric}</div>
                <div className="mt-0.5 text-xs text-base-content/50">{metricLabel}</div>
            </div>
        </div>
    );

    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={base + " block"}>{Inner}</a>
    ) : (
        <div className={base}>{Inner}</div>
    );
}

function StepCard({ n, color, title, body, children }: { n: number; color: string; title: ReactNode; body: string; children: ReactNode }) {
    return (
        <div className="card flex h-full flex-col gap-5 bg-base-100 p-6 shadow-soft-sm ring-1 ring-base-300/70">
            <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-base font-bold text-white" style={{ background: color }}>{n}</span>
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-base-content/70">{body}</p>
            <div className="mt-auto rounded-2xl bg-base-200 p-4">{children}</div>
        </div>
    );
}

function StepProfile() {
    return (
        <div className="flex flex-col gap-2">
            {[["Name", "Keller, Noah"], ["Standort", "Sursee"], ["Kalender-URL", "schulnetz.web…/ical"]].map(([k, v], i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-base-100 px-3 py-2 text-xs">
                    <span className="font-mono uppercase tracking-wider text-base-content/40">{k}</span>
                    <span className="font-medium">{v}</span>
                </div>
            ))}
        </div>
    );
}

function StepLessons() {
    const rows: [string, string, boolean][] = [["07:40", "Deutsch", true], ["08:30", "Mathematik", true], ["09:30", "IKA", false]];
    return (
        <div className="flex flex-col gap-1.5">
            {rows.map(([t, s, sel], i) => (
                <div key={i} className={["flex items-center gap-2 rounded-lg px-3 py-2 text-xs", sel ? "bg-primary/10 ring-1 ring-primary/30" : "bg-base-100"].join(" ")}>
                    <span className={["grid h-4 w-4 place-items-center rounded border", sel ? "border-primary bg-primary text-white" : "border-base-300"].join(" ")}>
                        {sel && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>}
                    </span>
                    <span className="font-mono text-base-content/50">{t}</span>
                    <span className="font-medium">{s}</span>
                </div>
            ))}
        </div>
    );
}

function StepPdf() {
    return (
        <div className="rounded-lg bg-base-100 p-3">
            <div className="text-xs font-bold">Absenzmeldung BBZW</div>
            <div className="my-2 h-px bg-base-300" />
            <div className="space-y-1">
                {["07:40  Deutsch", "08:30  Mathematik", "09:30  IKA"].map((l, i) => (
                    <div key={i} className="border-b border-dashed border-base-300 py-0.5 font-mono text-[10px] text-base-content/70">{l}</div>
                ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                Bereit zum Download
            </div>
        </div>
    );
}

const FAQ_ITEMS = [
    { key: "speed", q: "Wie schnell kann ich ein BBZW Absenzformular ausfüllen?", a: "In der Regel unter 30 Sekunden, sobald dein Profil eingerichtet ist." },
    { key: "requirements", q: "Was brauche ich, um zu starten?", a: "Den Link zu deinem Schulnetz-Kalender und deine persönlichen Angaben. Danach erstellt Absendo das Formular automatisch." },
    { key: "locations", q: "Für welche BBZW-Standorte funktioniert es?", a: "Aktuell für Sursee, Emmen und Willisau. Weitere Schulen sind geplant." },
    { key: "repeat_data", q: "Muss ich das Formular jedes Mal neu ausfüllen?", a: "Nein. Wiederkehrende Angaben werden automatisch übernommen." },
    { key: "pricing", q: "Ist Absendo kostenlos?", a: "Ja, Absendo ist kostenlos nutzbar." },
];

function FaqCard({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(Boolean(defaultOpen));
    return (
        <div className="card bg-base-100 ring-1 ring-base-300">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open}
                onClick={() => {
                    setOpen((v) => !v);
                    if (!open) trackEvent("faq_open", { question: q });
                }}
            >
                <span className="font-semibold">{q}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="h-5 w-5 flex-shrink-0 text-base-content/50 transition-transform duration-200"
                    style={{ transform: open ? "rotate(180deg)" : "none" }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open && (
                <div className="px-6 pb-5 text-base-content/70" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                    {a}
                </div>
            )}
        </div>
    );
}

export default HomeContent;
