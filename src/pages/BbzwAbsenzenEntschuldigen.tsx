import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { trackEvent } from "../utils/umami.ts";

function BbzwAbsenzenEntschuldigen() {
    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    BBZW Absenz entschuldigen: Ablauf, Fristen & Formular
                </h1>

                <p className="text-lg mb-6">
                    Du hast am BBZW gefehlt – wegen Krankheit, eines Termins oder einer geplanten
                    Abwesenheit – und musst die Absenz jetzt entschuldigen? Diese Anleitung erklärt den
                    Ablauf, die Fristen und wie du das Formular für Sursee, Emmen oder Willisau in
                    Sekunden ausgefüllt hast.
                </p>

                <div className="alert mb-10">
                    <span className="text-base">
                        Die folgenden Angaben stammen aus dem offiziellen BBZW-Formular
                        «Entschuldigung / Urlaubsgesuch» (Stand 11.08.2023). Verbindlich sind immer die
                        aktuelle Version des Formulars und die Angaben deiner Klassenlehrperson.
                    </span>
                </div>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Entschuldigung oder Urlaubsgesuch – was brauchst du?</h2>
                    <p className="text-lg mb-4">
                        Das BBZW unterscheidet zwei Fälle, die beide über dasselbe Formular laufen:
                    </p>
                    <ul className="list-disc list-inside space-y-3 text-lg">
                        <li>
                            <strong>Entschuldigung</strong> – für eine Absenz, die bereits eingetreten ist,
                            z.&nbsp;B. wegen Krankheit. Du reichst sie <em>nachträglich</em> ein.
                        </li>
                        <li>
                            <strong>Urlaubsgesuch</strong> – für eine Abwesenheit, die du <em>im Voraus</em>{" "}
                            planst, z.&nbsp;B. ein Termin oder ein Anlass. Beim Urlaubsgesuch musst du
                            zwingend ein Beweismittel beilegen.
                        </li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Die Fristen am BBZW</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Entschuldigung</h3>
                            <p className="text-lg">
                                Das Formular musst du spätestens in der <strong>3. Schulwoche nach
                                Wiederaufnahme des Unterrichts</strong> den betroffenen Lehrpersonen bzw. der
                                Klassenlehrperson zum Visieren vorlegen. Eine Entschuldigung wird{" "}
                                <strong>nicht akzeptiert</strong>, wenn kein plausibler Grund vorliegt, das
                                Formular zu spät eintrifft oder unvollständig ausgefüllt ist.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Urlaubsgesuch</h3>
                            <p className="text-lg">
                                Das Gesuch reichst du spätestens <strong>3 Schulwochen vor dem Urlaub</strong>{" "}
                                bei der Klassenlehrperson ein. Es wird von der Fachbereichsleitung bewilligt
                                oder abgelehnt, und du erhältst einen schriftlichen Bescheid. Ein bewilligtes
                                Urlaubsgesuch muss den Lehrpersonen nicht zum Visieren vorgelegt werden.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Krank melden am BBZW</h2>
                    <p className="text-lg">
                        Eine krankheitsbedingte Absenz entschuldigst du nachträglich mit dem offiziellen
                        Formular – innerhalb der oben genannten Frist und mit plausibler Begründung.
                        Informiere bei längerer Krankheit zusätzlich frühzeitig deine Klassenlehrperson.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Was wird beim Urlaubsgesuch nicht bewilligt?</h2>
                    <ul className="list-disc list-inside space-y-2 text-lg">
                        <li>Urlaub für die Auto- oder Rollerprüfung</li>
                        <li>Ferien und vorzeitiges Abreisen</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">So füllst du das Absenzformular aus</h2>
                    <ol className="list-decimal list-inside space-y-3 text-lg">
                        <li>Name, Vorname, Geburtsdatum und Klasse eintragen.</li>
                        <li>Datum der Absenz und Begründung angeben (beim Urlaubsgesuch Beweismittel beilegen).</li>
                        <li>Betroffene Lektionen auflisten: Anzahl Lektionen, Wochentag und Datum, Fach, Lehrperson.</li>
                        <li>Unterschreiben – bei unter 18-Jährigen zusätzlich durch die gesetzliche Vertretung.</li>
                        <li>Angaben des Lehrbetriebs (Berufsbildner/in) ergänzen und das Formular einreichen.</li>
                    </ol>
                    <p className="text-lg mt-4">
                        Wichtig: <strong>Pro Ereignis ist ein eigenes Formular auszufüllen</strong>, und du
                        bewahrst es bis Ende Schuljahr auf. Für verpassten Unterrichtsstoff kann ein
                        Kompensationsauftrag erteilt werden.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Schneller: das Formular automatisch ausfüllen lassen</h2>
                    <p className="text-lg mb-6">
                        Die wiederkehrenden Angaben – Stammdaten und betroffene Lektionen – sind das, was
                        jedes Mal nervt. Absendo übernimmt sie automatisch aus deinem Stundenplan und
                        erstellt dir das fertige PDF. Du prüfst nur noch Grund und Zeitraum. Mehr dazu auf
                        der Seite{" "}
                        <a className="link link-primary" href="/bbzw-absenzformular" onClick={() => trackEvent("click_landing_from_guide")}>
                            BBZW Absenzformular online ausfüllen
                        </a>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a className="btn btn-primary btn-lg" href="/signup" onClick={() => trackEvent("click_cta_start_free", { section: "guide" })}>Jetzt kostenlos starten</a>
                        <a className="btn btn-outline btn-lg" href="/demo" onClick={() => trackEvent("click_demo_from_guide")}>Demo ansehen</a>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4">Häufige Fragen</h2>
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Bis wann muss ich eine Absenz am BBZW entschuldigen?</h3>
                            <p className="text-lg">
                                Spätestens in der 3. Schulwoche nach Wiederaufnahme des Unterrichts. Zu spät
                                eingereichte, unvollständige oder nicht plausibel begründete Formulare werden
                                nicht akzeptiert.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Wie früh muss ich ein Urlaubsgesuch einreichen?</h3>
                            <p className="text-lg">
                                Spätestens 3 Schulwochen vor dem Urlaub bei der Klassenlehrperson, mit
                                Beweismittel. Die Fachbereichsleitung entscheidet und du erhältst einen
                                schriftlichen Bescheid.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Was ist der Unterschied zwischen Entschuldigung und Urlaubsgesuch?</h3>
                            <p className="text-lg">
                                Eine Entschuldigung reichst du nachträglich für eine bereits eingetretene
                                Absenz ein (z.&nbsp;B. Krankheit). Ein Urlaubsgesuch stellst du im Voraus für
                                eine geplante Abwesenheit.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Gilt das für BBZW Sursee, Emmen und Willisau?</h3>
                            <p className="text-lg">
                                Ja. Absendo ist aktuell auf die BBZW-Standorte Sursee, Emmen und Willisau
                                ausgerichtet.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default BbzwAbsenzenEntschuldigen;
