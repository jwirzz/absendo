import { secureLogout, useIsUserLoggedIn } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import { useState, useEffect } from "react";
import ChangelogModal from "./ChangelogModal";

const CHANGELOG_VERSION = "2.0.0";

function Navbar() {
    const isUserLoggedIn = useIsUserLoggedIn();
    const [changelogOpen, setChangelogOpen] = useState(false);
    const [hasUnreadChangelog, setHasUnreadChangelog] = useState(false);

    useEffect(() => {
        const seenVersion = localStorage.getItem("changelog_seen_version");
        setHasUnreadChangelog(seenVersion !== CHANGELOG_VERSION);
    }, []);

    const handleChangelogClose = () => {
        setChangelogOpen(false);
        localStorage.setItem("changelog_seen_version", CHANGELOG_VERSION);
        setHasUnreadChangelog(false);
    };

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/90 backdrop-blur">
                <div className="navbar mx-auto max-w-7xl px-4 md:px-6">
                    <div className="navbar-start gap-2">
                        <a
                            className="btn btn-ghost px-2 text-xl font-bold normal-case"
                            href="/"
                            onClick={() => trackEvent("click_nav_home")}
                        >
                            Absendo
                        </a>
                        <div className="indicator hidden md:inline-flex">
                            {hasUnreadChangelog && (
                                <span className="badge badge-xs badge-error indicator-item"></span>
                            )}
                            <button
                                className="btn btn-ghost btn-circle btn-sm"
                                onClick={() => {
                                    setChangelogOpen(true);
                                    trackEvent("click_nav_changelog");
                                }}
                                title="Neue Änderungen anzeigen"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                        </div>
                    </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal gap-1 px-1">
                        <li>
                            <a href="/bbzw-absenzformular" onClick={() => trackEvent("click_nav_bbzw")}>
                                BBZW
                            </a>
                        </li>
                        <li>
                            <a href="/contact" onClick={() => trackEvent("click_nav_contact")}>
                                Kontakt
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="navbar-end gap-2">
                    {!isUserLoggedIn ? (
                        <>
                            <a
                                className="btn btn-ghost btn-sm md:btn-md"
                                href="/login"
                                onClick={() => trackEvent("click_nav_login")}
                            >
                                Login
                            </a>
                            <a
                                className="btn btn-primary btn-sm md:btn-md"
                                href="/signup"
                                onClick={() => trackEvent("click_nav_signup")}
                            >
                                Kostenlos starten
                            </a>
                        </>
                    ) : (
                        <>
                            <a
                                className="btn btn-ghost btn-sm md:btn-md"
                                href="/dashboard"
                                onClick={() => trackEvent("click_nav_dashboard")}
                            >
                                Dashboard
                            </a>
                            <button
                                className="btn btn-outline btn-error btn-sm md:btn-md"
                                onClick={() =>
                                    secureLogout().then(() => {
                                        trackEvent("click_nav_logout");
                                        window.location.href = "/home";
                                    })
                                }
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
        <ChangelogModal isOpen={changelogOpen} onClose={handleChangelogClose} />
        </>
    );
}

export default Navbar;
