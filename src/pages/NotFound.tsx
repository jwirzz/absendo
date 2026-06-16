import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";

function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-base-100">
            <Navbar />
            <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24 text-center">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#B8A7FF]/25 blur-3xl" />
                </div>

                <div className="relative">
                    <p className="display-xl text-primary">404</p>
                    <h1 className="display-md mt-2">Diese Seite gibt es nicht.</h1>
                    <p className="measure mx-auto mt-4 text-lg text-base-content/70">
                        Vielleicht wurde sie verschoben oder der Link stimmt nicht ganz. Kein Stress, zurück zur
                        Startseite und weiter geht's.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <a href="/" className="btn btn-primary gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" />
                            </svg>
                            Zur Startseite
                        </a>
                        <a href="/contact" className="btn btn-ghost">Problem melden</a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default NotFound;
