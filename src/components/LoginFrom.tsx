import React, { useState } from "react";
import { supabase } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import { getGermanAuthError } from "../utils/authErrorMessage.ts";

const FEATURES = [
    "Absenzen in Sekunden erfassen",
    "Automatische Synchronisation mit deinem Sluz-Kalender",
    "Zero-Knowledge – deine Daten bleiben privat",
];

function LoginFrom() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Bitte fülle alle Felder aus.");
            trackEvent("login_form_error", { reason: "missing_fields" });
            return;
        }

        setIsSubmitting(true);
        try {
            trackEvent("login_submit_attempt");
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            trackEvent("login_submit_success");
        } catch (err: unknown) {
            trackEvent("login_submit_error");
            setError(getGermanAuthError(err, "Login fehlgeschlagen."));
        } finally {
            setIsSubmitting(false);
        }
    };

    async function logInWithGithub() {
        trackEvent("login_oauth_click", { provider: "github" });
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
    }

    async function logInWithGoogle() {
        trackEvent("login_oauth_click", { provider: "google" });
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
    }

    return (
        <section className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10 md:py-14">
            <div className="grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="hidden lg:block">
                    <div className="relative h-full overflow-hidden rounded-3xl bg-secondary p-9 text-secondary-content shadow-soft-lg">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
                        <div className="relative flex h-full flex-col">
                            <a href="/" className="inline-flex items-center gap-2">
                                <img src="/logo.png" alt="Absendo Logo" className="h-7 w-7" />
                                <span className="text-lg font-bold tracking-tight">Absendo</span>
                            </a>
                            <h2 className="mt-10 text-3xl font-bold leading-tight">Willkommen zurück</h2>
                            <p className="mt-3 text-sm leading-relaxed text-secondary-content/70">
                                Schön, dass du wieder da bist. Weiter geht's mit deinen Absenzen.
                            </p>
                            <ul className="mt-8 space-y-4">
                                {FEATURES.map((t) => (
                                    <li key={t} className="flex items-start gap-3">
                                        <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary text-primary-content">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                        <span className="text-sm leading-snug text-secondary-content/90">{t}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-auto pt-10 text-xs text-secondary-content/55">
                                Kostenlos · Keine Kreditkarte · DSGVO-konform
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-soft-lg md:p-9">
                    <h1 className="text-3xl font-bold tracking-tight">Einloggen</h1>
                    <p className="mt-1 text-base-content/70">Nutze Google, GitHub oder E-Mail mit Passwort.</p>

                    <div className="mt-6 grid gap-3">
                        <button
                            className="btn btn-outline w-full justify-center gap-3"
                            onClick={logInWithGoogle}
                            type="button"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.37 1.1-3.71 1.1-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.52 7.62 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.62 1 4.01 3.48 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Mit Google fortfahren
                        </button>

                        <button
                            className="btn btn-outline w-full justify-center gap-3"
                            onClick={logInWithGithub}
                            type="button"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.809 1.304 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            Mit GitHub fortfahren
                        </button>
                    </div>

                    <div className="divider my-6 text-sm text-base-content/40">oder mit E-Mail</div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-base-content/80">E-Mail</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
                                    </svg>
                                </span>
                                <input
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="du@beispiel.ch"
                                    className="afield"
                                    style={{ paddingLeft: "2.75rem" }}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-base-content/80">Passwort</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                        <rect x="5" y="11" width="14" height="9" rx="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                                    </svg>
                                </span>
                                <input
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Dein Passwort"
                                    className="afield"
                                    style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 transition-colors hover:text-base-content/70"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.5 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.1M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.95" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button className="btn btn-primary w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Wird eingeloggt..." : "Jetzt einloggen"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-base-content/70">
                        Noch kein Konto? <a href="/signup" className="link link-primary font-semibold">Jetzt registrieren</a>
                    </p>
                </div>
            </div>
        </section>
    );
}

export default LoginFrom;
