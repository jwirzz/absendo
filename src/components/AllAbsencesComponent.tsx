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
                            decryptedPdfs.push({
                                ...pdf,
                                file_path: file_path ?? "",
                                date_of_absence: date_of_absence ?? "",
                                reason: reason ?? "",
                                pdf_name: pdf_name ?? "",
                            });
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
        if (!error) {
            return data;
        }
        console.log("Error downloading PDF:", error);
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
        const { error } = await supabase
            .storage
            .from('pdf-files')
            .remove([pdf.file_path]);

        const { status } = await supabase
            .from('pdf_files')
            .delete()
            .eq('id', pdf.id);

        if (!error && status === 204) {
            setPdfs((prev) => prev.filter((p) => p.id !== pdf.id));
        } else {
            console.error("Fehler beim Löschen der PDF:", error);
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-2xl">Alle Absenzen</h2>
                        <div className="badge badge-primary">{pdfs.length} Absenzen</div>
                    </div>

                    {pdfs.length === 0 ? (
                        <div className="text-center py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B4.875 8.25 2.25 5.625 2.25 9v8.25a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375z" />
                            </svg>
                            <p className="text-gray-500">Keine Absenzen vorhanden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                <tr>
                                    <th>Datum der Absenz</th>
                                    <th>Grund</th>
                                    <th>Formular</th>
                                    <th>Erstellt am</th>
                                    <th>Aktionen</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pdfs.map((pdf) => (
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
                                                onClick={async (e) => {
                                                    e.preventDefault();
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
                                                    onClick={async (e) => {
                                                        e.preventDefault();
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
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        if (confirm('Bist du sicher, dass du diese Absenz löschen möchtest?')) {
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default AllAbsencesComponent;
