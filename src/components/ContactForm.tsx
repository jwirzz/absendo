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
            const { error } = await supabase
                .from("feedback")
                .insert([
                    {
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        grund: formData.grund,
                        nachricht: formData.nachricht.trim()
                    }
                ]);

            if (error) {
                throw error;
            }

            trackEvent("contact_submit_success", { grund: formData.grund });
            setGesendet(true);
            setFormData(INITIAL_DATA);
        } catch (error) {
            console.error("Fehler beim Senden an Supabase:", error);
            trackEvent("contact_submit_error", { grund: formData.grund });
            setErrorMessage("Senden hat nicht geklappt. Bitte versuch es nochmal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="px-4 py-12 md:py-16">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="card border border-base-300 bg-base-200 shadow-sm">
                    <div className="card-body gap-4">
                        <h2 className="text-3xl font-bold">Kontakt</h2>
                        <p className="text-base-content/80">
                            Schreib uns bei Bugs, Ideen oder wenn du Hilfe brauchst. Wir melden uns so schnell wie möglich.
                        </p>
                        <div className="space-y-3 text-sm text-base-content/75">
                            <p>Antwortzeit: meist innerhalb von 1 bis 2 Werktagen</p>
                            <p>E-Mail: contact@absendo.app</p>
                        </div>
                    </div>
                </aside>

                <div className="card border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body p-6 md:p-8">
                        <h3 className="mb-2 text-2xl font-bold">Kontaktformular</h3>

                        {gesendet && (
                            <div className="alert alert-success mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Danke für deine Nachricht. Wir melden uns bald bei dir.</span>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="alert alert-error mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Wie heisst du?</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input input-bordered w-full"
                                        autoComplete="name"
                                        maxLength={80}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text">Deine E-Mail</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input input-bordered w-full"
                                        autoComplete="email"
                                        maxLength={120}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Worum geht es?</span>
                                </label>
                                <select
                                    name="grund"
                                    value={formData.grund}
                                    onChange={handleChange}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="feature">Ich habe eine Idee für ein neues Feature</option>
                                    <option value="bug">Ich habe einen Bug gefunden</option>
                                    <option value="hilfe">Ich brauche Hilfe bei einem Problem</option>
                                    <option value="sonstiges">Etwas anderes</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Deine Nachricht</span>
                                    <span className="label-text-alt">{formData.nachricht.length}/1200</span>
                                </label>
                                <textarea
                                    name="nachricht"
                                    value={formData.nachricht}
                                    onChange={handleChange}
                                    className="textarea textarea-bordered h-36 w-full"
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
            </div>
        </section>
    );
}
