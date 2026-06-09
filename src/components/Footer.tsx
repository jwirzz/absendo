import { trackEvent } from "../utils/umami.ts";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-base-300 bg-base-200">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <aside className="space-y-4 lg:col-span-1">
                        <a
                            className="inline-flex items-center text-2xl font-bold"
                            href="/"
                            onClick={() => trackEvent("click_footer_home")}
                        >
                            Absendo
                        </a>
                        <p className="max-w-xs text-base-content/80">
                            Das Tool für schnelle BBZW Absenzformulare mit Fokus auf einfache Abläufe und Datenschutz.
                        </p>
                        <a
                            className="btn btn-sm btn-primary gap-2"
                            href="https://buymeacoffee.com/jwirz"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("click_support_footer")}
                        >
                            Support
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h12a2 2 0 0 1 2 2v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 10h1a3 3 0 1 1 0 6h-1" />
                            </svg>
                        </a>
                    </aside>

                    <nav className="flex flex-col items-start gap-2">
                        <h2 className="footer-title">Produkt</h2>
                        <a className="link link-hover block" href="/bbzw-absenzformular">BBZW Absenzformular</a>
                        <a className="link link-hover block" href="/dashboard">Dashboard</a>
                        <a className="link link-hover block" href="/profile">Profil</a>
                    </nav>

                    <nav className="flex flex-col items-start gap-2">
                        <h2 className="footer-title">Ressourcen</h2>
                        <a
                            className="link link-hover block"
                            href="https://github.com/notacodes/absendo"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Source
                        </a>
                        <a
                            className="link link-hover block"
                            href="https://absendo.betteruptime.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            System Status
                        </a>
                        <a className="link link-hover block" href="/datenschutz">Datenschutzerklärung</a>
                    </nav>

                    <nav className="flex flex-col items-start gap-2">
                        <h2 className="footer-title">Kontakt</h2>
                        <a className="link link-hover block" href="/contact">Kontaktformular</a>
                        <a className="link link-hover block" href="mailto:contact@absendo.app">contact@absendo.app</a>
                    </nav>
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-base-300 pt-5 text-sm text-base-content/70 sm:flex-row sm:items-center sm:justify-between">
                    <p>© {currentYear} Absendo</p>
                    <p>Gemacht für Sursee, Emmen und Willisau.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
