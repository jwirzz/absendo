import type { RouteRecord } from "vite-react-ssg";
import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import RootLayout from "./components/RootLayout.tsx";

// vite-react-ssg lädt diese Module zur Build-Zeit (await), bevor es die Seite
// vorrendert – React.lazy/Suspense würde bei renderToString fehlschlagen. Wir
// mappen den Default-Export der Seiten auf die von react-router erwartete
// `Component`-Konvention.
type PageModule = { default: ComponentType };
const page = (importer: () => Promise<PageModule>) => async () => ({
    Component: (await importer()).default
});

export const routes: RouteRecord[] = [
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { index: true, lazy: page(() => import("./pages/Home.tsx")) },
            { path: "home", element: <Navigate to="/" replace /> },
            { path: "login", lazy: page(() => import("./pages/Login.tsx")) },
            { path: "signup", lazy: page(() => import("./pages/Signup.tsx")) },
            { path: "welcome", lazy: page(() => import("./pages/Onboarding.tsx")) },
            { path: "email-verification", lazy: page(() => import("./pages/EmailVerification.tsx")) },
            { path: "dashboard", lazy: page(() => import("./pages/Dashboard.tsx")) },
            { path: "contact", lazy: page(() => import("./pages/Contact.tsx")) },
            { path: "profile", lazy: page(() => import("./pages/Profile.tsx")) },
            { path: "absences", lazy: page(() => import("./pages/AllAbsences.tsx")) },
            { path: "datenschutz", lazy: page(() => import("./pages/DatenschutzPage.tsx")) },
            { path: "bbzw-absenzformular", lazy: page(() => import("./pages/BbzwAbsenzformular.tsx")) },
            { path: "bbzw-absenzen-entschuldigen", lazy: page(() => import("./pages/BbzwAbsenzenEntschuldigen.tsx")) },
            { path: "support", lazy: page(() => import("./pages/Support.tsx")) },
            { path: "demo", lazy: page(() => import("./pages/Demo.tsx")) },
            { path: "*", lazy: page(() => import("./pages/NotFound.tsx")) }
        ]
    }
];
