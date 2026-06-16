import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { trackEvent } from "../utils/umami.ts";
import {
    type DemoAbsence,
    type Lesson,
    makeIdentity,
    makeAbsences,
    makeSchedule,
    formatDateCH,
} from "../components/demoData.ts";

type SortKey = "date" | "reason";

function Demo() {
    const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
    const [absences, setAbsences] = useState<DemoAbsence[]>(() => makeAbsences(seed));
    const [settings, setSettings] = useState({ fullNames: true, fullSubjects: false, localOnly: false });
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const identity = useMemo(() => makeIdentity(seed), [seed]);
    const initials = `${identity.first.charAt(0)}${identity.last.charAt(0)}`.toUpperCase();
    const minutes = absences.length * 5;
    const timeSaved = minutes >= 60 ? `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` : `${minutes} Min.`;

    const flash = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2400);
    };

    // Neue Absenz: Navbar-Event (falls eingeloggt) + N-Shortcut direkt auf der Demo-Seite
    useEffect(() => {
        const open = () => setModalOpen(true);
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName ?? "";
            if (
                e.key.toLowerCase() === "n" &&
                !e.metaKey && !e.ctrlKey && !e.altKey &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
                !target?.isContentEditable
            ) {
                e.preventDefault();
                setModalOpen(true);
            }
        };
        window.addEventListener("absendo:new-absence", open);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("absendo:new-absence", open);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    const toggleSort = (k: SortKey) => {
        if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(k); setSortDir("desc"); }
    };

    const filtered = useMemo(() => {
        const arr = absences.filter((a) => !query || a.reason.toLowerCase().includes(query.toLowerCase()) || a.date.includes(query));
        const dir = sortDir === "asc" ? 1 : -1;
        return [...arr].sort((a, b) => {
            if (sortKey === "date") return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
            return a.reason.localeCompare(b.reason) * dir;
        });
    }, [absences, query, sortKey, sortDir]);

    const doDownload = (id: string) => {
        setDownloadingId(id);
        window.setTimeout(() => { setDownloadingId(null); flash("PDF heruntergeladen (Demo)"); }, 1200);
    };

    const deleteAbsence = (id: string) => {
        setAbsences((prev) => prev.filter((a) => a.id !== id));
        flash("Absenz gelöscht");
    };

    const addAbsence = (a: DemoAbsence) => {
        setAbsences((prev) => [a, ...prev]);
        setModalOpen(false);
        flash("Absenz erstellt, PDF wäre jetzt bereit");
    };

    return (
        <div className="flex min-h-screen flex-col bg-base-200/40">
            <Navbar />

            <div className="border-b border-primary/20 bg-primary/10">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3 text-sm">
                    <span className="pill-soft inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold">Demo-Modus</span>
                    <span className="text-base-content/70">So sieht Absendo eingeloggt aus. Alle Daten sind frei erfunden.</span>
                    <a href="/signup" className="btn btn-primary btn-sm ml-auto gap-1.5" onClick={() => trackEvent("click_demo_create_account")}>
                        Konto erstellen
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            </div>

            <main className="flex-1">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    {/* Header mit eigenem „Neue Absenz"-Button (Demo nutzt den Marketing-Header) */}
                    <div className="mb-7 flex items-center gap-4">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-lg font-bold text-secondary-content">{initials}</div>
                        <div className="flex-1">
                            <h1 className="display-md">Hallo {identity.first} 👋</h1>
                            <p className="mt-1 text-sm text-base-content/60">Bereit für die nächste Absenz.</p>
                        </div>
                        <button className="btn btn-primary gap-1.5" onClick={() => setModalOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="hidden sm:inline">Neue Absenz</span>
                            <Kbd>N</Kbd>
                        </button>
                    </div>

                    {/* Stat-Cards (ohne Plan-Sync) */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard color="#FF6B35" bg="#FFE4D6" label="Generierte Absenzen" sub="Seit Kontoerstellung"
                            value={String(absences.length)}
                            icon={<path strokeLinecap="round" strokeLinejoin="round" d="m10 3 7 4-7 4-7-4 7-4ZM3 11l7 4 7-4M3 15l7 4 7-4" />} />
                        <StatCard color="#7c63e6" bg="#EDE7FF" label="Zeit gespart" sub="≈ 5 Min. pro Absenz"
                            value={timeSaved}
                            icon={<><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></>} />
                        <StatCard color="#2f9c77" bg="#D9F3E8" label="Letzte Absenz" sub={absences[0]?.reason ?? "—"}
                            value={<span className="text-2xl">{absences[0] ? formatDateCH(absences[0].date) : "—"}</span>}
                            icon={<><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M8 3v4M16 3v4" /></>} />
                    </div>

                    {/* Tabelle + rechte Spalte */}
                    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                        <div className="card overflow-hidden bg-base-100 shadow-soft-sm ring-1 ring-base-300/70">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-base font-bold">Deine Absenzen</h2>
                                    <span className="pill px-2 py-0.5 text-xs">{filtered.length}</span>
                                </div>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
                                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen…"
                                        className="w-48 rounded-full border border-base-300 bg-base-100 py-2 pl-9 pr-3 text-sm outline-none transition-shadow focus:border-secondary focus:ring-2 focus:ring-primary/20" />
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-base-300 text-left font-mono text-[11px] uppercase tracking-wider text-base-content/40">
                                        <Th k="date" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}>Datum</Th>
                                        <Th k="reason" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}>Grund</Th>
                                        <th className="px-5 py-3 font-semibold">Formular</th>
                                        <th className="px-5 py-3 font-semibold">Erstellt</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-12 text-center text-base-content/40">Nichts gefunden. Erstelle eine Absenz mit <Kbd>N</Kbd>.</td></tr>
                                    )}
                                    {filtered.map((a) => (
                                        <tr key={a.id} className="border-b border-base-200 transition-colors last:border-0 hover:bg-base-200/50">
                                            <td className="px-5 py-3.5 font-medium">{formatDateCH(a.date)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-2.5">
                                                    <span className="h-2 w-2 rounded-full" style={{ background: a.type === "urlaub" ? "#B8A7FF" : "#7FD8B8" }} />
                                                    {a.reason}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <a
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); doDownload(a.id); }}
                                                    className="font-medium text-primary underline-offset-2 hover:underline"
                                                >
                                                    {a.pdfName}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3.5 text-base-content/50">{formatDateCH(a.createdAt)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => doDownload(a.id)} disabled={downloadingId === a.id}
                                                        className="inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-semibold shadow-soft-sm transition-transform hover:bg-base-200 active:scale-95 disabled:opacity-60">
                                                        {downloadingId === a.id ? "lädt…" : (<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>PDF</>)}
                                                    </button>
                                                    <button onClick={() => deleteAbsence(a.id)} aria-label="Löschen"
                                                        className="grid h-[30px] w-[30px] place-items-center rounded-full text-base-content/50 transition-colors hover:bg-error/10 hover:text-error active:scale-90">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* rechte Spalte */}
                        <div className="flex flex-col gap-5">
                            <div className="card bg-base-100 p-5 shadow-soft-sm ring-1 ring-base-300/70">
                                <h3 className="mb-4 text-base font-bold">Schnell-Einstellungen</h3>
                                <div className="flex flex-col gap-4">
                                    <SettingRow label="Lehrpersonen ausschreiben" desc="Vollständige Namen statt Kürzel" on={settings.fullNames} onChange={(v) => setSettings((s) => ({ ...s, fullNames: v }))} />
                                    <SettingRow label="Fächer ausschreiben" desc="Module bleiben abgekürzt" on={settings.fullSubjects} onChange={(v) => setSettings((s) => ({ ...s, fullSubjects: v }))} />
                                    <SettingRow label="Lokaler Modus" desc="Nicht auf Absendo speichern" on={settings.localOnly} onChange={(v) => setSettings((s) => ({ ...s, localOnly: v }))} />
                                </div>
                                <a href="/profile" className="btn btn-ghost btn-sm mt-5">Zu deinem Profil</a>
                            </div>

                            <div className="card bg-base-100 p-5 shadow-soft-sm ring-1 ring-base-300/70">
                                <h3 className="mb-4 text-base font-bold">Aktivität</h3>
                                <div className="flex flex-col gap-3.5">
                                    {absences.slice(0, 4).map((a, i) => (
                                        <div key={a.id} className="flex gap-3">
                                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ["#FF6B35", "#B8A7FF", "#7FD8B8", "#FFD466"][i % 4] }} />
                                            <div className="flex-1">
                                                <div className="text-[13px] font-medium">PDF generiert</div>
                                                <div className="text-xs text-base-content/50">{a.reason}</div>
                                            </div>
                                            <div className="text-[11px] text-base-content/40">{relTime(a.createdAt)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-secondary px-8 py-7 text-secondary-content sm:flex-row">
                        <p className="text-lg font-semibold">Gefällt dir? In echt gehört das Dashboard dir.</p>
                        <a href="/signup" className="btn btn-primary gap-2">
                            Kostenlos starten
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                    </div>
                </div>
            </main>

            <Footer />

            {modalOpen && <Wizard seed={seed} onClose={() => setModalOpen(false)} onCreate={addAbsence} />}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2" style={{ animation: "heroIn 0.3s var(--ease-out) both" }}>
                    <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-content shadow-soft-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-success"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}

/* --- Sub-Komponenten --- */

function Kbd({ children }: { children: ReactNode }) {
    return <span className="rounded-md border border-current/30 bg-base-100/20 px-1.5 py-0.5 font-mono text-[11px] leading-none opacity-80">{children}</span>;
}

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

function Th({ children, k, sortKey, sortDir, onClick }: { children: ReactNode; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; onClick: (k: SortKey) => void }) {
    const active = sortKey === k;
    return (
        <th className="cursor-pointer select-none px-5 py-3 font-semibold transition-colors hover:text-base-content" onClick={() => onClick(k)}>
            <span className={["inline-flex items-center gap-1.5", active ? "text-base-content" : ""].join(" ")}>
                {children}
                <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.35, transform: active && sortDir === "asc" ? "scaleY(-1)" : undefined }}>
                    <path d="M6 4v12M3 13l3 3 3-3" />
                </svg>
            </span>
        </th>
    );
}

function SettingRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-start gap-3">
            <div className="flex-1">
                <div className="text-[13px] font-semibold">{label}</div>
                <div className="text-xs text-base-content/50">{desc}</div>
            </div>
            <input type="checkbox" className="toggle toggle-primary toggle-sm mt-0.5" checked={on} onChange={(e) => onChange(e.target.checked)} />
        </label>
    );
}

function relTime(iso: string): string {
    const d = new Date(iso);
    const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) return "heute";
    if (days === 1) return "gestern";
    if (days < 7) return `vor ${days} T.`;
    return `vor ${Math.floor(days / 7)} W.`;
}

/* --- Wizard-Modal (3 Schritte, ohne Maskottchen/Sync) --- */

function Wizard({ seed, onClose, onCreate }: { seed: number; onClose: () => void; onCreate: (a: DemoAbsence) => void }) {
    const [step, setStep] = useState(0);
    const [type, setType] = useState<"entschuldigt" | "urlaub">("entschuldigt");
    const [filename, setFilename] = useState("Absenz");
    const [date, setDate] = useState<Date | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [reason, setReason] = useState("");
    const [progress, setProgress] = useState(0);
    const progressRef = useRef<number>(0);

    const daySeed = date ? (seed ^ Math.imul(date.getDate() + date.getMonth() * 31, 2654435761)) >>> 0 : seed;
    const lessons = useMemo<Lesson[]>(() => (date ? makeSchedule(daySeed) : []), [daySeed, date]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    useEffect(() => {
        if (step !== 1) return;
        setProgress(0);
        progressRef.current = 0;
        const id = window.setInterval(() => {
            progressRef.current = Math.min(100, progressRef.current + 6 + Math.random() * 10);
            setProgress(progressRef.current);
            if (progressRef.current >= 100) window.clearInterval(id);
        }, 110);
        return () => window.clearInterval(id);
    }, [step]);

    const canNext = step === 0 ? Boolean(date) && selected.length > 0 && reason.trim().length >= 3 : step === 1 ? progress >= 100 : true;

    const next = () => {
        if (step < 2) { setStep(step + 1); return; }
        const iso = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
        onCreate({
            id: `abs-${Date.now()}`,
            date: iso,
            reason: reason.trim(),
            type,
            pdfName: `${filename || "Absenz"}.pdf`,
            createdAt: new Date().toISOString().slice(0, 10),
            lessons: selected.map((i) => `${lessons[i].time} ${lessons[i].subject}`),
        });
    };

    return (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-secondary/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="card max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-b-none rounded-t-3xl bg-base-100 shadow-soft-xl sm:rounded-3xl" style={{ animation: "heroIn 0.3s var(--ease-out) both" }}>
                {/* Kopf */}
                <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                    <div>
                        <div className="text-xs font-semibold text-primary">Neue Absenz</div>
                        <div className="text-lg font-bold">{["Daten eingeben", "Generieren", "Download"][step]}</div>
                    </div>
                    <button onClick={onClose} aria-label="Schliessen" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-base-200 active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                </div>

                {/* Schrittanzeige */}
                <div className="flex items-center px-6 py-4">
                    {["Eingabe", "Generieren", "Download"].map((lbl, i) => (
                        <div key={lbl} className={i < 2 ? "flex flex-1 items-center" : "flex items-center"}>
                            <div className="flex items-center gap-2.5">
                                <div className={["grid h-8 w-8 place-items-center rounded-full border text-[13px] font-bold transition-colors", i === step ? "border-secondary bg-secondary text-secondary-content" : i < step ? "border-secondary text-secondary" : "border-base-300 text-base-content/40"].join(" ")}>
                                    {i < step ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg> : i + 1}
                                </div>
                                <span className={["text-[13px] font-medium", i <= step ? "" : "text-base-content/40"].join(" ")}>{lbl}</span>
                            </div>
                            {i < 2 && <div className="mx-3 h-0.5 flex-1 rounded-full" style={{ background: i < step ? "var(--color-secondary)" : "var(--color-base-300)" }} />}
                        </div>
                    ))}
                </div>

                {/* Inhalt */}
                <div className="min-h-[360px] px-6 pb-6">
                    {step === 0 && (
                        <div className="flex flex-col gap-5" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div>
                                <FieldLabel>Typ der Absenz</FieldLabel>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <TypeCard active={type === "entschuldigt"} onClick={() => setType("entschuldigt")} color="#7FD8B8" title="Entschuldigt" desc="Krankheit, Arzt, Militär" icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Z" />} />
                                    <TypeCard active={type === "urlaub"} onClick={() => setType("urlaub")} color="#B8A7FF" title="Urlaubsgesuch" desc="Geplant, im Voraus" icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                <div>
                                    <FieldLabel>Dateiname</FieldLabel>
                                    <input className="afield" value={filename} onChange={(e) => setFilename(e.target.value)} />
                                </div>
                                <div>
                                    <FieldLabel>Datum</FieldLabel>
                                    <WizardDate value={date} onChange={setDate} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <FieldLabel>Lektionen für diesen Tag</FieldLabel>
                                    {date && (
                                        <div className="flex gap-3 text-xs font-medium text-base-content/50">
                                            <button onClick={() => setSelected(lessons.map((_, i) => i))} className="hover:text-base-content">alle</button>
                                            <button onClick={() => setSelected([])} className="hover:text-base-content">keine</button>
                                        </div>
                                    )}
                                </div>
                                {!date ? (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200/60 px-5 py-7 text-center text-sm text-base-content/50">
                                        Wähle zuerst ein Datum. Absendo lädt dann den Stundenplan.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {lessons.map((l, i) => {
                                            const on = selected.includes(i);
                                            return (
                                                <button key={l.id} onClick={() => setSelected((s) => on ? s.filter((x) => x !== i) : [...s, i])} aria-pressed={on}
                                                    className={["flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.99]", on ? "border-primary bg-primary/10" : "border-base-300 bg-base-100 hover:bg-base-200"].join(" ")}>
                                                    <span className={["grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-md border transition-transform duration-150", on ? "demo-check border-primary bg-primary text-white" : "border-base-300"].join(" ")}>
                                                        {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>}
                                                    </span>
                                                    <span className="h-6 w-1 flex-shrink-0 rounded-full" style={{ background: l.color }} />
                                                    <span className="min-w-[42px] font-mono text-[11px] text-base-content/50">{l.time}</span>
                                                    <span className="flex flex-1 items-center gap-1.5 text-sm font-medium">
                                                        {l.subject}
                                                        {l.module && <span className="rounded bg-base-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-base-content/50">Modul</span>}
                                                    </span>
                                                    <span className="text-[11px] text-base-content/50">{l.teacher}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <FieldLabel>Grund</FieldLabel>
                                <textarea className="afield min-h-[80px] resize-y" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                                    placeholder={type === "urlaub" ? "Z. B. Familienanlass, Hochzeit…" : "Z. B. Grippe, Arzttermin…"} />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="flex flex-col items-center gap-5 pt-12" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div className="text-center">
                                <div className="text-lg font-bold">{progress < 100 ? "Formular wird erstellt…" : "Fertig!"}</div>
                                <div className="mt-1.5 text-sm text-base-content/50">
                                    {progress < 30 ? "Stundenplan lesen" : progress < 60 ? "Kürzel auflösen" : progress < 90 ? "Formular rendern" : "PDF validieren"}
                                </div>
                            </div>
                            <div className="w-full max-w-sm">
                                <div className="h-1.5 overflow-hidden rounded-full bg-base-300">
                                    <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="mt-2 text-right font-mono text-xs text-base-content/40">{Math.round(progress)} %</div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center gap-5 pt-10 text-center" style={{ animation: "fadeFaq 0.25s var(--ease-out) both" }}>
                            <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success" style={{ animation: "demoCheckPop 0.3s var(--ease-out)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                            </div>
                            <div>
                                <div className="text-xl font-bold">{filename || "Absenz"}.pdf ist bereit.</div>
                                <div className="mt-1.5 text-sm text-base-content/50">{selected.length} Lektionen · {date?.toLocaleDateString("de-CH")}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fuss */}
                <div className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/50 px-6 py-4">
                    <span className="hidden items-center gap-2 text-xs text-base-content/40 sm:flex"><Kbd>Esc</Kbd> schliessen</span>
                    <div className="ml-auto flex gap-2">
                        {step > 0 && step < 2 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>Zurück</button>}
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>Abbrechen</button>
                        <button className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40" disabled={!canNext} onClick={next}>
                            {step === 2 ? "Speichern" : "Weiter"}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: ReactNode }) {
    return <span className="mb-2 block text-xs font-semibold text-base-content/60">{children}</span>;
}

function TypeCard({ active, onClick, color, title, desc, icon }: { active: boolean; onClick: () => void; color: string; title: string; desc: string; icon: ReactNode }) {
    return (
        <button onClick={onClick} className={["flex items-start gap-3 rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.98]", active ? "border-primary bg-primary/10" : "border-base-300 bg-base-100 hover:bg-base-200"].join(" ")}>
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

function WizardDate({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
    const [open, setOpen] = useState(false);
    const today = new Date();
    const [vy, setVy] = useState(value ? value.getFullYear() : today.getFullYear());
    const [vm, setVm] = useState(value ? value.getMonth() : today.getMonth());

    const first = new Date(vy, vm, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(vy, vm + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const monthName = first.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
    const same = (d: number) => value && value.getFullYear() === vy && value.getMonth() === vm && value.getDate() === d;
    const isToday = (d: number) => today.getFullYear() === vy && today.getMonth() === vm && today.getDate() === d;
    const prev = () => (vm === 0 ? (setVm(11), setVy(vy - 1)) : setVm(vm - 1));
    const fwd = () => (vm === 11 ? (setVm(0), setVy(vy + 1)) : setVm(vm + 1));

    return (
        <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="afield flex items-center justify-between text-left">
                <span className={value ? "" : "text-base-content/40"}>{value ? value.toLocaleDateString("de-CH") : "Datum auswählen"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-base-content/50"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" /></svg>
            </button>
            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-soft-lg" style={{ animation: "fadeFaq 0.2s var(--ease-out) both" }}>
                    <div className="mb-2 flex items-center justify-between">
                        <button onClick={prev} className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200 active:scale-90"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" /></svg></button>
                        <span className="text-sm font-semibold capitalize">{monthName}</span>
                        <button onClick={fwd} className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200 active:scale-90"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" /></svg></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => <div key={d} className="py-1 text-center text-[11px] font-semibold text-base-content/40">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((d, i) => d === null ? <div key={i} /> : (
                            <button key={i} onClick={() => { onChange(new Date(vy, vm, d)); setOpen(false); }}
                                className={["grid aspect-square place-items-center rounded-[10px] text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-90",
                                    same(d) ? "bg-secondary text-secondary-content" : isToday(d) ? "border border-primary text-primary" : "hover:bg-base-200"].join(" ")}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Demo;
