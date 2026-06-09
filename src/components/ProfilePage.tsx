import { useEffect, useMemo, useState } from "react";
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

    const { user, profile, loading: profileLoading, refreshProfile } = useUserProfile();
    const [absencesLoading, setAbsencesLoading] = useState(true);
    const [totalAbsences, setTotalAbsences] = useState(0);
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

    return (
        <div className="p-4 m-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center">
                        <div className="avatar">
                            <div className="w-24 rounded-full bg-primary text-primary-content grid place-items-center text-xl font-bold">
                                <div className="flex items-center justify-center w-full h-full">{getUserShortName()}</div>
                            </div>
                        </div>
                        <h2 className="card-title mt-4">{displayData.first_name} {displayData.last_name}</h2>
                        <p className="text-sm text-gray-500">{displayData.birthday}</p>
                        <p className="text-sm text-gray-500">Ausbilder: {displayData.first_name_trainer} {displayData.last_name_trainer}</p>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-xl font-bold ">Deine Statistik</h2>

                        <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
                            <div className="stat">
                                <div className="stat-title">Generierte Absenzen</div>
                                <div className="stat-value text-primary">{displayData.total_absences || 0}</div>
                                <div className="stat-desc">Seit der Registrierung</div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Zeit gespart</div>
                                <div className="stat-value text-accent">
                                    {displayData.time_saved_minutes
                                        ? displayData.time_saved_minutes >= 60
                                            ? `${Math.floor(displayData.time_saved_minutes / 60)} Std. ${displayData.time_saved_minutes % 60} Min.`
                                            : `${displayData.time_saved_minutes} Min.`
                                        : "0 Min."
                                    }
                                </div>
                                <div className="stat-desc">Mit Absendo vs. manuell</div>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-600">
                            <p>Mit Absendo sparst du dir durchschnittlich 5 Minuten pro Absenz</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-xl font-bold mb-6">Deine persönlichen Daten</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Vorname</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="Dein Vorname"
                                    className={`input input-bordered w-full ${errors.first_name ? "input-error" : ""}`}
                                />
                                {errors.first_name && <span className="text-error text-xs mt-1">{errors.first_name}</span>}
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Nachname</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Dein Nachname"
                                    className={`input input-bordered w-full ${errors.last_name ? "input-error" : ""}`}
                                />
                                {errors.last_name && <span className="text-error text-xs mt-1">{errors.last_name}</span>}
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Geburtsdatum</span>
                            </label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                                className={`input input-bordered w-full ${errors.birthday ? "input-error" : ""}`}
                            />
                            {errors.birthday && <span className="text-error text-xs mt-1">{errors.birthday}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-xl font-bold mb-6">Kalender-Einstellungen</h2>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Kalender-URL</span>
                                </label>
                                <input
                                    type="url"
                                    name="calendar_url"
                                    value={formData.calendar_url}
                                    onChange={handleChange}
                                    placeholder="https://schulnetz.lu.ch/bbzw/..."
                                    className={`input input-bordered w-full ${errors.calendar_url ? "input-error" : ""}`}
                                />
                                {errors.calendar_url && <span className="text-error text-xs mt-1">{errors.calendar_url}</span>}
                                <br />
                                <label className="label">
                                    <span className="label-text-alt text-gray-500">Dies ist die URL, von der Absendo deine Absenzen auslesen wird</span>
                                </label>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">So findest du deine Kalender-URL</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <ol className="list-decimal list-inside">
                                                <li>Melde dich im Schulnetz an</li>
                                                <li>Scrolle ganz nach unten und aktiviere dein Kalender-Abo</li>
                                                <li>Fordere den Kalender-Link per E-Mail an</li>
                                                <li>Die Kalender-URL wird an deine SLUZ-E-Mail gesendet</li>
                                                <li>Kopiere die URL und füge sie hier ein</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-xl font-bold mb-6">Ausbilder-Informationen</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text">Vorname des Ausbilders</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name_trainer"
                                        value={formData.first_name_trainer}
                                        onChange={handleChange}
                                        placeholder="Vorname"
                                        className={`input input-bordered w-full ${errors.first_name_trainer ? "input-error" : ""}`}
                                    />
                                    {errors.first_name_trainer && <span className="text-error text-xs mt-1">{errors.first_name_trainer}</span>}
                                </div>

                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text">Nachname des Ausbilders</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name_trainer"
                                        value={formData.last_name_trainer}
                                        onChange={handleChange}
                                        placeholder="Nachname"
                                        className={`input input-bordered w-full ${errors.last_name_trainer ? "input-error" : ""}`}
                                    />
                                    {errors.last_name_trainer && <span className="text-error text-xs mt-1">{errors.last_name_trainer}</span>}
                                </div>
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Telefonnummer des Ausbilders</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone_number_trainer"
                                    value={formData.phone_number_trainer}
                                    onChange={handleChange}
                                    placeholder="+41 79 123 45 67"
                                    className={`input input-bordered w-full ${errors.phone_number_trainer ? "input-error" : ""}`}
                                />
                                {errors.phone_number_trainer && <span className="text-error text-xs mt-1">{errors.phone_number_trainer}</span>}
                            </div>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">E-Mail des Ausbilders</span>
                                </label>
                                <input
                                    type="email"
                                    name="email_trainer"
                                    value={formData.email_trainer}
                                    onChange={handleChange}
                                    placeholder="ausbilder@beispiel.com"
                                    className={`input input-bordered w-full ${errors.email_trainer ? "input-error" : ""}`}
                                />
                                {errors.email_trainer && <span className="text-error text-xs mt-1">{errors.email_trainer}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {submitSuccess && (
                    <div className="alert alert-success">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Deine Daten wurden erfolgreich gespeichert!</span>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? <><span className="loading loading-spinner loading-sm"></span> Speichern...</>
                            : "Änderungen speichern"
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};
