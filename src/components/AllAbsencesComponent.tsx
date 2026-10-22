import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";
import EncryptionService from "../services/encryptionService.ts";

interface PdfFile {
    id: string;
    user_id: string;
    file_path: string;
    created_at: string;
    date_of_absence: string;
    reason: string;
    pdf_name: string;
}

function AllAbsencesComponent() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfs, setPdfs] = useState<PdfFile[]>([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        async function fetchUser() {
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();
                if (error) throw error;
                setUser(user);
            } catch (err) {
                console.error("Error fetching user:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

        useEffect(() => {
            async function fetchPdfs() {
                if (user) {
                    try {
                        const { data, error } = await supabase
                            .from("pdf_files")
                            .select("*")
                            .eq("user_id", user.id)
                            .order("created_at", { ascending: false });

                        if (error) throw error;
                        const encryptionService = EncryptionService.getInstance();
                        const decryptedPdfs: PdfFile[] = [];
                        for (const pdf of data || []) {
                            const file_path = await encryptionService.decryptField(pdf.file_path, user.id);
                            const date_of_absence = await encryptionService.decryptField(pdf.date_of_absence, user.id);
                            const reason = await encryptionService.decryptField(pdf.reason, user.id);
                            const pdf_name = await encryptionService.decryptField(pdf.pdf_name, user.id);
                            const decryptedPdf: PdfFile = {
                                ...pdf,
                                file_path: file_path ?? "",
                                date_of_absence: date_of_absence ?? "",
                                reason: reason ?? "",
                                pdf_name: pdf_name ?? "",
                            };
                            decryptedPdfs.push(decryptedPdf);
                            try {
                                await encryptionService.migratePdfMetadataIfNeeded(pdf, decryptedPdf, user.id);
                            } catch (migrationError) {
                                console.error("Could not migrate PDF metadata:", migrationError);
                            }
                        }
                        setPdfs(decryptedPdfs);
                    } catch (err) {
                        console.error("Error fetching PDFs:", err);
                    }
                }
            }
            fetchPdfs();
        }, [user]);

    async function getPdf(pdf: PdfFile) {
        const { data, error } = await supabase
            .storage
            .from('pdf-files')
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
        window.open(url, '_blank');
    }

    function downloadPDF(pdfBlob: Blob, pdf: PdfFile) {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = pdf.pdf_name;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            console.error('PDF Blob is null. Cannot download the file.');
        }
    }

    async function deletePdf(pdf: PdfFile) {
        const { error: databaseError } = await supabase
            .from('pdf_files')
            .delete()
            .eq('id', pdf.id);

        if (databaseError) {
            console.error("Fehler beim Löschen der PDF-Metadaten:", databaseError);
            return;
        }

        setPdfs((prev) => prev.filter((p) => p.id !== pdf.id));
        const { error: storageError } = await supabase.storage
            .from('pdf-files')
            .remove([pdf.file_path]);
        if (storageError) console.error("Verwaiste PDF-Datei konnte nicht entfernt werden:", storageError);
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    const q = query.trim().toLowerCase();
    const filtered = q
        ? pdfs.filter(
              (p) =>
                  p.reason.toLowerCase().includes(q) ||
                  p.pdf_name.toLowerCase().includes(q) ||
                  formatDate(p.date_of_absence).includes(q),
          )
        : pdfs;

    return (
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
            <div className="mb-6 flex items-center gap-4">
                <a
                    href="/dashboard"
                    aria-label="Zurück zum Dashboard"
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </a>
                <div>
                    <h1 className="display-md">Alle Absenzen</h1>
                    <p className="mt-1 text-sm text-base-content/60">Deine erstellten Absenz-Formulare im Überblick.</p>
                </div>
            </div>

            <div className="card overflow-hidden bg-base-100 shadow-soft-sm ring-1 ring-base-300/70">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold">Übersicht</h2>
                        <span className="pill px-2 py-0.5 text-xs">{filtered.length}</span>
                    </div>
                    {pdfs.length > 0 && (
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Suchen…"
                                className="w-48 rounded-full border border-base-300 bg-base-100 py-2 pl-9 pr-3 text-sm outline-none transition-shadow focus:border-secondary focus:ring-2 focus:ring-primary/20"
                            />
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
                                    <th className="px-5 py-3 font-semibold">Datum</th>
                                    <th className="px-5 py-3 font-semibold">Grund</th>
                                    <th className="px-5 py-3 font-semibold">Formular</th>
                                    <th className="px-5 py-3 font-semibold">Erstellt</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-12 text-center text-base-content/40">Nichts gefunden.</td></tr>
                                )}
                                {filtered.map((pdf) => (
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
                                                onClick={async (e) => {
                                                    e.preventDefault();
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
                                                    onClick={async (e) => {
                                                        e.preventDefault();
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
                                                    onClick={async (e) => {
                                                        e.preventDefault();
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllAbsencesComponent;
