export type RobotsPolicy = "index, follow" | "noindex, nofollow";

export type RouteMeta = {
    title: string;
    description: string;
    robots: RobotsPolicy;
    canonicalPath: string;
    ogImage: string;
    jsonLd?: object;
};

export const SITE_URL = "https://absendo.app";
export const SITE_NAME = "Absendo";
const DEFAULT_OG_IMAGE = "/og-image.png";

const HOME_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Absendo",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "CHF"
    },
    url: SITE_URL,
    description:
        "Web-App zum automatischen Ausfüllen von BBZW-Absenzformularen für Sursee, Emmen und Willisau.",
    provider: {
        "@type": "Organization",
        name: "Absendo"
    }
};

// FAQPage liefert bei kommerziellen Seiten seit Aug 2023 keine Google-Rich-Results
// mehr, hilft aber weiterhin für die Zitierbarkeit in KI-Suchen (ChatGPT, Perplexity).
const BBZW_PAGE_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "Wie kann ich das BBZW Absenzformular schneller ausfüllen?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Mit Absendo werden wiederkehrende Angaben automatisch übernommen und das Formular in wenigen Schritten vorbereitet."
            }
        },
        {
            "@type": "Question",
            name: "Funktioniert Absendo für BBZW Sursee, Emmen und Willisau?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Ja, die Lösung ist aktuell auf BBZW Sursee, BBZW Emmen und BBZW Willisau ausgerichtet."
            }
        },
        {
            "@type": "Question",
            name: "Was kostet das Ausfüllen des Absenzformulars mit Absendo?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Absendo ist für Schülerinnen und Schüler kostenlos. Du brauchst nur ein Konto und deine Schulnetz-Kalender-URL."
            }
        }
    ]
};

const GUIDE_PAGE_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "Bis wann muss ich eine Absenz am BBZW entschuldigen?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Spätestens in der 3. Schulwoche nach Wiederaufnahme des Unterrichts muss das Formular den Lehrpersonen bzw. der Klassenlehrperson zum Visieren vorgelegt werden. Zu spät eingereichte, unvollständige oder nicht plausibel begründete Entschuldigungen werden nicht akzeptiert."
            }
        },
        {
            "@type": "Question",
            name: "Wie früh muss ich ein Urlaubsgesuch am BBZW einreichen?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Spätestens 3 Schulwochen vor dem Urlaub bei der Klassenlehrperson, mit zwingend beigelegtem Beweismittel. Das Gesuch wird von der Fachbereichsleitung bewilligt oder abgelehnt; die lernende Person erhält einen schriftlichen Bescheid."
            }
        },
        {
            "@type": "Question",
            name: "Was ist der Unterschied zwischen Entschuldigung und Urlaubsgesuch?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Eine Entschuldigung reichst du nachträglich für eine bereits eingetretene Absenz ein, zum Beispiel bei Krankheit. Ein Urlaubsgesuch stellst du im Voraus für eine geplante Abwesenheit."
            }
        },
        {
            "@type": "Question",
            name: "Gilt das für BBZW Sursee, Emmen und Willisau?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Ja. Absendo ist aktuell auf die BBZW-Standorte Sursee, Emmen und Willisau ausgerichtet."
            }
        }
    ]
};

export const DEFAULT_META: RouteMeta = {
    title: "Absendo | BBZW Absenzformulare in 30 Sekunden",
    description:
        "Absendo füllt BBZW-Absenzformulare automatisch aus. Für Sursee, Emmen und Willisau. Schnell, kostenlos und ohne Stress.",
    robots: "noindex, nofollow",
    canonicalPath: "/",
    ogImage: DEFAULT_OG_IMAGE
};

