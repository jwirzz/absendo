import { trackEvent } from "../utils/umami.ts";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-base-300 bg-base-200">
            <div className="mx-auto max-w-6xl px-6 py-14">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-sm space-y-4">
                        <a className="inline-flex items-center gap-2" href="/" onClick={() => trackEvent("click_footer_home")}>
                            <img src="/logo.png" alt="Absendo Logo" className="h-7 w-7" />
                            <span className="text-lg font-bold tracking-tight">Absendo</span>
                        </a>
                        <p className="text-sm leading-relaxed text-base-content/60">
                            BBZW-Absenzformulare in Sekunden, mit Fokus auf einfache Abläufe und Datenschutz.
                            Von Lernenden für Lernende.
                        </p>
                        <a
                            className="btn btn-primary btn-sm gap-2"
                            href="https://buymeacoffee.com/jwirz"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("click_support_footer")}
                        >
                            Projekt unterstützen
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h12a2 2 0 0 1 2 2v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 10h1a3 3 0 1 1 0 6h-1" />
                            </svg>
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm sm:grid-cols-3">
                        <FooterCol title="Produkt">
                            <FooterLink href="/bbzw-absenzformular">BBZW Absenzformular</FooterLink>
                            <FooterLink href="/dashboard">Dashboard</FooterLink>
                            <FooterLink href="/profile">Profil</FooterLink>
                        </FooterCol>
                        <FooterCol title="Ressourcen">
                            <FooterLink href="https://github.com/notacodes/absendo" external>Open Source</FooterLink>
                            <FooterLink href="https://absendo.betteruptime.com/" external>System Status</FooterLink>
                            <FooterLink href="/support">Support</FooterLink>
                        </FooterCol>
                        <FooterCol title="Rechtliches">
                            <FooterLink href="/contact">Kontakt</FooterLink>
                            <FooterLink href="/datenschutz">Datenschutz</FooterLink>
                            <FooterLink href="mailto:hello@absendo.app">hello@absendo.app</FooterLink>
                        </FooterCol>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-2 border-t border-base-300 pt-6 text-sm text-base-content/50 sm:flex-row sm:items-center sm:justify-between">
                    <p>© {currentYear} Absendo · nicht offiziell mit Schulen assoziiert</p>
                    <p>Gemacht für Sursee, Emmen und Willisau.</p>
                </div>
            </div>
        </footer>
    );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <nav className="flex flex-col gap-2.5">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-base-content/40">{title}</h2>
            {children}
        </nav>
    );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
    return (
        <a
            href={href}
            className="text-base-content/70 transition-colors duration-150 hover:text-primary"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            {children}
        </a>
    );
}

export default Footer;
