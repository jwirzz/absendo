import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type RobotsPolicy = "index, follow" | "noindex, nofollow";

type RouteMeta = {
    title: string;
    description: string;
    robots: RobotsPolicy;
    canonicalPath: string;
    jsonLd?: object;
};

const SITE_URL = "https://absendo.app";
const SITE_NAME = "Absendo";

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
                text: "Ja, die Lösung ist aktuell auf BBZW Sursee, Emmen und Willisau ausgerichtet."
            }
        }
    ]
};

const DEFAULT_META: RouteMeta = {
    title: "Absendo | BBZW Absenzformulare in 30 Sekunden",
    description:
        "Absendo füllt BBZW-Absenzformulare automatisch aus. Für Sursee, Emmen und Willisau. Schnell, kostenlos und ohne Stress.",
    robots: "noindex, nofollow",
    canonicalPath: "/"
};

const ROUTE_META: Record<string, Partial<RouteMeta>> = {
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
        title: "BBZW Absenzformular online ausfüllen | Absendo",
        description:
            "BBZW Absenzformular schnell online ausfüllen: für Sursee, Emmen und Willisau. Gebaut, um Zeit zu sparen statt manuell alles einzutragen.",
        robots: "index, follow",
        canonicalPath: "/bbzw-absenzformular",
        jsonLd: BBZW_PAGE_JSON_LD
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
    }
};

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.setAttribute("content", content);
}

function upsertCanonical(url: string): void {
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
}

function upsertJsonLd(jsonLd: object | undefined): void {
    const scriptId = "route-jsonld";
    const existing = document.getElementById(scriptId);

    if (!jsonLd) {
        if (existing) {
            existing.remove();
        }
        return;
    }

    const script = existing ?? document.createElement("script");
    script.setAttribute("id", scriptId);
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(jsonLd);

    if (!existing) {
        document.head.appendChild(script);
    }
}

export default function RouteSeo() {
    const { pathname } = useLocation();

    useEffect(() => {
        const meta: RouteMeta = {
            ...DEFAULT_META,
            ...ROUTE_META[pathname]
        };

        const canonical = new URL(meta.canonicalPath, SITE_URL).toString();
        document.title = meta.title;

        upsertMeta("name", "description", meta.description);
        upsertMeta("name", "robots", meta.robots);
        upsertMeta("property", "og:type", "website");
        upsertMeta("property", "og:site_name", SITE_NAME);
        upsertMeta("property", "og:title", meta.title);
        upsertMeta("property", "og:description", meta.description);
        upsertMeta("property", "og:url", canonical);
        upsertMeta("name", "twitter:card", "summary");
        upsertMeta("name", "twitter:title", meta.title);
        upsertMeta("name", "twitter:description", meta.description);
        upsertCanonical(canonical);
        upsertJsonLd(meta.jsonLd);
    }, [pathname]);

    return null;
}
