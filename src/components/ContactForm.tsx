import { useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "../supabaseClient.ts";
import { trackEvent } from "../utils/umami.ts";

type ContactFormData = {
    name: string;
    email: string;
    grund: "feature" | "bug" | "hilfe" | "sonstiges";
    nachricht: string;
};

const INITIAL_DATA: ContactFormData = {
    name: "",
    email: "",
    grund: "feature",
    nachricht: ""
};

export default function ContactForm() {
    const [formData, setFormData] = useState<ContactFormData>(INITIAL_DATA);
    const [gesendet, setGesendet] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setGesendet(false);
        setIsSubmitting(true);

        try {
            const { error } = await supabase.functions.invoke("submit-feedback", {
                body: {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    grund: formData.grund,
                    nachricht: formData.nachricht.trim()
                }
            });

            if (error) {
                throw error;
            }

            trackEvent("contact_submit_success", { grund: formData.grund });
            setGesendet(true);
            setFormData(INITIAL_DATA);
        } catch (error) {
            console.error("Fehler beim Senden des Kontaktformulars:", error);
            trackEvent("contact_submit_error", { grund: formData.grund });
            setErrorMessage("Senden hat nicht geklappt. Bitte versuch es nochmal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-12 md:py-16">
            <div className="grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <aside>
                    <div className="relative h-full overflow-hidden rounded-3xl bg-secondary p-9 text-secondary-content shadow-soft-lg">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
                        <div className="relative flex h-full flex-col">
                            <a href="/" className="inline-flex items-center gap-2">
                                <img src="/logo.png" alt="Absendo Logo" className="h-7 w-7" />
                                <span className="text-lg font-bold tracking-tight">Absendo</span>
                            </a>
                            <h2 className="mt-10 text-3xl font-bold leading-tight">Sag uns, was los ist</h2>
                            <p className="mt-3 text-sm leading-relaxed text-secondary-content/70">
                                Bugs, Ideen oder Fragen, schreib uns. Wir melden uns so schnell wie möglich.
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-soft-lg md:p-9">
                    <h1 className="text-3xl font-bold tracking-tight">Kontaktformular</h1>
                    <p className="mt-1 text-base-content/70">Wir freuen uns über deine Nachricht.</p>

                    {gesendet && (
                        <div className="alert alert-success mt-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Danke für deine Nachricht. Wir melden uns bald bei dir.</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="alert alert-error mt-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                            </svg>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-base-content/80">Wie heisst du?</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0" /></svg>
                                    </span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="afield"
                                        style={{ paddingLeft: "2.75rem" }}
                                        placeholder="Dein Name"
                                        autoComplete="name"
                                        maxLength={80}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-base-content/80">Deine E-Mail</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" /></svg>
                                    </span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="afield"
                                        style={{ paddingLeft: "2.75rem" }}
                                        placeholder="du@beispiel.ch"
                                        autoComplete="email"
                                        maxLength={120}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-base-content/80">Worum geht es?</label>
                            <select
                                name="grund"
                                value={formData.grund}
                                onChange={handleChange}
                                className="afield"
                                required
                            >
                                <option value="feature">Ich habe eine Idee für ein neues Feature</option>
                                <option value="bug">Ich habe einen Bug gefunden</option>
                                <option value="hilfe">Ich brauche Hilfe bei einem Problem</option>
                                <option value="sonstiges">Etwas anderes</option>
                            </select>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-sm font-semibold text-base-content/80">Deine Nachricht</label>
                                <span className="text-xs text-base-content/45">{formData.nachricht.length}/1200</span>
                            </div>
                            <textarea
                                name="nachricht"
                                value={formData.nachricht}
                                onChange={handleChange}
                                className="afield"
                                style={{ minHeight: "9rem", resize: "vertical" }}
                                placeholder="Beschreib kurz dein Anliegen..."
                                minLength={10}
                                maxLength={1200}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Wird gesendet...
                                </>
                            ) : (
                                "Nachricht senden"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
