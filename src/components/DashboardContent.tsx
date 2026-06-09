import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import EncryptionService from "../services/encryptionService.ts";
import { useUserProfile } from "../contexts/UserProfileContext.tsx";
import { UserProfile } from "../types/userProfile.ts";

interface PdfFile {
    id: string;
    user_id: string;
    file_path: string;
    created_at: string;
    date_of_absence: string;
    reason: string;
    pdf_name: string;
}

type SettingsField = "isFullNameEnabled" | "isFullSubjectEnabled" | "isDoNotSaveEnabled";

function DashboardContent() {
    const { user, profile, loading: profileLoading, error: profileError, updateProfileFields } = useUserProfile();
    const [loadingPdfs, setLoadingPdfs] = useState(true);
    const [pdfs, setPdfs] = useState<PdfFile[]>([]);
    const [settingsLoading, setSettingsLoading] = useState(false);

    const loadPdfs = useCallback(async () => {
        if (!user) {
            setPdfs([]);
            setLoadingPdfs(false);
            return;
        }

        setLoadingPdfs(true);
        try {
            const { data, error } = await supabase
                .from("pdf_files")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const encryptionService = EncryptionService.getInstance();
            const decryptedPdfs = await Promise.all((data || []).map(async (pdf) => {
                const [file_path, date_of_absence, reason, pdf_name] = await Promise.all([
                    encryptionService.decryptField(pdf.file_path, user.id),
                    encryptionService.decryptField(pdf.date_of_absence, user.id),
                    encryptionService.decryptField(pdf.reason, user.id),
                    encryptionService.decryptField(pdf.pdf_name, user.id),
                ]);

                return {
                    ...pdf,
                    file_path: file_path ?? "",
                    date_of_absence: date_of_absence ?? "",
                    reason: reason ?? "",
                    pdf_name: pdf_name ?? "",
                };
            }));
            setPdfs(decryptedPdfs);
        } catch (error) {
            console.error("Error fetching dashboard PDFs:", error);
        } finally {
            setLoadingPdfs(false);
        }
    }, [user]);

    useEffect(() => {
        void loadPdfs();
    }, [loadPdfs]);

    useEffect(() => {
        const handleDashboardRefresh = () => {
            void loadPdfs();
        };

        window.addEventListener("absendo:refresh-dashboard", handleDashboardRefresh);
        return () => {
            window.removeEventListener("absendo:refresh-dashboard", handleDashboardRefresh);
        };
    }, [loadPdfs]);

    async function updateSetting(field: SettingsField, value: boolean) {
        setSettingsLoading(true);
        try {
            await updateProfileFields({ [field]: value } as Partial<UserProfile>);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        } finally {
            setSettingsLoading(false);
        }
    }

    const handleFullNameToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await updateSetting("isFullNameEnabled", e.target.checked);
    };

    const handleFullSubjectToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await updateSetting("isFullSubjectEnabled", e.target.checked);
    };

    const handleDoNotSaveToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await updateSetting("isDoNotSaveEnabled", e.target.checked);
    };

    const userData = useMemo<UserProfile | null>(() => {
        if (!profile) return null;
        const totalAbsences = pdfs.length;
        return {
            ...profile,
            total_absences: totalAbsences,
            time_saved_minutes: totalAbsences * 5,
        };
    }, [profile, pdfs.length]);

    function getUserShortName() {
        if (!userData) return "NN";
        const first = userData.first_name?.charAt(0).toUpperCase() || "";
        const last = userData.last_name?.charAt(0).toUpperCase() || "";
        return `${first}${last}`;
    }

    const isLoading = profileLoading || loadingPdfs;
    const isFullNameEnabled = profile?.isFullNameEnabled ?? false;
    const isFullSubjectEnabled = profile?.isFullSubjectEnabled ?? false;
    const isDoNotSaveEnabled = profile?.isDoNotSaveEnabled ?? false;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (profileError) {
        return <div className="text-center text-red-500 mt-10">Benutzerdaten konnten nicht geladen werden: {profileError}</div>;
    }

    if (!userData) {
        return <div className="text-center text-red-500 mt-10">Benutzerdaten konnten nicht geladen werden.</div>;
    }

    async function getPdf(pdf: PdfFile) {
        const { data, error } = await supabase
            .storage
            .from("pdf-files")
            .download(pdf.file_path);

        if (error || !data || !user?.id) {
            console.error("Error downloading PDF:", error);
            return undefined;
        }

        const encryptionService = EncryptionService.getInstance();
        return encryptionService.decryptBlob(data as Blob, user.id);
    }

    function viewPdf(pdfBlob: Blob) {
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
    }

    function downloadPDF(pdfBlob: Blob, pdf: PdfFile) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = pdf.pdf_name;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function deletePdf(pdf: PdfFile) {
        const { error } = await supabase
            .storage
            .from("pdf-files")
            .remove([pdf.file_path]);

        const { status } = await supabase
            .from("pdf_files")
            .delete()
            .eq("id", pdf.id);

        if (!error && status === 204) {
            setPdfs((previousPdfs) => previousPdfs.filter((existingPdf) => existingPdf.id !== pdf.id));
        } else {
            console.error("Fehler beim Löschen der PDF:", error);
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("de-DE");
    }

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                    <div className="avatar">
                        <div className="w-24 rounded-full bg-primary text-primary-content grid place-items-center text-xl font-bold">
                            <div className="flex items-center justify-center w-full h-full">{getUserShortName()}</div>
                        </div>
                    </div>
                    <h2 className="card-title mt-4">{userData.first_name} {userData.last_name}</h2>
                    <p className="text-sm text-gray-500">{userData.birthday}</p>
                    <p className="text-sm text-gray-500">{userData.first_name_trainer} {userData.last_name_trainer}</p>
                    <div className="card-actions justify-center mt-4">
                        <a className="btn btn-sm btn-outline" href="/profile">Zu deinem Profil</a>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl lg:col-span-1">
                <div className="card-body">
                    <h2 className="card-title">Deine Statistik</h2>

                    <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
                        <div className="stat">
                            <div className="stat-title">Generierte Absenzen</div>
                            <div className="stat-value text-primary">{userData.total_absences || 0}</div>
                            <div className="stat-desc">Seit der Registrierung</div>
                        </div>

                        <div className="stat">
                            <div className="stat-title">Zeit gespart</div>
                            <div className="stat-value text-accent">
                                {userData.time_saved_minutes
                                    ? userData.time_saved_minutes >= 60
                                        ? `${Math.floor(userData.time_saved_minutes / 60)} Std. ${userData.time_saved_minutes % 60} Min.`
                                        : `${userData.time_saved_minutes} Min.`
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

            <div className="card bg-base-100 shadow-xl lg:col-span-1">
                <div className="card-body">
                    <h2 className="card-title mb-5">Absenz-Einstellungen</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={isFullNameEnabled}
                            onChange={handleFullNameToggle}
                            disabled={settingsLoading}
                            className="toggle"
                        />
                        <span>Statt Kürzeln werden die Namen der Lehrpersonen vollständig ausgeschrieben</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isFullSubjectEnabled}
                            onChange={handleFullSubjectToggle}
                            disabled={settingsLoading}
                            className="toggle"
                        />
                        <span>Fächer werden im Absenzformular ausgeschrieben statt abgekürzt dargestellt (Hinweis: Module werden weiterhin abgekürzt)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isDoNotSaveEnabled}
                            onChange={handleDoNotSaveToggle}
                            disabled={settingsLoading}
                            className="toggle"
                        />
                        <span>Absenz nicht speichern (nur lokal generieren)</span>
                    </div>
                    {settingsLoading && (
                        <div className="loading loading-spinner loading-sm">
                            <span>Einstellungen werden gespeichert...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl lg:col-span-3">
                <div className="card-body">
                    <h2 className="card-title mb-4">Letzte Absenzen</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Grund</th>
                                <th>Formular</th>
                                <th>Erstellt am</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pdfs.slice(0, 5).map((pdf) => (
                                <tr key={pdf.id}>
                                    <td>
                                        <span className="font-medium">
                                            {formatDate(pdf.date_of_absence)}
                                        </span>
                                    </td>
                                    <td>
                                        {pdf.reason}
                                    </td>
                                    <td>
                                        <a
                                            onClick={async (event) => {
                                                event.preventDefault();
                                                const pdfBlob = await getPdf(pdf);
                                                if (pdfBlob) viewPdf(pdfBlob);
                                            }}
                                            className="link link-primary hover:link-hover"
                                            href="#"
                                        >
                                            {pdf.pdf_name}
                                        </a>
                                    </td>
                                    <td className="text-sm text-gray-500">
                                        {formatDate(pdf.created_at)}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-xs btn-secondary"
                                                onClick={async (event) => {
                                                    event.preventDefault();
                                                    const pdfBlob = await getPdf(pdf);
                                                    if (pdfBlob) downloadPDF(pdfBlob, pdf);
                                                }}
                                                title="PDF herunterladen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                                Download
                                            </button>
                                            <button
                                                className="btn btn-xs btn-error"
                                                onClick={async (event) => {
                                                    event.preventDefault();
                                                    if (confirm("Bist du sicher, dass du diese Absenz löschen möchtest?")) {
                                                        await deletePdf(pdf);
                                                    }
                                                }}
                                                title="PDF löschen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                                Löschen
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {pdfs.length === 0 ? (
                        <div className="text-center mt-4">
                            <p className="text-gray-500">Keine Absenzen gefunden</p>
                        </div>
                    ) : (
                        <div className="card-actions justify-center mt-4">
                            <a className="btn btn-outline" href="/absences">Alle Absenzen anzeigen</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardContent;
