import { secureLogout, useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import { useState, useEffect, type ReactNode } from "react";

function Logo() {
    return (
        <a className="inline-flex items-center gap-2" href="/" onClick={() => trackEvent("click_nav_home")}>
            <img src="/logo.png" alt="Absendo Logo" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">Absendo</span>
        </a>
    );
}

function Kbd({ children }: { children: ReactNode }) {
    return <span className="ml-1 hidden rounded-md border border-current/30 px-1.5 py-0.5 font-mono text-[10px] leading-none opacity-70 sm:inline">{children}</span>;
}

function Navbar() {
    const isUserLoggedIn = useIsUserLoggedIn();
    const [path, setPath] = useState("");

    useEffect(() => {
        setPath(window.location.pathname);
    }, []);

    // App-Header nur eingeloggt; die Demo zeigt denselben Marketing-Header wie die Landingpage
    const appMode = isUserLoggedIn;

    const triggerNewAbsence = () => {
        trackEvent("click_new_absence_nav");
        if (path === "/dashboard" || path === "/demo") {
            window.dispatchEvent(new CustomEvent("absendo:new-absence"));
        } else {
            window.location.assign("/dashboard#neue-absenz");
        }
    };

    // Tastenkürzel N (wie im Design: nur im App-Modus, nicht beim Tippen)
    useEffect(() => {
        if (!appMode) return;
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName ?? "";
            if (
                e.key.toLowerCase() === "n" &&
                !e.metaKey && !e.ctrlKey && !e.altKey &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
                !target?.isContentEditable
            ) {
                e.preventDefault();
                triggerNewAbsence();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appMode, path]);

    const navTab = (href: string, label: string, event: string) => {
        const active = path === href;
        return (
            <a
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => trackEvent(event)}
                className={[
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                    active ? "bg-secondary text-secondary-content" : "text-base-content/70 hover:bg-base-200 hover:text-base-content",
                ].join(" ")}
            >
                {label}
            </a>
        );
    };

    return (
        <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/80 backdrop-blur-md">
                <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                    {appMode ? (
                        <>
                            {/* Links: Logo + Neue Absenz + Glocke */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Logo />
                                <button
                                    className="btn btn-primary btn-sm gap-1"
                                    onClick={triggerNewAbsence}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                    </svg>
                                    <span className="hidden sm:inline">Neue Absenz</span>
                                    <Kbd>N</Kbd>
                                </button>
                            </div>

                            {/* Rechts: Dashboard + Profil */}
                            <nav className="flex items-center gap-1">
                                {navTab("/dashboard", "Dashboard", "click_nav_dashboard")}
                                {navTab("/profile", "Profil", "click_nav_profile")}
                                {isUserLoggedIn && (
                                    <button
                                        className="ml-1 rounded-full px-3.5 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
                                        onClick={() =>
                                            secureLogout().then(() => {
                                                trackEvent("click_nav_logout");
                                                window.location.href = "/home";
                                            })
                                        }
                                    >
                                        Logout
                                    </button>
                                )}
                            </nav>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <Logo />
                            </div>

                            <nav className="hidden items-center gap-1 lg:flex">
                                {navTab("/demo", "Demo", "click_nav_demo")}
                                {navTab("/contact", "Kontakt", "click_nav_contact")}
                            </nav>

                            <div className="flex items-center gap-2">
                                <a className="btn btn-ghost btn-sm md:btn-md" href="/login" onClick={() => trackEvent("click_nav_login")}>
                                    Anmelden
                                </a>
                                <a className="btn btn-primary btn-sm md:btn-md gap-1.5" href="/signup" onClick={() => trackEvent("click_nav_signup")}>
                                    Los geht's
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </>
                    )}
                </div>
        </header>
    );
}

export default Navbar;
