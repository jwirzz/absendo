import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";
import EncryptionService from "../services/encryptionService.ts";
import { useUserProfile } from "../contexts/useUserProfile.ts";
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
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<"date" | "reason">("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

                const decryptedPdf: PdfFile = {
                    ...pdf,
                    file_path: file_path ?? "",
                    date_of_absence: date_of_absence ?? "",
                    reason: reason ?? "",
                    pdf_name: pdf_name ?? "",
                };
                try {
                    await encryptionService.migratePdfMetadataIfNeeded(pdf, decryptedPdf, user.id);
                } catch (migrationError) {
                    console.error("Could not migrate PDF metadata:", migrationError);
                }
                return decryptedPdf;
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

    const handleFullNameToggle = async (value: boolean) => {
        await updateSetting("isFullNameEnabled", value);
    };

    const handleFullSubjectToggle = async (value: boolean) => {
        await updateSetting("isFullSubjectEnabled", value);
    };

    const handleDoNotSaveToggle = async (value: boolean) => {
        await updateSetting("isDoNotSaveEnabled", value);
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

    const filteredPdfs = useMemo(() => {
        const arr = pdfs.filter((p) => !query
            || p.reason.toLowerCase().includes(query.toLowerCase())
            || p.pdf_name.toLowerCase().includes(query.toLowerCase())
            || p.date_of_absence.includes(query));
        const dir = sortDir === "asc" ? 1 : -1;
        return [...arr].sort((a, b) => {
            if (sortKey === "reason") return a.reason.localeCompare(b.reason) * dir;
            return (new Date(a.date_of_absence).getTime() - new Date(b.date_of_absence).getTime()) * dir;
        });
    }, [pdfs, query, sortKey, sortDir]);

    const toggleSort = (k: "date" | "reason") => {
        if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(k); setSortDir("desc"); }
    };

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
        return <div className="text-center text-error mt-10">Benutzerdaten konnten nicht geladen werden: {profileError}</div>;
    }

    if (!userData) {
        return <div className="text-center text-error mt-10">Benutzerdaten konnten nicht geladen werden.</div>;
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
        const wasLegacy = await encryptionService.isLegacyEncryptedBlob(data);
        const decryptedPdf = await encryptionService.decryptBlob(data, user.id);

        if (wasLegacy) {
            void encryptionService.encryptBlob(decryptedPdf, user.id)
                .then((migratedPdf) => supabase.storage
                    .from("pdf-files")
                    .upload(pdf.file_path, migratedPdf, { upsert: true, contentType: "application/octet-stream" }))
                .then(({ error: migrationError }) => {
                    if (migrationError) console.error("PDF encryption migration failed:", migrationError);
                })
                .catch((migrationError: unknown) => {
                    console.error("PDF encryption migration failed:", migrationError);
                });
        }

        return decryptedPdf;
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
        const { error: databaseError } = await supabase
            .from("pdf_files")
            .delete()
            .eq("id", pdf.id);

        if (databaseError) {
            console.error("Fehler beim Löschen der PDF-Metadaten:", databaseError);
            return;
        }

        setPdfs((previousPdfs) => previousPdfs.filter((existingPdf) => existingPdf.id !== pdf.id));
        const { error: storageError } = await supabase.storage
            .from("pdf-files")
            .remove([pdf.file_path]);
        if (storageError) console.error("Verwaiste PDF-Datei konnte nicht entfernt werden:", storageError);
    }

    function formatDate(dateString: string) {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("de-CH");
    }

    const totalAbsences = userData.total_absences || 0;
    const minutes = userData.time_saved_minutes || 0;
    const timeSaved = minutes >= 60 ? `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` : `${minutes} Min.`;
    const latest = pdfs[0];

    return (
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-6">
            {/* Stat-Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard color="#FF6B35" bg="#FFE4D6" label="Generierte Absenzen" sub="Seit Kontoerstellung"
                    value={String(totalAbsences)}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="m10 3 7 4-7 4-7-4 7-4ZM3 11l7 4 7-4M3 15l7 4 7-4" />} />
                <StatCard color="#7c63e6" bg="#EDE7FF" label="Zeit gespart" sub="≈ 5 Min. pro Absenz"
                    value={timeSaved}
                    icon={<><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></>} />
                <StatCard color="#2f9c77" bg="#D9F3E8" label="Letzte Absenz" sub={latest?.reason || "Noch keine"}
                    value={<span className="text-2xl">{latest ? formatDate(latest.date_of_absence) : "—"}</span>}
                    icon={<><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M8 3v4M16 3v4" /></>} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                {/* Tabelle */}
                <div className="card overflow-hidden bg-base-100 shadow-soft-sm ring-1 ring-base-300/70">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-bold">Deine Absenzen</h2>
                            <span className="pill px-2 py-0.5 text-xs">{filteredPdfs.length}</span>
                        </div>
                        {pdfs.length > 0 && (
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen…"
                                    className="w-48 rounded-full border border-base-300 bg-base-100 py-2 pl-9 pr-3 text-sm outline-none transition-shadow focus:border-secondary focus:ring-2 focus:ring-primary/20" />
                            </div>
                        )}
                    </div>

                    {pdfs.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-base-content/60">Noch keine Absenzen. Erstelle deine erste mit „Neue Absenz".</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-base-300 text-left font-mono text-[11px] uppercase tracking-wider text-base-content/40">
                                        <SortTh label="Datum" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
                                        <SortTh label="Grund" active={sortKey === "reason"} dir={sortDir} onClick={() => toggleSort("reason")} />
                                        <th className="px-5 py-3 font-semibold">Formular</th>
                                        <th className="px-5 py-3 font-semibold">Erstellt</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPdfs.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-12 text-center text-base-content/40">Nichts gefunden.</td></tr>
                                    )}
                                    {filteredPdfs.map((pdf) => (
                                        <tr key={pdf.id} className="border-b border-base-200 transition-colors last:border-0 hover:bg-base-200/50">
                                            <td className="px-5 py-3.5 font-medium">{formatDate(pdf.date_of_absence)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-2.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#7FD8B8]" />
                                                    {pdf.reason}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <a
                                                    href="#"
                                                    onClick={async (event) => {
                                                        event.preventDefault();
                                                        const pdfBlob = await getPdf(pdf);
                                                        if (pdfBlob) viewPdf(pdfBlob);
                                                    }}
                                                    className="font-medium text-primary underline-offset-2 hover:underline"
                                                >
                                                    {pdf.pdf_name}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3.5 text-base-content/50">{formatDate(pdf.created_at)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={async (event) => {
                                                            event.preventDefault();
                                                            const pdfBlob = await getPdf(pdf);
                                                            if (pdfBlob) downloadPDF(pdfBlob, pdf);
                                                        }}
                                                        title="PDF herunterladen"
                                                        className="inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-semibold shadow-soft-sm transition-transform hover:bg-base-200 active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
                                                        PDF
                                                    </button>
                                                    <button
                                                        onClick={async (event) => {
                                                            event.preventDefault();
                                                            if (confirm("Bist du sicher, dass du diese Absenz löschen möchtest?")) {
                                                                await deletePdf(pdf);
                                                            }
                                                        }}
                                                        aria-label="Löschen"
                                                        title="PDF löschen"
                                                        className="grid h-[30px] w-[30px] place-items-center rounded-full text-base-content/50 transition-colors hover:bg-error/10 hover:text-error active:scale-90"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-center border-t border-base-300 px-5 py-3">
                                <a className="text-sm font-semibold text-base-content/60 hover:text-base-content" href="/absences">Alle Absenzen anzeigen →</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* rechte Spalte */}
                <div className="flex flex-col gap-5">
                    <div className="card bg-base-100 p-5 shadow-soft-sm ring-1 ring-base-300/70">
                        <h3 className="mb-4 text-base font-bold">Schnell-Einstellungen</h3>
                        <div className="flex flex-col gap-4">
                            <SettingRow label="Lehrpersonen ausschreiben" desc="Vollständige Namen statt Kürzel" on={isFullNameEnabled} disabled={settingsLoading} onChange={handleFullNameToggle} />
                            <SettingRow label="Fächer ausschreiben" desc="Module bleiben abgekürzt" on={isFullSubjectEnabled} disabled={settingsLoading} onChange={handleFullSubjectToggle} />
                            <SettingRow label="Lokaler Modus" desc="Absenz nicht auf Absendo speichern" on={isDoNotSaveEnabled} disabled={settingsLoading} onChange={handleDoNotSaveToggle} />
                        </div>
                        <a href="/profile" className="btn btn-ghost btn-sm mt-5">Zu deinem Profil</a>
                    </div>

                    {pdfs.length > 0 && (
                        <div className="card bg-base-100 p-5 shadow-soft-sm ring-1 ring-base-300/70">
                            <h3 className="mb-4 text-base font-bold">Aktivität</h3>
                            <div className="flex flex-col gap-3.5">
                                {pdfs.slice(0, 4).map((pdf, i) => (
                                    <div key={pdf.id} className="flex gap-3">
                                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ["#FF6B35", "#B8A7FF", "#7FD8B8", "#FFD466"][i % 4] }} />
                                        <div className="flex-1">
                                            <div className="text-[13px] font-medium">PDF erstellt</div>
                                            <div className="truncate text-xs text-base-content/50">{pdf.reason}</div>
                                        </div>
                                        <div className="text-[11px] text-base-content/40">{relTime(pdf.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* --- Sub-Komponenten --- */

function StatCard({ color, bg, label, sub, value, icon }: { color: string; bg: string; label: string; sub: string; value: ReactNode; icon: ReactNode }) {
    return (
        <div className="card bg-base-100 p-5 shadow-soft-sm ring-1 ring-base-300/70">
            <div className="mb-4 icon-tile" style={{ background: bg, color }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">{icon}</svg>
            </div>
            <div className="font-mono text-3xl font-bold tabular-nums tracking-tight">{value}</div>
            <div className="mt-2 text-[13px] font-semibold">{label}</div>
            <div className="mt-0.5 truncate text-xs text-base-content/50">{sub}</div>
        </div>
    );
}

function SortTh({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
    return (
        <th className="cursor-pointer select-none px-5 py-3 font-semibold transition-colors hover:text-base-content" onClick={onClick}>
            <span className={["inline-flex items-center gap-1.5", active ? "text-base-content" : ""].join(" ")}>
                {label}
                <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.35, transform: active && dir === "asc" ? "scaleY(-1)" : undefined }}>
                    <path d="M6 4v12M3 13l3 3 3-3" />
                </svg>
            </span>
        </th>
    );
}

function SettingRow({ label, desc, on, disabled, onChange }: { label: string; desc: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
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

function relTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) return "heute";
    if (days === 1) return "gestern";
    if (days < 7) return `vor ${days} T.`;
    return `vor ${Math.floor(days / 7)} W.`;
}

export default DashboardContent;
