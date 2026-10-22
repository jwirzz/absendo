import React, { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { AbsenceOption, generatePdf, getAbsenceOptions } from "../services/pdfService";
import { UserProfile } from "../types/userProfile.ts";
import subjectsData from "../data/subjects24-25-bbzw.json";
import teachersData from "../data/teachers24-25-bbzw.json";

const SUBJECT_NAMES = subjectsData as Record<string, string>;
const TEACHER_NAMES = teachersData as Record<string, string>;

// Fach ausschreiben, falls bekannt; Module (kein Eintrag) bleiben als Kürzel/Code stehen.
function displaySubject(fach: string): string {
    return SUBJECT_NAMES[fach] ?? fach;
}
function isModule(fach: string): boolean {
    return !SUBJECT_NAMES[fach];
}
// Lehrperson als "Nachname V." (Vorname als Initiale). Daten liegen als "Nachname Vorname" vor.
function displayTeacher(lehrer: string): string {
    const full = (TEACHER_NAMES[lehrer] ?? lehrer).trim();
    const parts = full.split(/\s+/);
    if (parts.length >= 2 && parts[1]) {
        return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return full;
}

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
type CalendarPopoverElement = HTMLElement & { hidePopover?: () => void };
let isCallyLoaded = false;

// Schritte: 1 Details · 2 Lektionen · 3 Generieren · 4 Download
const STEP_DETAILS = 1;
const STEP_LESSONS = 2;
const STEP_GENERATE = 3;
const STEP_DOWNLOAD = 4;

function NewAbsenceModal({
    isOpen,
    onClose,
    user,
    userData,
    isFullNameEnabled,
    isFullSubjectEnabled,
    isDoNotSaveEnabled,
}: NewAbsenceModalProps) {
    const [currentStep, setCurrentStep] = useState(STEP_DETAILS);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
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
            setCurrentStep(STEP_DETAILS);
            setIsGenerating(false);
            setGenProgress(0);
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

        setCurrentStep(STEP_DETAILS);
        setIsGenerating(false);
        setGenProgress(0);
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

    // Escape schliesst das Modal
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    // Kosmetischer Fortschrittsbalken während des Generierens
    useEffect(() => {
        if (currentStep !== STEP_GENERATE || !isGenerating) return;
        setGenProgress(8);
        const id = window.setInterval(() => {
            setGenProgress((p) => (p >= 92 ? 92 : p + Math.random() * 9 + 3));
        }, 180);
        return () => window.clearInterval(id);
    }, [currentStep, isGenerating]);

    // Kalender-Listener: neu anhängen, sobald der Lektionen-Schritt den Kalender mountet
    useEffect(() => {
        if (!isOpen || currentStep !== STEP_LESSONS) return;

        const calendarElement = calendarRef.current;
        if (!calendarElement) return;

        const onCalendarChange = (event: Event) => {
            const target = event.target as CalendarDateElement;
            const nextDate = typeof target.value === "string" ? target.value : "";
            setFormData((prev) => (prev.date === nextDate ? prev : { ...prev, date: nextDate }));
            const calendarPopover = calendarPopoverRef.current as CalendarPopoverElement | null;
            if (typeof calendarPopover?.hidePopover === "function") {
                calendarPopover.hidePopover();
            }
        };

        calendarElement.addEventListener("change", onCalendarChange);
        return () => {
            calendarElement.removeEventListener("change", onCalendarChange);
        };
    }, [isOpen, currentStep]);

    useEffect(() => {
        const calendarElement = calendarRef.current;
        if (!calendarElement) return;

        const currentValue = typeof calendarElement.value === "string" ? calendarElement.value : "";
        const nextValue = formData.date || "";
        if (currentValue !== nextValue) {
            calendarElement.value = nextValue;
        }
    }, [formData.date, isOpen, currentStep]);

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

    const goToLessons = () => {
        if (currentStep !== STEP_DETAILS) return;
        if (!formData.fileName.trim() || !formData.reason.trim()) return;
        setCurrentStep(STEP_LESSONS);
    };

    const startGeneration = () => {
        if (currentStep !== STEP_LESSONS) return;

        if (formData.selectedLessonKeys.length === 0) {
            setSelectionError("Bitte wähle mindestens eine Lektion aus.");
            return;
        }

        setIsGenerating(true);
        setCurrentStep(STEP_GENERATE);
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
                setGenProgress(100);
                setCurrentStep(STEP_DOWNLOAD);
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

    const stepIdx = currentStep - 1;
    const stepTitle = ["Details eingeben", "Lektionen wählen", "Generieren", "Download"][stepIdx];

    return (
        <div
            className="fixed inset-0 z-[55] flex items-end justify-center bg-secondary/40 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-absence-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="card flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-b-none rounded-t-3xl bg-base-100 shadow-soft-xl sm:rounded-3xl"
                style={{ animation: "heroIn 0.3s var(--ease-out) both" }}
            >
                {/* Kopf */}
                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                    <div>
                        <div className="text-xs font-semibold text-primary">Neue Absenz</div>
                        <div id="new-absence-title" className="text-lg font-bold">{stepTitle}</div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Schliessen" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-base-200 active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                </div>

                {/* Schrittanzeige */}
                <div className="flex items-center px-6 py-4">
                    {["Details", "Lektionen", "Generieren", "Download"].map((lbl, i) => (
                        <div key={lbl} className={i < 3 ? "flex flex-1 items-center" : "flex items-center"}>
                            <div className="flex items-center gap-2.5">
                                <div className={["grid h-8 w-8 place-items-center rounded-full border text-[13px] font-bold transition-colors", i === stepIdx ? "border-secondary bg-secondary text-secondary-content" : i < stepIdx ? "border-secondary text-secondary" : "border-base-300 text-base-content/40"].join(" ")}>
                                    {i < stepIdx ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg> : i + 1}
                                </div>
                                <span className={["hidden text-[13px] font-medium sm:inline", i <= stepIdx ? "" : "text-base-content/40"].join(" ")}>{lbl}</span>
                            </div>
                            {i < 3 && <div className="mx-2.5 h-0.5 flex-1 rounded-full" style={{ background: i < stepIdx ? "var(--color-secondary)" : "var(--color-base-300)" }} />}
                        </div>
                    ))}
                </div>

                {/* Schritt 1: Details (Typ, Dateiname, Grund) */}
                {currentStep === STEP_DETAILS && (
                    <>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div className="flex flex-col gap-5">
                                <div>
                                    <FieldLabel>Typ der Absenz</FieldLabel>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <TypeChoice active={formData.is_excused} onClick={() => setFormData((p) => ({ ...p, is_excused: true }))}
                                            color="#7FD8B8" title="Entschuldigt" desc="Krankheit, Arzt, Militär"
                                            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Z" />} />
                                        <TypeChoice active={!formData.is_excused} onClick={() => setFormData((p) => ({ ...p, is_excused: false }))}
                                            color="#B8A7FF" title="Urlaubsgesuch" desc="Geplant, im Voraus"
                                            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />} />
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>Dateiname</FieldLabel>
                                    <input type="text" name="fileName" value={formData.fileName} onChange={handleInputChange} className="afield" required />
                                </div>

                                <div>
                                    <FieldLabel>Grund</FieldLabel>
                                    <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows={3}
                                        placeholder={formData.is_excused ? "Z. B. Grippe, Arzttermin…" : "Z. B. Familienanlass, Hochzeit…"} className="afield min-h-[88px] resize-y" required />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/50 px-6 py-4">
                            <span className="hidden items-center gap-2 text-xs text-base-content/40 sm:flex">
                                <span className="rounded-md border border-base-300 bg-base-100 px-1.5 py-0.5 font-mono text-[11px]">Esc</span>
                                schliessen
                            </span>
                            <div className="ml-auto flex gap-2">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Abbrechen</button>
                                <button type="button" className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40" onClick={goToLessons}
                                    disabled={!formData.fileName.trim() || !formData.reason.trim()}>
                                    Weiter
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Schritt 2: Datum + Lektionen */}
                {currentStep === STEP_LESSONS && (
                    <>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div className="flex flex-col gap-5">
                                <div>
                                    <FieldLabel>Datum</FieldLabel>
                                    <button
                                        type="button"
                                        popoverTarget={calendarPopoverId}
                                        className="afield flex items-center justify-between text-left"
                                        style={{ anchorName: calendarAnchorName } as React.CSSProperties}
                                    >
                                        <span className={formData.date ? "" : "text-base-content/40"}>
                                            {formData.date ? new Date(formData.date).toLocaleDateString("de-CH") : "Datum auswählen"}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-base-content/50"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" /></svg>
                                    </button>
                                    <div
                                        ref={calendarPopoverRef}
                                        popover="auto"
                                        id={calendarPopoverId}
                                        className="dropdown rounded-2xl border border-base-300 bg-base-100 p-2 shadow-soft-lg z-[70]"
                                        style={{ positionAnchor: calendarAnchorName } as React.CSSProperties}
                                    >
                                        <calendar-date
                                            ref={calendarRef}
                                            value={formData.date}
                                            className="cally bg-base-100"
                                            aria-label="Datum auswählen"
                                        >
                                            <span aria-label="Vorheriger Monat" className="px-1 text-sm font-bold" slot="previous">‹</span>
                                            <span aria-label="Nächster Monat" className="px-1 text-sm font-bold" slot="next">›</span>
                                            <calendar-month></calendar-month>
                                        </calendar-date>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <FieldLabel>Lektionen für diesen Tag</FieldLabel>
                                        {!isLoadingLessons && formData.date && availableLessons.length > 0 && (
                                            <div className="flex gap-3 text-xs font-medium text-base-content/50">
                                                <button type="button" onClick={selectAllLessons} className="hover:text-base-content">alle</button>
                                                <button type="button" onClick={clearLessonSelection} className="hover:text-base-content">keine</button>
                                            </div>
                                        )}
                                    </div>

                                    {!formData.date && (
                                        <div className="rounded-xl border border-dashed border-base-300 bg-base-200/60 px-5 py-7 text-center text-sm text-base-content/50">
                                            Wähle zuerst ein Datum. Absendo lädt dann deinen Stundenplan.
                                        </div>
                                    )}

                                    {isLoadingLessons && (
                                        <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content/70">
                                            <span className="loading loading-spinner loading-sm" />
                                            Lektionen werden geladen…
                                        </div>
                                    )}

                                    {!isLoadingLessons && formData.date && availableLessons.length > 0 && (
                                        <div className="flex max-h-[42dvh] flex-col gap-1.5 overflow-y-auto sm:max-h-80">
                                            {availableLessons.map((lesson) => {
                                                const on = formData.selectedLessonKeys.includes(lesson.key);
                                                return (
                                                    <button key={lesson.key} type="button" onClick={() => toggleLesson(lesson.key)} aria-pressed={on}
                                                        className={["flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.99]", on ? "border-primary bg-primary/10" : "border-base-300 bg-base-100 hover:bg-base-200"].join(" ")}>
                                                        <span className={["mt-0.5 grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-md border transition-transform duration-150", on ? "demo-check border-primary bg-primary text-white" : "border-base-300"].join(" ")}>
                                                            {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>}
                                                        </span>
                                                        <span className="h-6 w-1 flex-shrink-0 rounded-full bg-primary/70" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                                {displaySubject(lesson.fach)}
                                                                {isModule(lesson.fach) && <span className="rounded bg-base-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-base-content/50">Modul</span>}
                                                                <span className="font-normal text-base-content/50">· {lesson.count} Lektion{lesson.count > 1 ? "en" : ""}</span>
                                                            </div>
                                                            <div className="text-xs text-base-content/50">{displayTeacher(lesson.lehrer)} · {lesson.klasse}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {!isLoadingLessons && formData.date && availableLessons.length === 0 && !selectionError && (
                                        <div className="rounded-xl border border-dashed border-base-300 bg-base-200/60 px-5 py-6 text-center text-sm text-base-content/50">Keine Lektionen für dieses Datum gefunden.</div>
                                    )}

                                    {selectionError && <div className="mt-2 text-sm text-error">{selectionError}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/50 px-6 py-4">
                            <button type="button" className="btn btn-ghost btn-sm gap-1.5" onClick={() => setCurrentStep(STEP_DETAILS)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Zurück
                            </button>
                            <div className="flex gap-2">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Abbrechen</button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40"
                                    onClick={startGeneration}
                                    disabled={!formData.date || formData.selectedLessonKeys.length === 0 || isLoadingLessons}
                                >
                                    Generieren
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Schritt 3: Generieren */}
                {currentStep === STEP_GENERATE && (
                    <div className="flex-1 overflow-y-auto px-6 pb-8" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                        {errorMessage ? (
                            <div className="flex flex-col items-center gap-5 pt-8 text-center">
                                <div className="grid h-16 w-16 place-items-center rounded-full bg-error/15 text-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
                                </div>
                                <p className="measure text-sm text-base-content/80">{errorMessage}</p>
                                <div className="flex gap-2">
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setErrorMessage(null); setCurrentStep(STEP_LESSONS); setIsGenerating(false); setGenProgress(0); }}>Zurück</button>
                                    <a href="/contact" className="btn btn-primary btn-sm">Bug melden</a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-5 pt-14">
                                <div className="text-center">
                                    <div className="text-lg font-bold">Formular wird erstellt…</div>
                                    <div className="mt-1.5 text-sm text-base-content/50">
                                        {genProgress < 30 ? "Stundenplan lesen" : genProgress < 60 ? "Kürzel auflösen" : genProgress < 90 ? "Formular rendern" : "PDF validieren"}
                                    </div>
                                </div>
                                <div className="w-full max-w-sm">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-base-300">
                                        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.round(genProgress)}%` }} />
                                    </div>
                                    <div className="mt-2 text-right font-mono text-xs text-base-content/40">{Math.round(genProgress)} %</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Schritt 4: Download */}
                {currentStep === STEP_DOWNLOAD && (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 pb-8" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div className="flex flex-col items-center gap-5 pt-10 text-center">
                                <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success" style={{ animation: "demoCheckPop 0.3s var(--ease-out)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{formData.fileName} ist bereit.</div>
                                    <div className="mt-1.5 text-sm text-base-content/50">
                                        {formData.selectedLessonKeys.length} Lektion{formData.selectedLessonKeys.length === 1 ? "" : "en"}
                                        {formData.date ? ` · ${new Date(formData.date).toLocaleDateString("de-CH")}` : ""}
                                    </div>
                                </div>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={viewPDF}>Vorschau öffnen</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-base-300 bg-base-200/50 px-6 py-4">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Schliessen</button>
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={downloadPDF}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
                                Herunterladen
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: ReactNode }) {
    return <span className="mb-2 block text-xs font-semibold text-base-content/60">{children}</span>;
}

function TypeChoice({ active, onClick, color, title, desc, icon }: { active: boolean; onClick: () => void; color: string; title: string; desc: string; icon: ReactNode }) {
    return (
        <button type="button" onClick={onClick} className={["flex items-start gap-3 rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.98]", active ? "border-primary bg-primary/10" : "border-base-300 bg-base-100 hover:bg-base-200"].join(" ")}>
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-white" style={{ background: color }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">{icon}</svg>
            </span>
            <div className="flex-1">
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-base-content/50">{desc}</div>
            </div>
            <span className={["mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border", active ? "border-primary" : "border-base-300"].join(" ")}>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </span>
        </button>
    );
}

export default NewAbsenceModal;
