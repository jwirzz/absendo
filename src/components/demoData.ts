/* Gemeinsame Zufallsdaten für die Demos (bewusst KEINE echten Nutzerdaten). */

export type Lesson = { id: string; time: string; subject: string; teacher: string; color: string; module: boolean };

export type Identity = {
    first: string;
    last: string;
    klasse: string;
    location: string;
    trainerFirst: string;
    trainerLast: string;
    birthday: string;
    company: string;
};

export type DemoAbsence = {
    id: string;
    date: string;       // ISO yyyy-mm-dd
    reason: string;
    type: "entschuldigt" | "urlaub";
    pdfName: string;
    createdAt: string;  // ISO yyyy-mm-dd
    lessons: string[];
};

const FIRST = ["Lena", "Jonas", "Mara", "Elia", "Noah", "Sina", "Luca", "Nora", "Tim", "Aylin", "Ben", "Mia", "Jan", "Lea", "Finn", "Alina", "Robin", "Yara"];
const LAST = ["Brunner", "Keller", "Frei", "Steiner", "Bachmann", "Huber", "Roos", "Imhof", "Zemp", "Marti", "Suter", "Odermatt", "Wyss", "Bucher", "Lustenberger"];
const KLASSE = ["FB23c", "IN24a", "KV22b", "FB24a", "IN23d", "ME25a", "KV23a", "IN22c"];
const LOC = ["Sursee", "Emmen", "Willisau"];
const COMPANY = ["Müller AG", "Bucher Reinigung", "CSS Versicherung", "Galliker Transport", "Emmi AG", "Schurter AG", "Coop Genossenschaft", "Pilatus Flugzeugwerke"];

// [Anzeige, Farbe, istModul] — Module bleiben als Kürzel/Code stehen, Fächer werden ausgeschrieben
const SUBJECTS: [string, string, boolean?][] = [
    ["Deutsch", "#FF6B35"], ["Mathematik", "#B8A7FF"], ["Englisch", "#FFD466"],
    ["Sport", "#9BD0F5"], ["Geschichte und Politik", "#B8A7FF"], ["Naturlehre", "#7FD8B8"],
    ["Französisch", "#FFD466"], ["Allgemeinbildender Unterricht", "#FF6B35"], ["Wirtschaft und Gesellschaft", "#7FD8B8"],
    ["M122", "#9BD0F5", true], ["M165", "#FFD466", true], ["M231", "#B8A7FF", true], ["M319", "#7FD8B8", true],
];
const TEACHERS = ["S. Brunner", "R. Weibel", "K. Amrein", "L. Keller", "M. Oertig", "P. Stalder", "C. Fuchs", "D. Estermann", "A. Bieri", "T. Lang"];
const TIMES = ["07:40", "08:30", "09:30", "10:20", "11:10", "13:15", "14:05", "15:05"];
const REASONS = ["Krankheit", "Arzttermin", "Zahnarzt", "Familiäres", "Unfall", "Persönliches", "Grippe"];
const URLAUB_REASONS = ["Familienanlass", "Hochzeit Cousin", "Sportwettkampf", "Ferien verlängert", "Orientierungstage Militär"];

export const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// mulberry32 — deterministisch: gleicher Seed ⇒ gleiches Resultat
export function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function pick<T>(r: () => number, arr: T[]): T {
    return arr[Math.floor(r() * arr.length)];
}

export function makeIdentity(seed: number): Identity {
    const r = rng(seed);
    const day = 1 + Math.floor(r() * 27);
    const monthIdx = Math.floor(r() * 12);
    const yearB = 2005 + Math.floor(r() * 5);
    return {
        first: pick(r, FIRST),
        last: pick(r, LAST),
        klasse: pick(r, KLASSE),
        location: pick(r, LOC),
        trainerFirst: pick(r, FIRST),
        trainerLast: pick(r, LAST),
        birthday: `${String(day).padStart(2, "0")}.${String(monthIdx + 1).padStart(2, "0")}.${yearB}`,
        company: pick(r, COMPANY),
    };
}

export function makeSchedule(seed: number): Lesson[] {
    const r = rng(seed);
    const count = 4 + Math.floor(r() * 3); // 4–6 Lektionen
    const startIdx = Math.floor(r() * Math.max(1, TIMES.length - count));
    const used = new Set<string>();
    const out: Lesson[] = [];
    for (let i = 0; i < count; i++) {
        let sub = pick(r, SUBJECTS);
        let guard = 0;
        while (used.has(sub[0]) && guard++ < 12) sub = pick(r, SUBJECTS);
        used.add(sub[0]);
        out.push({ id: `${seed}-${i}`, time: TIMES[startIdx + i], subject: sub[0], teacher: pick(r, TEACHERS), color: sub[1], module: Boolean(sub[2]) });
    }
    return out;
}

// Liste vergangener Demo-Absenzen, jüngste zuerst
export function makeAbsences(seed: number, count = 6): DemoAbsence[] {
    const r = rng(seed);
    const out: DemoAbsence[] = [];
    let cursor = new Date();
    cursor.setDate(cursor.getDate() - (2 + Math.floor(r() * 4)));
    for (let i = 0; i < count; i++) {
        // ein paar Tage zurückspringen, Wochenenden überspringen
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() - (3 + Math.floor(r() * 9)));
        while (cursor.getDay() === 0 || cursor.getDay() === 6) cursor.setDate(cursor.getDate() - 1);
        const created = new Date(cursor);
        const sched = makeSchedule((seed ^ Math.imul(i + 1, 2654435761)) >>> 0);
        const lessonCount = 1 + Math.floor(r() * Math.min(3, sched.length));
        const isUrlaub = r() < 0.25;
        out.push({
            id: `abs-${seed}-${i}`,
            date: isoDate(cursor),
            reason: isUrlaub ? pick(r, URLAUB_REASONS) : pick(r, REASONS),
            type: isUrlaub ? "urlaub" : "entschuldigt",
            pdfName: `Absenz_${isoDate(cursor)}.pdf`,
            createdAt: isoDate(created),
            lessons: sched.slice(0, lessonCount).map((l) => `${l.time} ${l.subject}`),
        });
    }
    return out;
}

export function firstWeekday(year: number, month: number, preferred: number): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const start = Math.min(preferred, daysInMonth);
    for (let d = start; d <= daysInMonth; d++) {
        const wd = new Date(year, month, d).getDay();
        if (wd !== 0 && wd !== 6) return d;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const wd = new Date(year, month, d).getDay();
        if (wd !== 0 && wd !== 6) return d;
    }
    return start;
}

function isoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateCH(iso: string): string {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}
