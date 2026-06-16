import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { trackEvent } from "../utils/umami.ts";

function BbzwAbsenzformular() {
    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    BBZW Absenzformular online ausfüllen
                </h1>

                <p className="text-lg mb-6">
                    Mit Absendo füllst du dein BBZW Absenzformular in wenigen Sekunden aus – egal ob
                    Entschuldigung oder Urlaubsgesuch. Die Idee ist aus einem echten Problem entstanden:
                    Das manuelle Ausfüllen hat mich jedes Mal aufgeregt und unnötig Zeit gekostet.
                </p>

                <p className="text-lg mb-10">
                    Deshalb habe ich Absendo gebaut: um BBZW Absenzen einfacher zu machen, Schritte
                    zu reduzieren und pro Formular mehrere Minuten zu sparen.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <a className="btn btn-primary btn-lg" href="/signup" onClick={() => trackEvent("click_cta_start_free", { section: "bbzw_landing_top" })}>Jetzt kostenlos starten</a>
                    <a className="btn btn-outline btn-lg" href="/demo" onClick={() => trackEvent("click_demo_from_bbzw_landing")}>Zuerst Demo ansehen</a>
                </div>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Wie funktioniert das BBZW Absenzformular mit Absendo?</h2>
                    <ol className="list-decimal list-inside space-y-3 text-lg">
                        <li>Einmal mit deinen Daten und deiner Schulnetz-Kalender-URL anmelden.</li>
                        <li>Zeitraum der Absenz im Kalender wählen.</li>
                        <li>Formular automatisch ausfüllen lassen und als PDF herunterladen.</li>
                    </ol>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Entschuldigung oder Urlaubsgesuch?</h2>
                    <p className="text-lg">
                        Das offizielle BBZW-Formular deckt beide Fälle ab: die <strong>Entschuldigung</strong>{" "}
                        für eine bereits eingetretene Absenz (z.&nbsp;B. Krankheit) und das{" "}
                        <strong>Urlaubsgesuch</strong> für eine geplante Abwesenheit. Absendo übernimmt deine
                        Stammdaten und die betroffenen Lektionen aus dem Stundenplan automatisch, damit du nur
                        noch Grund und Zeitraum prüfen musst.
                    </p>
                    <p className="text-lg mt-4">
                        Mehr Details dazu, wie du eine Absenz richtig entschuldigst, findest du in unserer{" "}
                        <a className="link link-primary" href="/bbzw-absenzen-entschuldigen" onClick={() => trackEvent("click_guide_from_landing")}>
                            Anleitung zum Entschuldigen einer BBZW-Absenz
                        </a>.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Für welche Standorte funktioniert Absendo?</h2>
                    <p className="text-lg mb-6">
                        Aktuell ist Absendo für die drei BBZW-Standorte im Kanton Luzern optimiert. Besuchst du
                        eine andere Schule? Schlage sie uns über das{" "}
                        <a className="link link-primary" href="/contact" onClick={() => trackEvent("click_contact_from_bbzw_landing")}>Kontaktformular</a> vor.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Absenzformular BBZW Sursee</h3>
                            <p className="text-lg">
                                Für Lernende am BBZW Sursee bereitet Absendo das Absenzformular mit den richtigen
                                Angaben vor, sodass du es nur noch herunterladen und einreichen musst.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Absenzformular BBZW Emmen</h3>
                            <p className="text-lg">
                                Auch am Standort BBZW Emmen sparst du dir das wiederholte Eintippen derselben Daten –
                                Absendo füllt dein Absenzformular in Sekunden aus.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Absenzformular BBZW Willisau</h3>
                            <p className="text-lg">
                                Für das BBZW Willisau gilt dasselbe: Absenz im Kalender markieren, Formular
                                generieren lassen, fertiges PDF herunterladen.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Warum ich das gebaut habe</h2>
                    <p className="text-lg">
                        Ich wollte den nervigsten Teil bei BBZW Absenzen entfernen: immer wieder dieselben
                        Angaben in das Absenzformular einzutragen. Absendo nimmt dir genau diese repetitive Arbeit ab,
                        damit du schneller fertig bist. Mehr über das Projekt erfährst du auf der{" "}
                        <a className="link link-primary" href="/" onClick={() => trackEvent("click_home_from_bbzw_landing")}>Startseite</a>.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Häufige Fragen zum BBZW Absenzformular</h2>
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Wie kann ich das BBZW Absenzformular schneller ausfüllen?</h3>
                            <p className="text-lg">
                                Mit Absendo werden wiederkehrende Angaben automatisch übernommen und das Formular in
                                wenigen Schritten vorbereitet.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Funktioniert Absendo für BBZW Sursee, Emmen und Willisau?</h3>
                            <p className="text-lg">
                                Ja, die Lösung ist aktuell auf BBZW Sursee, BBZW Emmen und BBZW Willisau ausgerichtet.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Was kostet das Ausfüllen des Absenzformulars mit Absendo?</h3>
                            <p className="text-lg">
                                Absendo ist für Schülerinnen und Schüler kostenlos. Du brauchst nur ein Konto und deine
                                Schulnetz-Kalender-URL.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col sm:flex-row gap-4">
                    <a className="btn btn-primary btn-lg" href="/signup" onClick={() => trackEvent("click_cta_start_free", { section: "bbzw_landing_bottom" })}>Jetzt kostenlos starten</a>
                    <a className="btn btn-outline btn-lg" href="/contact" onClick={() => trackEvent("click_contact_from_bbzw_landing")}>Fragen stellen</a>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default BbzwAbsenzformular;
