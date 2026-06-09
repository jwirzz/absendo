import React, { useEffect, useId, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AbsenceOption, generatePdf, getAbsenceOptions } from "../services/pdfService";
import { UserProfile } from "../types/userProfile.ts";

interface NewAbsenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    userData: UserProfile | null;
    isFullNameEnabled: boolean;
    isFullSubjectEnabled: boolean;
    isDoNotSaveEnabled: boolean;
}

interface FormData {
    date: string;
    reason: string;
    fileName: string;
    is_excused: boolean;
    isFullNameEnabled: boolean;
    isFullSubjectEnabled: boolean;
    isDoNotSaveEnabled: boolean;
    selectedLessonKeys: string[];
}

type CalendarDateElement = HTMLElement & { value?: string };
let isCallyLoaded = false;

function NewAbsenceModal({
    isOpen,
    onClose,
    user,
    userData,
    isFullNameEnabled,
    isFullSubjectEnabled,
    isDoNotSaveEnabled,
}: NewAbsenceModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        date: "",
        reason: "",
        fileName: "",
        is_excused: true,
        isFullNameEnabled,
        isFullSubjectEnabled,
        isDoNotSaveEnabled,
        selectedLessonKeys: [],
    });
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [availableLessons, setAvailableLessons] = useState<AbsenceOption[]>([]);
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const calendarRef = useRef<CalendarDateElement | null>(null);
    const calendarPopoverRef = useRef<HTMLDivElement | null>(null);
    const calendarId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const calendarPopoverId = `absence-date-popover-${calendarId}`;
    const calendarAnchorName = `--absence-date-anchor-${calendarId}`;

    useEffect(() => {
        if (!isOpen || isCallyLoaded) return;

        let cancelled = false;
        void import("cally")
            .then(() => {
                if (!cancelled) {
                    isCallyLoaded = true;
                }
            })
            .catch((error) => {
                console.error("Cally konnte nicht geladen werden:", error);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            // Reset immediately on close so stale date values cannot trigger lesson loading on next open.
            setCurrentStep(1);
            setIsGenerating(false);
            setFormData((prev) => ({
                ...prev,
                date: "",
                reason: "",
                fileName: "Absenz",
                is_excused: true,
                selectedLessonKeys: [],
            }));
            setPdfBlob(null);
            setErrorMessage(null);
            setAvailableLessons([]);
            setSelectionError(null);
            setIsLoadingLessons(false);
            return;
        }

        setCurrentStep(1);
        setIsGenerating(false);
        setFormData({
            date: "",
            reason: "",
            fileName: "Absenz",
            is_excused: true,
            isFullNameEnabled,
            isFullSubjectEnabled,
            isDoNotSaveEnabled,
            selectedLessonKeys: [],
        });
        setPdfBlob(null);
        setErrorMessage(null);
        setAvailableLessons([]);
        setSelectionError(null);
        setIsLoadingLessons(false);
    }, [isOpen, isDoNotSaveEnabled, isFullNameEnabled, isFullSubjectEnabled]);

    useEffect(() => {
        if (!isOpen) return;

        const calendarElement = calendarRef.current;
        if (!calendarElement) return;

        const onCalendarChange = (event: Event) => {
            const target = event.target as CalendarDateElement;
            const nextDate = typeof target.value === "string" ? target.value : "";
            setFormData((prev) => (prev.date === nextDate ? prev : { ...prev, date: nextDate }));
            if (calendarPopoverRef.current && typeof (calendarPopoverRef.current as any).hidePopover === "function") {
                (calendarPopoverRef.current as any).hidePopover();
            }
        };

        calendarElement.addEventListener("change", onCalendarChange);
        return () => {
            calendarElement.removeEventListener("change", onCalendarChange);
        };
    }, [isOpen]);

    useEffect(() => {
        const calendarElement = calendarRef.current;
        if (!calendarElement) return;

        const currentValue = typeof calendarElement.value === "string" ? calendarElement.value : "";
        const nextValue = formData.date || "";
        if (currentValue !== nextValue) {
            calendarElement.value = nextValue;
        }
    }, [formData.date, isOpen]);

    useEffect(() => {
        // Modal closed: reset lesson-related state and clear any selection error
        if (!isOpen) {
            setIsLoadingLessons(false);
            setAvailableLessons([]);
            setFormData((prev) => ({ ...prev, selectedLessonKeys: [] }));
            setSelectionError(null);
            return;
        }

        // No date selected yet: ensure clean state without showing an error
        if (!formData.date) {
            setIsLoadingLessons(false);
            setAvailableLessons([]);
            setFormData((prev) => ({ ...prev, selectedLessonKeys: [] }));
            setSelectionError(null);
            return;
        }

        // Date selected but profile/userData missing: indicate incomplete profile / missing calendar URL
        if (!userData) {
            setIsLoadingLessons(false);
            setAvailableLessons([]);
            setFormData((prev) => ({ ...prev, selectedLessonKeys: [] }));
            setSelectionError("Profil unvollständig / Kalender-URL fehlt");
            return;
        }
        let cancelled = false;

        async function loadLessonsForDate() {
            setIsLoadingLessons(true);
            setSelectionError(null);
            try {
                const lessons = await getAbsenceOptions(userData, formData.date);
                if (cancelled) return;

                setAvailableLessons(lessons);
                setFormData((prev) => ({
                    ...prev,
                    selectedLessonKeys: lessons.map((lesson) => lesson.key),
                }));
            } catch (error) {
                if (cancelled) return;
                console.error("Fehler beim Laden der Lektionen:", error);
                setAvailableLessons([]);
                setFormData((prev) => ({ ...prev, selectedLessonKeys: [] }));
                setSelectionError("Lektionen konnten nicht geladen werden. Prüfe deine Kalender-URL.");
            } finally {
                if (!cancelled) {
                    setIsLoadingLessons(false);
                }
            }
        }

        void loadLessonsForDate();

        return () => {
            cancelled = true;
        };
    }, [formData.date, isOpen, userData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleLesson = (lessonKey: string) => {
        setSelectionError(null);
        setFormData((prev) => {
            const isSelected = prev.selectedLessonKeys.includes(lessonKey);
            return {
                ...prev,
                selectedLessonKeys: isSelected
                    ? prev.selectedLessonKeys.filter((key) => key !== lessonKey)
                    : [...prev.selectedLessonKeys, lessonKey],
            };
        });
    };

    const selectAllLessons = () => {
        setSelectionError(null);
        setFormData((prev) => ({
            ...prev,
            selectedLessonKeys: availableLessons.map((lesson) => lesson.key),
        }));
    };

    const clearLessonSelection = () => {
        setSelectionError(null);
        setFormData((prev) => ({
            ...prev,
            selectedLessonKeys: [],
        }));
    };

    const goToNextStep = () => {
        if (currentStep !== 1) return;

        if (formData.selectedLessonKeys.length === 0) {
            setSelectionError("Bitte wähle mindestens eine Lektion aus.");
            return;
        }

        setIsGenerating(true);
        setCurrentStep(2);
        void getPDF();
    };

    function addPDFExtension(fileName: string) {
        if (!fileName.endsWith(".pdf")) {
            return `${fileName}.pdf`;
        }
        return fileName;
    }

    async function getPDF() {
        if (!user || !userData) {
            setErrorMessage("Du bist nicht eingeloggt. Bitte logge dich ein.");
            setIsGenerating(false);
            return;
        }

        const preparedFormData: FormData = {
            ...formData,
            isFullNameEnabled,
            isFullSubjectEnabled,
            isDoNotSaveEnabled,
            fileName: addPDFExtension(formData.fileName),
            selectedLessonKeys: formData.selectedLessonKeys,
        };

        setFormData(preparedFormData);

        try {
            const blob = await generatePdf(userData, preparedFormData);
            if (blob) {
                setPdfBlob(blob);
                setCurrentStep(3);
            } else {
                setErrorMessage("PDF konnte nicht generiert werden. Prüfe deine Kalender-URL oder versuche es später erneut.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unbekannter Fehler";
            if (message.startsWith("Absendo findet keine Daten") || message.includes("mindestens eine Lektion")) {
                setErrorMessage(message);
            } else {
                setErrorMessage(`Fehler beim Generieren der Absenz: ${message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    }

    function downloadPDF() {
        if (!pdfBlob) {
            console.error("PDF Blob ist null. Download nicht möglich.");
            return;
        }

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = formData.fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    function viewPDF() {
        if (!(pdfBlob instanceof Blob)) {
            console.error("Ungültiger PDF Blob. Vorschau nicht möglich.");
            return;
        }

        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
    }

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Neue Absenz erstellen</h3>
                <ul className="steps w-full mb-6">
                    <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>Daten eingeben</li>
                    <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>Generieren</li>
                    <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>Download</li>
                </ul>

                {currentStep === 1 && (
                    <div className="form-control">
                        <div className="mb-4">
                            <label className="label mb-2">
                                <span className="label-text">Typ der Absenz</span>
                            </label>
                            <div className="flex gap-6">
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="radio"
                                        name="is_excused"
                                        value="true"
                                        className="radio"
                                        checked={formData.is_excused}
                                        onChange={() => setFormData((prev) => ({ ...prev, is_excused: true }))}
                                    />
                                    <span>Entschuldigt</span>
                                </label>
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="radio"
                                        name="is_excused"
                                        value="false"
                                        className="radio"
                                        checked={!formData.is_excused}
                                        onChange={() => setFormData((prev) => ({ ...prev, is_excused: false }))}
                                    />
                                    <span>Urlaubsgesuch</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Name der Datei</span>
                            </label>
                            <input
                                type="text"
                                name="fileName"
                                value={formData.fileName}
                                onChange={handleInputChange}
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Datum</span>
                            </label>
                            <button
                                type="button"
                                popoverTarget={calendarPopoverId}
                                className="input input-bordered w-full text-left justify-start"
                                style={{ anchorName: calendarAnchorName } as React.CSSProperties}
                            >
                                {formData.date ? new Date(formData.date).toLocaleDateString("de-CH") : "Datum auswählen"}
                            </button>
                            <div
                                ref={calendarPopoverRef}
                                popover="auto"
                                id={calendarPopoverId}
                                className="dropdown bg-base-100 rounded-box shadow-lg p-2 z-[70]"
                                style={{ positionAnchor: calendarAnchorName } as React.CSSProperties}
                            >
                                <calendar-date
                                    ref={calendarRef}
                                    value={formData.date}
                                    className="cally bg-base-100"
                                    aria-label="Datum auswählen"
                                >
                                    <span aria-label="Vorheriger Monat" className="text-sm font-bold px-1" slot="previous">‹</span>
                                    <span aria-label="Nächster Monat" className="text-sm font-bold px-1" slot="next">›</span>
                                    <calendar-month></calendar-month>
                                </calendar-date>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Lektionen für diesen Tag</span>
                            </label>

                            {!formData.date && (
                                <div className="text-sm text-gray-500">Wähle zuerst ein Datum.</div>
                            )}

                            {isLoadingLessons && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Lektionen werden geladen...
                                </div>
                            )}

                            {!isLoadingLessons && formData.date && availableLessons.length > 0 && (
                                <div className="border rounded-lg p-3 max-h-56 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-600">
                                            {formData.selectedLessonKeys.length} von {availableLessons.length} ausgewählt
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline"
                                                onClick={selectAllLessons}
                                            >
                                                Alle
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline"
                                                onClick={clearLessonSelection}
                                            >
                                                Keine
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {availableLessons.map((lesson) => {
                                            const isSelected = formData.selectedLessonKeys.includes(lesson.key);
                                            return (
                                                <label key={lesson.key} className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm mt-1"
                                                        checked={isSelected}
                                                        onChange={() => toggleLesson(lesson.key)}
                                                    />
                                                    <div className="text-sm">
                                                        <div className="font-medium">{lesson.fach} ({lesson.count} Lektion{lesson.count > 1 ? "en" : ""})</div>
                                                        <div className="text-gray-600">{lesson.lehrer} · {lesson.klasse}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!isLoadingLessons && formData.date && availableLessons.length === 0 && !selectionError && (
                                <div className="text-sm text-gray-600">Keine Lektionen für dieses Datum gefunden.</div>
                            )}

                            {selectionError && (
                                <div className="mt-2 text-sm text-error">{selectionError}</div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Grund</span>
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                className="textarea textarea-bordered w-full"
                                rows={1}
                                placeholder="Grund für die Absenz eingeben..."
                                required
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
                            <button
                                className="btn btn-primary"
                                onClick={goToNextStep}
                                disabled={!formData.date || !formData.reason || formData.selectedLessonKeys.length === 0 || isLoadingLessons}
                            >
                                Weiter
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="radial-progress animate-spin" style={{ "--value": "70" } as React.CSSProperties}></div>
                        <p className="mt-4 text-lg">Absenz wird generiert...</p>
                        {errorMessage && (
                            <div className="alert alert-error mb-4 mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{errorMessage}</span>
                                <a href="/contact" className="btn btn-sm btn-secondary ml-4">Bug melden</a>
                                <button
                                    className="btn btn-sm btn-ghost ml-2"
                                    onClick={() => {
                                        setErrorMessage(null);
                                        setCurrentStep(1);
                                        setIsGenerating(false);
                                    }}
                                >
                                    Zurück
                                </button>
                            </div>
                        )}
                        {!errorMessage && !isGenerating && (
                            <button
                                className="btn btn-primary mt-6"
                                onClick={() => setCurrentStep(1)}
                            >
                                Zurück
                            </button>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <div className="flex flex-col items-center justify-center py-10">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-24 h-24 text-success mb-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                            </svg>
                            <h3 className="text-2xl font-bold text-center mb-2">PDF erfolgreich generiert!</h3>
                            <p className="text-center text-base-content/70 mb-6">Die Absenz wurde als PDF-Dokument erstellt.</p>
                            <button className="btn btn-secondary" onClick={viewPDF}>Vorschau</button>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={onClose}>Schliessen</button>
                            <button className="btn btn-primary" onClick={downloadPDF}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Herunterladen
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewAbsenceModal;
