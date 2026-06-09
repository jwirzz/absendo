import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { trackEvent } from "../utils/umami.ts";

function Support() {
    return (
        <div className="min-h-screen bg-base-100 flex flex-col">
            <Navbar />

            <main className="flex-1 px-4 py-14 md:py-20">
                <section className="mx-auto max-w-4xl">
                    <div className="card border border-base-300 bg-base-200 shadow-sm">
                        <div className="card-body gap-6 p-8 md:p-10">
                            <span className="badge badge-primary badge-outline w-fit">Support</span>

                            <h1 className="text-3xl font-bold md:text-4xl">
                                Hilf mit, Absendo am Laufen zu halten
                            </h1>

                            <p className="text-base-content/80">
                                Absendo bleibt kostenlos. Wenn du das Projekt unterstützen willst, hilft ein kleiner
                                Beitrag direkt bei den laufenden Kosten für Server, Datenbank, Monitoring und Domain.
                            </p>

                            <div className="grid gap-4 md:grid-cols-3">
                                <article className="rounded-box border border-base-300 bg-base-100 p-4">
                                    <h2 className="font-semibold">Server</h2>
                                    <p className="mt-1 text-sm text-base-content/75">
                                        Hosting und API Betrieb
                                    </p>
                                </article>
                                <article className="rounded-box border border-base-300 bg-base-100 p-4">
                                    <h2 className="font-semibold">Datenbank</h2>
                                    <p className="mt-1 text-sm text-base-content/75">
                                        Profil und Feedback Daten
                                    </p>
                                </article>
                                <article className="rounded-box border border-base-300 bg-base-100 p-4">
                                    <h2 className="font-semibold">Monitoring</h2>
                                    <p className="mt-1 text-sm text-base-content/75">
                                        Stabilität und Uptime
                                    </p>
                                </article>
                            </div>

                            <p className="text-base-content/80">
                                Danke für jeden Support. Das hilft sofort beim Betrieb und bei neuen Verbesserungen.
                            </p>

                            <div className="card-actions">
                                <a
                                    className="btn btn-primary gap-2"
                                    href="https://buymeacoffee.com/jwirz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent("click_buymeacoffee_support_page")}
                                >
                                    Buy me a coffee
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h12a2 2 0 0 1 2 2v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 10h1a3 3 0 1 1 0 6h-1" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Support;
