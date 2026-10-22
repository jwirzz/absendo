import { useEffect, useState, type ReactNode } from 'react';
import {supabase} from "../supabaseClient.ts";
import {User} from "@supabase/supabase-js";
import AuthWrapper from "../components/AuthWrapper.tsx";
import EncryptionService from "../services/encryptionService.ts";

interface FormData {
    id: string;
    first_name: string;
    last_name: string;
    birthday: string;
    calendar_url: string;
    first_name_trainer: string;
    last_name_trainer: string;
    phone_number_trainer: string;
    email_trainer: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    birthday?: string;
    calendar_url?: string;
    first_name_trainer?: string;
    last_name_trainer?: string;
    phone_number_trainer?: string;
    email_trainer?: string;
}


export default function AbsendoOnboarding() {

    const [user, setUser] = useState<User | null>(null);
    const [hasUserCompletedOnboarding, setHasUserCompletedOnboarding] = useState<boolean>(false);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                try {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();

                    if (error) throw error;

                    if(data.onboarding_completed) {
                        setHasUserCompletedOnboarding(true);
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            }
        }
        fetchUser();
    }, []);

    useEffect(() => {
        if (user?.id) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                id: user.id
            }));
        }
    }, [user]);

    const [step, setStep] = useState<number>(1);
    const [formData, setFormData] = useState<FormData>({
        id: user?.id ?? '',
        first_name: '',
        last_name: '',
        birthday: '',
        calendar_url: '',
        first_name_trainer: '',
        last_name_trainer: '',
        phone_number_trainer: '',
        email_trainer: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [complete, setComplete] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const totalSteps = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name as keyof FormErrors]) {
            const newErrors = { ...errors };
            delete newErrors[name as keyof FormErrors];
            setErrors(newErrors);
        }
    };

    const validateStep = (stepNumber: number): boolean => {
        const newErrors: FormErrors = {};

        if (stepNumber === 1) {
            if (!formData.first_name.trim()) newErrors.first_name = 'Vorname ist erforderlich';
            if (!formData.last_name.trim()) newErrors.last_name = 'Nachname ist erforderlich';
            if (!formData.birthday) newErrors.birthday = 'Geburtsdatum ist erforderlich';
        } else if (stepNumber === 2) {
            if (!formData.calendar_url.trim()) newErrors.calendar_url = 'Kalender-URL ist erforderlich';
            if (formData.calendar_url && !formData.calendar_url.startsWith('http')) {
                newErrors.calendar_url = 'Gültige URL erforderlich (beginnt mit https://)';
            }
            if (formData.calendar_url && !formData.calendar_url.startsWith('https://schulnetz.lu.ch/bbzw')) {
                newErrors.calendar_url = 'Aktuell unterstützen wir nur Kalender-URLs des BBZW';
            }
        } else if (stepNumber === 3) {
            if (!formData.first_name_trainer.trim()) newErrors.first_name_trainer = 'Vorname des Ausbilders ist erforderlich';
            if (!formData.last_name_trainer.trim()) newErrors.last_name_trainer = 'Nachname des Ausbilders ist erforderlich';
            if (!formData.phone_number_trainer.trim()) newErrors.phone_number_trainer = 'Telefonnummer ist erforderlich';
            if (!formData.email_trainer.trim()) {
                newErrors.email_trainer = 'E-Mail ist erforderlich';
            } else if (!/\S+@\S+\.\S+/.test(formData.email_trainer)) {
                newErrors.email_trainer = 'Gültige E-Mail-Adresse erforderlich';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = async () => {
        if (validateStep(step)) {
            if (step < totalSteps) {
                setStep(step + 1);
            } else {
                await submitForm();
            }
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const submitForm = async () => {
        setLoading(true);
        setSubmitError(null);
        try {
            await insertFormData(formData);
            setComplete(true);
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            setSubmitError("Dein Profil konnte nicht gespeichert werden. Bitte versuche es erneut.");
        } finally {
            setLoading(false);
        }
    };

    async function insertFormData(formData: FormData) {
        const encryptionService = EncryptionService.getInstance();

        const dataToStore = await encryptionService.encryptProfileData({
            ...formData,
            onboarding_completed: true
        });

        const { error } = await supabase
            .from('profiles')
            .upsert(dataToStore, { onConflict: 'id' });

        if (error) throw error;
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-200/50 px-4 py-12">
            <div className="pointer-events-none absolute left-1/2 top-[-10rem] h-[32rem] w-[55rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
                style={{ background: "radial-gradient(closest-side, rgba(255,107,53,0.16), transparent)" }} />
            {hasUserCompletedOnboarding ? (
                <div className="card relative w-full max-w-md bg-base-100 p-8 text-center shadow-soft-xl" style={{ animation: "heroIn 0.3s var(--ease-out) both" }}>
                    <div className="icon-tile mx-auto mb-4 h-12 w-12 bg-success/15 text-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                    </div>
                    <h1 className="display-md">Schon erledigt</h1>
                    <p className="mt-3 text-base-content/70">Dein Onboarding ist abgeschlossen. Du kannst direkt loslegen.</p>
                    <a href="/dashboard" className="btn btn-primary mt-6">Zum Dashboard</a>
                </div>
            ) : (
                user ? (
                    <AuthWrapper user={user}>
                        <OnboardingContent
                            user={user}
                            step={step}
                            setStep={setStep}
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            setErrors={setErrors}
                            loading={loading}
                            complete={complete}
                            submitError={submitError}
                            totalSteps={totalSteps}
                            handleChange={handleChange}
                            validateStep={validateStep}
                            nextStep={nextStep}
                            prevStep={prevStep}
                            submitForm={submitForm}
                        />
                    </AuthWrapper>
                ) : (
                    <div className="card relative w-full max-w-md bg-base-100 p-8 text-center shadow-soft-xl" style={{ animation: "heroIn 0.3s var(--ease-out) both" }}>
                        <h1 className="display-md">Bitte melde dich an</h1>
                        <p className="mt-3 text-base-content/70">Du musst angemeldet sein, um das Onboarding zu starten.</p>
                        <a href="/login" className="btn btn-primary mt-6">Zur Anmeldung</a>
                    </div>
                )
            )}
        </div>
    );
}

// Separate the onboarding content into its own component
interface OnboardingContentProps {
    user: User;
    step: number;
    setStep: (step: number) => void;
    formData: FormData;
    setFormData: (data: FormData) => void;
    errors: FormErrors;
    setErrors: (errors: FormErrors) => void;
    loading: boolean;
    complete: boolean;
    submitError: string | null;
    totalSteps: number;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validateStep: (stepNumber: number) => boolean;
    nextStep: () => Promise<void>;
    prevStep: () => void;
    submitForm: () => void;
}

const STEP_LABELS = ["Persönlich", "Kalender", "Ausbilder"];

const OnboardingContent: React.FC<OnboardingContentProps> = ({
                                                                 step,
                                                                 formData,
                                                                 errors,
                                                                 loading,
                                                                 complete,
                                                                 submitError,
                                                                 totalSteps,
                                                                 handleChange,
                                                                 nextStep,
                                                                 prevStep
                                                             }) => {
    const idx = step - 1;
    return (
        <div className="card relative w-full max-w-xl bg-base-100 p-8 shadow-soft-xl" style={{ animation: "heroIn 0.35s var(--ease-out) both" }}>
            {/* Header */}
            <div className="mb-7 flex flex-col items-center text-center">
                <div className="mb-3 inline-flex items-center gap-2">
                    <img src="/logo.png" alt="Absendo Logo" className="h-8 w-8" />
                    <span className="text-xl font-bold tracking-tight">Absendo</span>
                </div>
                <p className="text-sm text-base-content/60">Kurz einrichten, danach erstellst du Absenzen in Sekunden.</p>
            </div>

            {/* Schrittanzeige */}
            {!complete && (
                <div className="mb-8 flex items-center">
                    {STEP_LABELS.map((lbl, i) => (
                        <div key={lbl} className={i < 2 ? "flex flex-1 items-center" : "flex items-center"}>
                            <div className="flex items-center gap-2">
                                <div className={["grid h-8 w-8 place-items-center rounded-full border text-[13px] font-bold transition-colors", i === idx ? "border-secondary bg-secondary text-secondary-content" : i < idx ? "border-secondary text-secondary" : "border-base-300 text-base-content/40"].join(" ")}>
                                    {i < idx ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg> : i + 1}
                                </div>
                                <span className={["hidden text-[13px] font-medium sm:inline", i <= idx ? "" : "text-base-content/40"].join(" ")}>{lbl}</span>
                            </div>
                            {i < 2 && <div className="mx-2.5 h-0.5 flex-1 rounded-full" style={{ background: i < idx ? "var(--color-secondary)" : "var(--color-base-300)" }} />}
                        </div>
                    ))}
                </div>
            )}

            {complete ? (
                <div className="py-8 text-center" style={{ animation: "fadeFaq 0.3s var(--ease-out) both" }}>
                    <div className="icon-tile mx-auto mb-5 h-16 w-16 bg-success/15 text-success" style={{ animation: "demoCheckPop 0.35s var(--ease-out)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-8 w-8"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                    </div>
                    <h2 className="display-md">Alles bereit 🎉</h2>
                    <p className="measure mx-auto mt-3 text-base-content/70">Dein Profil ist eingerichtet. Absendo kann loslegen.</p>
                    <button className="btn btn-primary mt-6" onClick={() => window.location.href = '/dashboard'}>
                        Zum Dashboard
                    </button>
                </div>
            ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                    {submitError && (
                        <div className="alert alert-error mb-5" role="alert">
                            {submitError}
                        </div>
                    )}
                    <div key={step} style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                        {step === 1 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold">Deine persönlichen Daten</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <OField label="Vorname" error={errors.first_name}>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Dein Vorname"
                                            className={`afield ${errors.first_name ? "afield-error" : ""}`} />
                                    </OField>
                                    <OField label="Nachname" error={errors.last_name}>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Dein Nachname"
                                            className={`afield ${errors.last_name ? "afield-error" : ""}`} />
                                    </OField>
                                </div>
                                <OField label="Geburtsdatum" error={errors.birthday}>
                                    <input type="date" name="birthday" value={formData.birthday} onChange={handleChange}
                                        className={`afield ${errors.birthday ? "afield-error" : ""}`} />
                                </OField>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold">Stundenplan verbinden</h2>
                                <OField label="SchulNetz Kalender-URL" error={errors.calendar_url}>
                                    <input type="url" name="calendar_url" value={formData.calendar_url} onChange={handleChange}
                                        placeholder="https://schulnetz.lu.ch/bbzw/..."
                                        className={`afield ${errors.calendar_url ? "afield-error" : ""}`} />
                                </OField>

                                <div className="rounded-2xl bg-info/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="mt-0.5 h-5 w-5 flex-shrink-0 text-info">
                                            <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5M12 8h.01" />
                                        </svg>
                                        <div>
                                            <h3 className="text-sm font-semibold">So findest du deine Kalender-URL</h3>
                                            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-base-content/70">
                                                <li>Im SchulNetz anmelden</li>
                                                <li>Ganz nach unten scrollen, Kalender-Abo aktivieren</li>
                                                <li>Kalender-Link per E-Mail anfordern</li>
                                                <li>Die URL kommt an deine SLUZ-E-Mail</li>
                                                <li>URL kopieren und hier einfügen</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold">Ausbilder·in im Lehrbetrieb</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <OField label="Vorname" error={errors.first_name_trainer}>
                                        <input type="text" name="first_name_trainer" value={formData.first_name_trainer} onChange={handleChange} placeholder="Vorname"
                                            className={`afield ${errors.first_name_trainer ? "afield-error" : ""}`} />
                                    </OField>
                                    <OField label="Nachname" error={errors.last_name_trainer}>
                                        <input type="text" name="last_name_trainer" value={formData.last_name_trainer} onChange={handleChange} placeholder="Nachname"
                                            className={`afield ${errors.last_name_trainer ? "afield-error" : ""}`} />
                                    </OField>
                                </div>
                                <OField label="Telefon" error={errors.phone_number_trainer}>
                                    <input type="tel" name="phone_number_trainer" value={formData.phone_number_trainer} onChange={handleChange} placeholder="+41 79 123 45 67"
                                        className={`afield ${errors.phone_number_trainer ? "afield-error" : ""}`} />
                                </OField>
                                <OField label="E-Mail" error={errors.email_trainer}>
                                    <input type="email" name="email_trainer" value={formData.email_trainer} onChange={handleChange} placeholder="ausbilder@beispiel.com"
                                        className={`afield ${errors.email_trainer ? "afield-error" : ""}`} />
                                </OField>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <button type="button" onClick={prevStep} className="btn btn-ghost gap-1.5 disabled:opacity-40" disabled={step === 1}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Zurück
                        </button>
                        <button type="button" onClick={nextStep} className="btn btn-primary gap-1.5" disabled={loading}>
                            {loading ? (
                                <><span className="loading loading-spinner loading-sm" /> Wird gespeichert…</>
                            ) : step === totalSteps ? (
                                <>Fertigstellen <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg></>
                            ) : (
                                <>Weiter <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg></>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

function OField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div className="w-full">
            <span className="mb-2 block text-xs font-semibold text-base-content/60">{label}</span>
            {children}
            {error && <span className="mt-1.5 block text-xs text-error">{error}</span>}
        </div>
    );
}
