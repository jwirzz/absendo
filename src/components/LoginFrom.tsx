import React, { useState } from "react";
import { supabase } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";
import { getGermanAuthError } from "../utils/authErrorMessage.ts";

function LoginFrom() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
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
        <section className="min-h-[calc(100vh-76px)] px-4 py-10 md:py-14">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <aside>
                    <div className="card h-full border border-base-300 bg-base-200 shadow-sm">
                        <div className="card-body gap-5">
                            <span className="badge badge-primary badge-outline w-fit">Anmeldung</span>
                            <h2 className="text-3xl font-bold leading-tight">Willkommen zurück bei Absendo</h2>
                            <ul className="list-disc space-y-2 pl-5 text-sm text-base-content/80">
                                <li>Schnell und einfach Absenzen erfassen</li>
                                <li>Automatische Synchronisation mit deinem Sluz-Kalender</li>
                                <li>Zero-Knowledge-Architektur schützt deine persönlichen Daten</li>
                            </ul>
                        </div>
                    </div>
                </aside>

                <div className="card border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body p-6 md:p-8">
                        <h1 className="text-3xl font-bold">Einloggen</h1>
                        <p className="text-base-content/75">Nutze Google, GitHub oder E-Mail mit Passwort.</p>

                        <div className="mt-4 grid gap-3">
                            <button
                                className="btn btn-outline w-full justify-start gap-3"
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
                                className="btn btn-outline w-full justify-start gap-3"
                                onClick={logInWithGithub}
                                type="button"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.809 1.304 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                                Mit GitHub fortfahren
                            </button>
                        </div>

                        <div className="divider my-6">oder</div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="label">
                                    <span className="label-text">E-Mail</span>
                                </label>
                                <input
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="du@beispiel.ch"
                                    className="input input-bordered w-full"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Passwort</span>
                                </label>
                                <input
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    placeholder="Dein Passwort"
                                    className="input input-bordered w-full"
                                    autoComplete="current-password"
                                />
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

                        <p className="mt-6 text-center text-sm">
                            Noch kein Konto? <a href="/signup" className="link link-primary">Jetzt registrieren</a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LoginFrom;
