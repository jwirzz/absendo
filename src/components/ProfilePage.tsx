import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient.ts";
import EncryptionService from "../services/encryptionService.ts";
import { useUserProfile } from "../contexts/UserProfileContext.tsx";
import { UserProfile } from "../types/userProfile.ts";

export const ProfilePage = () => {
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

    const { user, profile, loading: profileLoading, refreshProfile, updateProfileFields } = useUserProfile();
    const [absencesLoading, setAbsencesLoading] = useState(true);
    const [totalAbsences, setTotalAbsences] = useState(0);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        id: "",
        first_name: "",
        last_name: "",
        birthday: "",
        calendar_url: "",
        first_name_trainer: "",
        last_name_trainer: "",
        phone_number_trainer: "",
        email_trainer: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        async function fetchAbsenceCount() {
            if (!user) {
                setTotalAbsences(0);
                setAbsencesLoading(false);
                return;
            }

            setAbsencesLoading(true);
            try {
                const { data, error } = await supabase
                    .from("pdf_files")
                    .select("id")
                    .eq("user_id", user.id);

                if (error) throw error;
                setTotalAbsences(data?.length || 0);
            } catch (fetchError) {
                console.error("Error fetching absences:", fetchError);
                setTotalAbsences(0);
            } finally {
                setAbsencesLoading(false);
            }
        }

        void fetchAbsenceCount();
    }, [user]);

    useEffect(() => {
        if (!profile || !user) return;

        setFormData({
            id: user.id,
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            birthday: profile.birthday || "",
            calendar_url: profile.calendar_url || "",
            first_name_trainer: profile.first_name_trainer || "",
            last_name_trainer: profile.last_name_trainer || "",
            phone_number_trainer: profile.phone_number_trainer || "",
            email_trainer: profile.email_trainer || "",
        });
    }, [profile, user]);

    const displayData = useMemo<UserProfile | null>(() => {
        if (!profile) return null;
        return {
            ...profile,
            total_absences: totalAbsences,
            time_saved_minutes: totalAbsences * 5,
        };
    }, [profile, totalAbsences]);

    function getUserShortName() {
        if (!displayData) return "NN";
        const first = displayData.first_name?.charAt(0).toUpperCase() || "";
        const last = displayData.last_name?.charAt(0).toUpperCase() || "";
        return `${first}${last}`;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name as keyof FormErrors]) {
            const newErrors = { ...errors };
            delete newErrors[name as keyof FormErrors];
            setErrors(newErrors);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.first_name.trim()) newErrors.first_name = "Vorname ist erforderlich";
        if (!formData.last_name.trim()) newErrors.last_name = "Nachname ist erforderlich";
        if (!formData.birthday) newErrors.birthday = "Geburtsdatum ist erforderlich";

        if (!formData.calendar_url.trim()) {
            newErrors.calendar_url = "Kalender-URL ist erforderlich";
        } else if (!formData.calendar_url.startsWith("http")) {
            newErrors.calendar_url = "Gültige URL erforderlich (beginnt mit https://)";
        } else if (!formData.calendar_url.startsWith("https://schulnetz.lu.ch/bbzw")) {
            newErrors.calendar_url = "Aktuell unterstützen wir nur Kalender-URLs des BBZW";
        }

        if (!formData.first_name_trainer.trim()) newErrors.first_name_trainer = "Vorname des Ausbilders ist erforderlich";
        if (!formData.last_name_trainer.trim()) newErrors.last_name_trainer = "Nachname des Ausbilders ist erforderlich";
        if (!formData.phone_number_trainer.trim()) newErrors.phone_number_trainer = "Telefonnummer ist erforderlich";
        if (!formData.email_trainer.trim()) {
            newErrors.email_trainer = "E-Mail ist erforderlich";
        } else if (!/\S+@\S+\.\S+/.test(formData.email_trainer)) {
            newErrors.email_trainer = "Gültige E-Mail-Adresse erforderlich";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!user) {
            return;
        }

        setIsSubmitting(true);
        try {
            const encryptionService = EncryptionService.getInstance();

            const dataToStore = await encryptionService.encryptProfileData({
                id: formData.id || user.id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                birthday: formData.birthday,
                calendar_url: formData.calendar_url,
                first_name_trainer: formData.first_name_trainer,
                last_name_trainer: formData.last_name_trainer,
                phone_number_trainer: formData.phone_number_trainer,
                email_trainer: formData.email_trainer,
            });

            const { error } = await supabase
                .from("profiles")
                .upsert(dataToStore);

            if (error) throw error;
            await refreshProfile();
            setSubmitSuccess(true);

            setTimeout(() => {
                setSubmitSuccess(false);
            }, 3000);
        } catch (submitError) {
            console.error("Error updating profile:", submitError);
        } finally {
            setIsSubmitting(false);
        }
    };

    async function updateSetting(field: "isFullNameEnabled" | "isFullSubjectEnabled" | "isDoNotSaveEnabled", value: boolean) {
        setSettingsLoading(true);
        try {
            await updateProfileFields({ [field]: value } as Partial<UserProfile>);
        } catch (settingError) {
            console.error(`Error updating ${field}:`, settingError);
        } finally {
            setSettingsLoading(false);
        }
    }

    const isLoading = profileLoading || absencesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!displayData) {
        return <div className="text-center text-red-500 mt-10">Benutzerdaten konnten nicht geladen werden.</div>;
    }

    const minutes = displayData.time_saved_minutes || 0;
    const timeSaved = minutes >= 60 ? `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` : `${minutes} Min.`;
    const isFullNameEnabled = profile?.isFullNameEnabled ?? false;
    const isFullSubjectEnabled = profile?.isFullSubjectEnabled ?? false;
    const isDoNotSaveEnabled = profile?.isDoNotSaveEnabled ?? false;

    return (
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
            {/* Kopf */}
            <div className="mb-8 flex flex-wrap items-center gap-5">
                <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-secondary text-2xl font-bold text-secondary-content">
                    {getUserShortName()}
                </div>
                <div className="flex-1">
                    <h1 className="display-md">{displayData.first_name} {displayData.last_name}</h1>
                    <div className="mt-1 text-sm text-base-content/60">{displayData.birthday || "Profil vervollständigen"}</div>
                </div>
                <div className="flex gap-6">
                    <div>
                        <div className="font-mono text-2xl font-bold tabular-nums text-primary">{displayData.total_absences || 0}</div>
                        <div className="text-xs text-base-content/50">Absenzen</div>
                    </div>
                    <div>
                        <div className="font-mono text-2xl font-bold tabular-nums">{timeSaved}</div>
                        <div className="text-xs text-base-content/50">gespart</div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Persönlich */}
                <section className="card bg-base-100 p-7 shadow-soft-sm ring-1 ring-base-300/70">
                    <h2 className="mb-5 text-lg font-bold">Persönlich</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Vorname" error={errors.first_name}>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Dein Vorname"
                                className={`afield ${errors.first_name ? "afield-error" : ""}`} />
                        </Field>
                        <Field label="Nachname" error={errors.last_name}>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Dein Nachname"
                                className={`afield ${errors.last_name ? "afield-error" : ""}`} />
                        </Field>
                        <Field label="Geburtsdatum" error={errors.birthday}>
                            <input type="date" name="birthday" value={formData.birthday} onChange={handleChange}
                                className={`afield ${errors.birthday ? "afield-error" : ""}`} />
                        </Field>
                    </div>
                </section>

                {/* Schule & Stundenplan (ohne Sync-Status) */}
                <section className="card bg-base-100 p-7 shadow-soft-sm ring-1 ring-base-300/70">
                    <h2 className="mb-5 text-lg font-bold">Schule & Stundenplan</h2>
                    <Field label="SchulNetz Kalender-URL" error={errors.calendar_url}
                        hint="Von dieser URL liest Absendo deinen Stundenplan. Im SchulNetz das Kalender-Abo anfordern und den Link hier einfügen.">
                        <input type="url" name="calendar_url" value={formData.calendar_url} onChange={handleChange}
                            placeholder="https://schulnetz.lu.ch/bbzw/..."
                            className={`afield ${errors.calendar_url ? "afield-error" : ""}`} />
                    </Field>
                </section>

                {/* Ausbilder */}
                <section className="card bg-base-100 p-7 shadow-soft-sm ring-1 ring-base-300/70">
                    <h2 className="mb-5 text-lg font-bold">Ausbilder·in im Lehrbetrieb</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Vorname" error={errors.first_name_trainer}>
                            <input type="text" name="first_name_trainer" value={formData.first_name_trainer} onChange={handleChange} placeholder="Vorname"
                                className={`afield ${errors.first_name_trainer ? "afield-error" : ""}`} />
                        </Field>
                        <Field label="Nachname" error={errors.last_name_trainer}>
                            <input type="text" name="last_name_trainer" value={formData.last_name_trainer} onChange={handleChange} placeholder="Nachname"
                                className={`afield ${errors.last_name_trainer ? "afield-error" : ""}`} />
                        </Field>
                        <Field label="Telefon" error={errors.phone_number_trainer}>
                            <input type="tel" name="phone_number_trainer" value={formData.phone_number_trainer} onChange={handleChange} placeholder="+41 79 123 45 67"
                                className={`afield ${errors.phone_number_trainer ? "afield-error" : ""}`} />
                        </Field>
                        <Field label="E-Mail" error={errors.email_trainer}>
                            <input type="email" name="email_trainer" value={formData.email_trainer} onChange={handleChange} placeholder="ausbilder@beispiel.com"
                                className={`afield ${errors.email_trainer ? "afield-error" : ""}`} />
                        </Field>
                    </div>
                </section>

                {/* PDF-Einstellungen (sofort gespeichert) */}
                <section className="card bg-base-100 p-7 shadow-soft-sm ring-1 ring-base-300/70">
                    <h2 className="mb-5 text-lg font-bold">PDF-Einstellungen</h2>
                    <div className="flex flex-col gap-4">
                        <ToggleRow label="Lehrpersonen ausschreiben" desc="Vollständige Namen statt Kürzel"
                            on={isFullNameEnabled} disabled={settingsLoading} onChange={(v) => void updateSetting("isFullNameEnabled", v)} />
                        <ToggleRow label="Fächer ausschreiben" desc="Module bleiben abgekürzt"
                            on={isFullSubjectEnabled} disabled={settingsLoading} onChange={(v) => void updateSetting("isFullSubjectEnabled", v)} />
                        <ToggleRow label="Lokaler Modus" desc="Absenz nicht auf Absendo speichern"
                            on={isDoNotSaveEnabled} disabled={settingsLoading} onChange={(v) => void updateSetting("isDoNotSaveEnabled", v)} />
                    </div>
                </section>

                {submitSuccess && (
                    <div className="flex items-center gap-2 rounded-2xl bg-success/15 px-4 py-3 text-sm font-medium text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                        Deine Daten wurden gespeichert.
                    </div>
                )}

                <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary gap-2" disabled={isSubmitting}>
                        {isSubmitting
                            ? <><span className="loading loading-spinner loading-sm" /> Speichern…</>
                            : "Änderungen speichern"}
                    </button>
                </div>
            </form>
        </div>
    );
};

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
    return (
        <div className="w-full">
            <span className="mb-2 block text-xs font-semibold text-base-content/60">{label}</span>
            {children}
            {hint && !error && <span className="mt-1.5 block text-xs text-base-content/45">{hint}</span>}
            {error && <span className="mt-1.5 block text-xs text-error">{error}</span>}
        </div>
    );
}

function ToggleRow({ label, desc, on, disabled, onChange }: { label: string; desc: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-start gap-3">
            <div className="flex-1">
                <div className="text-[13px] font-semibold">{label}</div>
                <div className="text-xs text-base-content/50">{desc}</div>
            </div>
            <input type="checkbox" className="toggle toggle-primary toggle-sm mt-0.5" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        </label>
    );
}