export const ROUTE_META: Record<string, Partial<RouteMeta>> = {
    "/": {
        title: "Absendo | BBZW Absenzformulare in 30 Sekunden",
        description:
            "Absendo füllt BBZW-Absenzformulare automatisch aus. Für Sursee, Emmen und Willisau. Schnell, kostenlos und ohne Stress.",
        robots: "index, follow",
        canonicalPath: "/",
        jsonLd: HOME_JSON_LD
    },
    "/contact": {
        title: "Kontakt | Absendo",
        description: "Kontaktiere Absendo bei Fragen, Feedback oder um deine Schule vorzuschlagen.",
        robots: "index, follow",
        canonicalPath: "/contact"
    },
    "/bbzw-absenzformular": {
        title: "BBZW Absenzformular online ausfüllen | Sursee, Emmen, Willisau",
        description:
            "BBZW Absenzformular schnell online ausfüllen: für Sursee, Emmen und Willisau. Entschuldigung und Urlaubsgesuch automatisch vorbereiten statt manuell eintragen.",
        robots: "index, follow",
        canonicalPath: "/bbzw-absenzformular",
        jsonLd: BBZW_PAGE_JSON_LD
    },
    "/bbzw-absenzen-entschuldigen": {
        title: "BBZW Absenz entschuldigen: Anleitung für Sursee, Emmen & Willisau",
        description:
            "Absenz am BBZW richtig entschuldigen: Unterschied zwischen Entschuldigung und Urlaubsgesuch, krank melden und wie du das Formular in Sekunden ausfüllst.",
        robots: "index, follow",
        canonicalPath: "/bbzw-absenzen-entschuldigen",
        jsonLd: GUIDE_PAGE_JSON_LD
    },
    "/datenschutz": {
        title: "Datenschutzerklärung | Absendo",
        description: "Datenschutzerklärung von Absendo mit Informationen zur Verarbeitung persönlicher Daten.",
        robots: "index, follow",
        canonicalPath: "/datenschutz"
    },
    "/support": {
        title: "Support | Absendo",
        description: "Unterstütze Absendo freiwillig und hilf mit, laufende Betriebskosten zu decken.",
        robots: "index, follow",
        canonicalPath: "/support"
    },
    "/login": {
        title: "Login | Absendo",
        description: "Melde dich bei Absendo an, um deine BBZW-Absenzformulare zu verwalten.",
        robots: "noindex, nofollow",
        canonicalPath: "/login"
    },
    "/signup": {
        title: "Registrierung | Absendo",
        description: "Erstelle dein Absendo-Konto und starte mit automatischen BBZW-Absenzformularen.",
        robots: "noindex, nofollow",
        canonicalPath: "/signup"
    },
    "/email-verification": {
        title: "E-Mail bestätigen | Absendo",
        description: "Bestätige deine E-Mail-Adresse, um dein Absendo-Konto zu aktivieren.",
        robots: "noindex, nofollow",
        canonicalPath: "/email-verification"
    },
    "/dashboard": {
        title: "Dashboard | Absendo",
        description: "Persönlicher Bereich für deine Absenzen in Absendo.",
        robots: "noindex, nofollow",
        canonicalPath: "/dashboard"
    },
    "/welcome": {
        title: "Onboarding | Absendo",
        description: "Richte dein Absendo-Profil und deinen Kalender ein.",
        robots: "noindex, nofollow",
        canonicalPath: "/welcome"
    },
    "/profile": {
        title: "Profil | Absendo",
        description: "Verwalte dein Profil und deine Einstellungen in Absendo.",
        robots: "noindex, nofollow",
        canonicalPath: "/profile"
    },
    "/absences": {
        title: "Alle Absenzen | Absendo",
        description: "Übersicht über alle von dir generierten Absenzen.",
        robots: "noindex, nofollow",
        canonicalPath: "/absences"
    },
    "/demo": {
        title: "Demo | Absendo",
        description: "Probiere Absendo unverbindlich aus und sieh, wie das BBZW Absenzformular automatisch ausgefüllt wird.",
        robots: "index, follow",
        canonicalPath: "/demo"
    }
};

export function resolveMeta(pathname: string): RouteMeta {
    return {
        ...DEFAULT_META,
        ...ROUTE_META[pathname]
    };
}
