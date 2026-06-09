import { useEffect, useState } from "react";
import { useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";

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
            <section className="bg-base-100 py-20">
                <div className="mx-auto max-w-6xl px-4">
                    <h2 id="how-it-works" className="scroll-mt-40 text-center text-4xl font-bold md:text-5xl">
                        So einfach geht es
                    </h2>

                    <div className="mt-14 grid gap-8 lg:grid-cols-3">
                        <article className="card border border-base-300 bg-base-200 shadow-sm">
                            <div className="card-body">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="badge badge-primary badge-outline">Schritt 1</span>
                                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="8.5" cy="7" r="4" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 8v6M23 11h-6" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold">Anmelden</h3>
                                <p className="text-base-content/80">
                                    Einmal registrieren, Kalender-URL einfügen und persönliche Angaben speichern.
                                </p>
                            </div>
                        </article>

                        <article className="card border border-base-300 bg-base-200 shadow-sm">
                            <div className="card-body">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="badge badge-primary badge-outline">Schritt 2</span>
                                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold">Datum und Lektionen wählen</h3>
                                <p className="text-base-content/80">
                                    Wähle dein Datum und nur die relevanten Lektionen, die in die Absenz sollen.
                                </p>
                            </div>
                        </article>

                        <article className="card border border-base-300 bg-base-200 shadow-sm">
                            <div className="card-body">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="badge badge-primary badge-outline">Schritt 3</span>
                                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 15 2 2 4-4" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold">PDF herunterladen</h3>
                                <p className="text-base-content/80">
                                    Das Formular wird vorbereitet, du lädst es runter und bist fertig.
                                </p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-base-200/40 py-20">
                <div className="mx-auto max-w-6xl px-4">
                    <h2 className="text-center text-4xl font-bold md:text-5xl">Warum Absendo?</h2>

                    <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-2">
                        <article className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body flex-row items-start gap-4">
                                <span className="rounded-xl bg-success/20 p-2 text-success">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">Kostenlos nutzbar</h3>
                                    <p className="text-base-content/80">Keine Abos und keine versteckten Kosten.</p>
                                </div>
                            </div>
                        </article>

                        <article className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body flex-row items-start gap-4">
                                <span className="rounded-xl bg-info/20 p-2 text-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                                        <circle cx="12" cy="12" r="9" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">Schneller Ablauf</h3>
                                    <p className="text-base-content/80">In der Regel unter 30 Sekunden bis zum fertigen Formular.</p>
                                </div>
                            </div>
                        </article>

                        <article className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body flex-row items-start gap-4">
                                <span className="rounded-xl bg-warning/20 p-2 text-warning-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Z" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">Zero-Knowledge-Architektur</h3>
                                    <p className="text-base-content/80">Deine Daten werden clientseitig verschlüsselt. Nur du kannst sie entschlüsseln.</p>
                                </div>
                            </div>
                        </article>

                        <article className="card border border-base-300 bg-base-100 shadow-sm">
                            <div className="card-body flex-row items-start gap-4">
                                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14 21 3" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 14v7h-7" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10 14 21" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">Open Source</h3>
                                    <p className="text-base-content/80">
                                        Transparent entwickelt auf{" "}
                                        <a className="link link-primary" href="https://github.com/notacodes/absendo" target="_blank" rel="noopener noreferrer">
                                            GitHub
                                        </a>
                                        .
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-base-100 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="card border border-base-300 bg-base-200 shadow-sm">
                        <div className="card-body items-center p-10 text-center">
                            <h3 className="text-4xl font-bold">Für wen ist Absendo?</h3>
                            <p className="max-w-3xl text-lg text-base-content/80">
                                Aktuell für Schülerinnen und Schüler des Berufsbildungszentrums Wirtschaft, Informatik und Technik
                                in Sursee, Willisau und Emmen.
                            </p>
                            <p className="max-w-3xl text-base-content/80">
                                Weitere Schulen sind geplant. Wenn du deine Schule vorschlagen willst, schreib uns kurz.
                            </p>
                            <a
                                href="/contact"
                                className="btn btn-primary mt-4 gap-2"
                                onClick={() => trackEvent("click_contact_school_suggest")}
                            >
                                Schule vorschlagen
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 15 22l-4-9-9-4 20-7Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section id="faq" className="bg-base-200/40 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <h2 className="text-center text-4xl font-bold md:text-5xl">Häufige Fragen</h2>
                    <p className="mx-auto mt-4 max-w-3xl text-center text-base-content/80">
                        Mehr Details findest du auf{" "}
                        <a className="link link-primary font-semibold" href="/bbzw-absenzformular">
                            BBZW Absenzformular
                        </a>
                        .
                    </p>

                    <div className="mx-auto mt-12 max-w-4xl space-y-6">
                        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
                            <input
                                type="checkbox"
                                aria-label="FAQ: Wie schnell kann ich ein BBZW Absenzformular ausfÃ¼llen?"
                                onChange={(e) => e.target.checked && trackEvent("faq_open", { question: "speed" })}
                            />
                            <div className="collapse-title text-xl font-bold">
                                Wie schnell kann ich ein BBZW Absenzformular ausfüllen?
                            </div>
                            <div className="collapse-content text-lg text-base-content/80">
                                In der Regel unter 30 Sekunden, sobald dein Profil eingerichtet ist.
                            </div>
                        </div>

                        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
                            <input
                                type="checkbox"
                                aria-label="FAQ: Was brauche ich, um mit BBZW Absenzen zu starten?"
                                onChange={(e) => e.target.checked && trackEvent("faq_open", { question: "requirements" })}
                            />
                            <div className="collapse-title text-xl font-bold">
                                Was brauche ich, um mit BBZW Absenzen zu starten?
                            </div>
                            <div className="collapse-content text-lg text-base-content/80">
                                Den Link zu deinem Schulnetz-Kalender und deine persönlichen Angaben. Danach erstellt Absendo
                                das Formular automatisch.
                            </div>
                        </div>

                        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
                            <input
                                type="checkbox"
                                aria-label="FAQ: FÃ¼r welche BBZW Standorte funktioniert es?"
                                onChange={(e) => e.target.checked && trackEvent("faq_open", { question: "locations" })}
                            />
                            <div className="collapse-title text-xl font-bold">
                                Für welche BBZW Standorte funktioniert es?
                            </div>
                            <div className="collapse-content text-lg text-base-content/80">
                                Aktuell für Sursee, Emmen und Willisau. Weitere Schulen sind geplant.
                            </div>
                        </div>

                        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
                            <input
                                type="checkbox"
                                aria-label="FAQ: Muss ich das Formular jedes Mal neu ausfÃ¼llen?"
                                onChange={(e) => e.target.checked && trackEvent("faq_open", { question: "repeat_data" })}
                            />
                            <div className="collapse-title text-xl font-bold">
                                Muss ich das Formular jedes Mal neu ausfüllen?
                            </div>
                            <div className="collapse-content text-lg text-base-content/80">
                                Nein. Wiederkehrende Angaben werden automatisch übernommen.
                            </div>
                        </div>

                        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
                            <input
                                type="checkbox"
                                aria-label="FAQ: Ist Absendo kostenlos?"
                                onChange={(e) => e.target.checked && trackEvent("faq_open", { question: "pricing" })}
                            />
                            <div className="collapse-title text-xl font-bold">
                                Ist Absendo kostenlos?
                            </div>
                            <div className="collapse-content text-lg text-base-content/80">
                                Ja, Absendo ist kostenlos nutzbar.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-base-100 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="card overflow-hidden border border-base-300 bg-gradient-to-r from-base-200 to-base-100 shadow-lg">
                        <div className="grid md:grid-cols-[1fr_auto]">
                            <div className="card-body p-8 text-center md:p-10 md:text-left">
                                <h2 className="text-4xl font-bold md:text-5xl">Bereit, Zeit zu sparen?</h2>
                                <p className="max-w-2xl text-lg text-base-content/80">
                                    Absendo nimmt dir repetitive Schritte ab und bringt dich schneller zum fertigen Formular.
                                </p>

                                <button className="btn btn-success btn-lg mt-4 gap-2 shadow-md" onClick={handleStart}>
                                    Jetzt kostenlos nutzen
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m12 5 7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="border-base-300 bg-base-100/70 p-8 md:border-l md:p-10">
                                {!hasStatsError ? (
                                    <div className="space-y-4 text-center">
                                        <p className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
                                            Bereits eingespart
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-box border border-base-300 bg-base-100 p-4">
                                                <div className="text-3xl font-black text-primary">{savedTimeHours}</div>
                                                <div className="text-xs text-base-content/70">
                                                    {savedTimeHours === 1 ? "Stunde" : "Stunden"}
                                                </div>
                                            </div>
                                            <div className="rounded-box border border-base-300 bg-base-100 p-4">
                                                <div className="text-3xl font-black text-primary">{savedTimeMinutes}</div>
                                                <div className="text-xs text-base-content/70">Minuten</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-base-content/75">
                                            Das ist Zeit, die stattdessen für Schule und Freizeit bleibt.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-base-content/70">
                                        Statistik wird gerade geladen.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomeContent;
